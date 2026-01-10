"""
Security headers middleware for NGX Pulse Backend
Adds security headers including CSP, HSTS, and other security protections
"""

import logging
from typing import Dict, List, Optional
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

logger = logging.getLogger(__name__)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers to all responses"""
    
    def __init__(
        self,
        app: ASGIApp,
        csp_policy: Optional[str] = None,
        hsts_max_age: int = 31536000,  # 1 year
        enable_hsts: bool = True,
        enable_xss_protection: bool = True,
        enable_content_type_options: bool = True,
        enable_frame_options: bool = True,
        enable_referrer_policy: bool = True,
        permitted_cross_domain_policies: str = "none",
        custom_headers: Optional[Dict[str, str]] = None
    ):
        super().__init__(app)
        self.csp_policy = csp_policy or self._get_default_csp_policy()
        self.hsts_max_age = hsts_max_age
        self.enable_hsts = enable_hsts
        self.enable_xss_protection = enable_xss_protection
        self.enable_content_type_options = enable_content_type_options
        self.enable_frame_options = enable_frame_options
        self.enable_referrer_policy = enable_referrer_policy
        self.permitted_cross_domain_policies = permitted_cross_domain_policies
        self.custom_headers = custom_headers or {}
    
    def _get_default_csp_policy(self) -> str:
        """Get default Content Security Policy"""
        return (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' "
            "https://fonts.googleapis.com https://fonts.gstatic.com; "
            "style-src 'self' 'unsafe-inline' "
            "https://fonts.googleapis.com https://fonts.gstatic.com; "
            "font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; "
            "img-src 'self' data: https: blob:; "
            "connect-src 'self' "
            "https://*.supabase.co https://api.openai.com "
            "wss://*.supabase.co; "
            "media-src 'self'; "
            "object-src 'none'; "
            "frame-src 'none'; "
            "base-uri 'self'; "
            "form-action 'self'; "
            "frame-ancestors 'none'; "
            "upgrade-insecure-requests"
        )
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Add security headers
        self._add_security_headers(response, request)
        
        return response
    
    def _add_security_headers(self, response, request: Request):
        """Add security headers to the response"""
        
        # Content Security Policy
        if self.csp_policy:
            response.headers["Content-Security-Policy"] = self.csp_policy
        
        # HTTP Strict Transport Security (HTTPS only)
        if self.enable_hsts and request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = (
                f"max-age={self.hsts_max_age}; includeSubDomains; preload"
            )
        
        # X-XSS-Protection
        if self.enable_xss_protection:
            response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # X-Content-Type-Options
        if self.enable_content_type_options:
            response.headers["X-Content-Type-Options"] = "nosniff"
        
        # X-Frame-Options
        if self.enable_frame_options:
            response.headers["X-Frame-Options"] = "DENY"
        
        # Referrer Policy
        if self.enable_referrer_policy:
            response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # X-Permitted-Cross-Domain-Policies
        response.headers["X-Permitted-Cross-Domain-Policies"] = self.permitted_cross_domain_policies
        
        # Additional security headers
        response.headers["X-Robots-Tag"] = "noindex, nofollow, nosnippet, noarchive"
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        
        # Remove server information
        if "Server" in response.headers:
            del response.headers["Server"]
        if "X-Powered-By" in response.headers:
            del response.headers["X-Powered-By"]
        
        # Custom headers
        for header, value in self.custom_headers.items():
            response.headers[header] = value
        
        # Security headers for API responses
        if request.url.path.startswith(("/api", "/routes")):
            response.headers["X-API-Version"] = "1.0"
            response.headers["X-Request-ID"] = getattr(request.state, 'trace_id', 'unknown')

class CORSSecurityMiddleware(BaseHTTPMiddleware):
    """Enhanced CORS middleware with security considerations"""
    
    def __init__(
        self,
        app: ASGIApp,
        allowed_origins: List[str] = None,
        allowed_methods: List[str] = None,
        allowed_headers: List[str] = None,
        allow_credentials: bool = True,
        max_age: int = 86400,  # 24 hours
        expose_headers: List[str] = None
    ):
        super().__init__(app)
        self.allowed_origins = allowed_origins or [
            "http://localhost:5173",
            "http://localhost:3000",
            "https://ngx-pulse.netlify.app",  # Example production domain
            "https://ngx-pulse.vercel.app"   # Example production domain
        ]
        self.allowed_methods = allowed_methods or [
            "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"
        ]
        self.allowed_headers = allowed_headers or [
            "Accept",
            "Accept-Language",
            "Content-Language",
            "Content-Type",
            "Authorization",
            "X-Requested-With",
            "X-Trace-ID"
        ]
        self.allow_credentials = allow_credentials
        self.max_age = max_age
        self.expose_headers = expose_headers or [
            "X-Trace-ID",
            "X-RateLimit-Remaining",
            "X-RateLimit-Reset"
        ]
    
    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin")
        
        # Handle preflight requests
        if request.method == "OPTIONS":
            return self._handle_preflight(request, origin)
        
        # Process the request
        response = await call_next(request)
        
        # Add CORS headers
        self._add_cors_headers(response, origin)
        
        return response
    
    def _handle_preflight(self, request: Request, origin: str):
        """Handle CORS preflight requests"""
        from starlette.responses import Response
        
        response = Response()
        
        if self._is_origin_allowed(origin):
            self._add_cors_headers(response, origin)
            
            # Handle preflight-specific headers
            requested_method = request.headers.get("access-control-request-method")
            if requested_method in self.allowed_methods:
                response.headers["Access-Control-Allow-Methods"] = ", ".join(self.allowed_methods)
            
            requested_headers = request.headers.get("access-control-request-headers")
            if requested_headers:
                # Validate requested headers
                requested_headers_list = [h.strip() for h in requested_headers.split(",")]
                allowed_requested_headers = [
                    h for h in requested_headers_list 
                    if h.lower() in [ah.lower() for ah in self.allowed_headers]
                ]
                if allowed_requested_headers:
                    response.headers["Access-Control-Allow-Headers"] = ", ".join(allowed_requested_headers)
            
            response.headers["Access-Control-Max-Age"] = str(self.max_age)
        
        return response
    
    def _add_cors_headers(self, response, origin: str):
        """Add CORS headers to response"""
        if self._is_origin_allowed(origin):
            response.headers["Access-Control-Allow-Origin"] = origin
            
            if self.allow_credentials:
                response.headers["Access-Control-Allow-Credentials"] = "true"
            
            if self.expose_headers:
                response.headers["Access-Control-Expose-Headers"] = ", ".join(self.expose_headers)
    
    def _is_origin_allowed(self, origin: str) -> bool:
        """Check if origin is allowed"""
        if not origin:
            return False
        
        # Check exact matches
        if origin in self.allowed_origins:
            return True
        
        # Check for wildcard patterns (be careful with this in production)
        for allowed_origin in self.allowed_origins:
            if allowed_origin == "*":
                logger.warning("Wildcard CORS origin detected - this should not be used in production")
                return True
            if allowed_origin.endswith("*"):
                pattern = allowed_origin[:-1]
                if origin.startswith(pattern):
                    return True
        
        return False

class InputSanitizationMiddleware(BaseHTTPMiddleware):
    """Middleware for basic input sanitization and validation"""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.max_body_size = 10 * 1024 * 1024  # 10MB
        self.suspicious_patterns = [
            r"<script",
            r"javascript:",
            r"on\w+\s*=",
            r"sql\s+(select|insert|update|delete|drop|create|alter)",
            r"union\s+select",
            r"eval\s*\(",
            r"exec\s*\(",
        ]
    
    async def dispatch(self, request: Request, call_next):
        # Check content length
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > self.max_body_size:
            from starlette.responses import JSONResponse
            return JSONResponse(
                status_code=413,
                content={
                    "success": False,
                    "error": {
                        "message": "Request body too large",
                        "code": "PAYLOAD_TOO_LARGE"
                    }
                }
            )
        
        # Log suspicious requests
        self._log_suspicious_request(request)
        
        response = await call_next(request)
        return response
    
    def _log_suspicious_request(self, request: Request):
        """Log potentially suspicious requests"""
        import re
        
        # Check URL for suspicious patterns
        url_str = str(request.url).lower()
        query_params = str(request.query_params).lower()
        
        for pattern in self.suspicious_patterns:
            if re.search(pattern, url_str, re.IGNORECASE) or re.search(pattern, query_params, re.IGNORECASE):
                logger.warning(
                    f"Suspicious request detected: {request.method} {request.url.path} "
                    f"from {request.client.host if request.client else 'unknown'}"
                )
                break
