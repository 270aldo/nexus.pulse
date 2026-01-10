"""
Rate limiting middleware for NGX Pulse Backend
Provides rate limiting and abuse protection for API endpoints
"""

import time
import logging
from typing import Dict, Optional, Any, List
from datetime import datetime, timedelta
from collections import defaultdict, deque
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from starlette.responses import JSONResponse

logger = logging.getLogger(__name__)

class RateLimitStore:
    """In-memory rate limit store (in production, use Redis)"""
    
    def __init__(self):
        self._store: Dict[str, deque] = defaultdict(deque)
        self._cleanup_interval = 60  # seconds
        self._last_cleanup = time.time()
    
    def _cleanup_expired(self, current_time: float, window_seconds: int):
        """Remove expired entries to prevent memory leaks"""
        if current_time - self._last_cleanup < self._cleanup_interval:
            return
            
        cutoff_time = current_time - window_seconds
        for key in list(self._store.keys()):
            # Remove old entries
            while self._store[key] and self._store[key][0] < cutoff_time:
                self._store[key].popleft()
            
            # Remove empty queues
            if not self._store[key]:
                del self._store[key]
        
        self._last_cleanup = current_time
    
    def add_request(self, key: str, current_time: float):
        """Add a request timestamp for the given key"""
        self._store[key].append(current_time)
    
    def get_request_count(self, key: str, window_seconds: int, current_time: float) -> int:
        """Get the number of requests within the time window"""
        self._cleanup_expired(current_time, window_seconds)
        
        cutoff_time = current_time - window_seconds
        requests = self._store[key]
        
        # Count requests within the window
        count = 0
        for timestamp in reversed(requests):
            if timestamp >= cutoff_time:
                count += 1
            else:
                break
        
        return count

class RateLimitRule:
    """Rate limiting rule configuration"""
    
    def __init__(
        self,
        name: str,
        limit: int,
        window_seconds: int,
        scope: str = "ip",  # "ip", "user", "endpoint"
        paths: Optional[List[str]] = None,
        methods: Optional[List[str]] = None,
        exempt_ips: Optional[List[str]] = None,
        burst_limit: Optional[int] = None
    ):
        self.name = name
        self.limit = limit
        self.window_seconds = window_seconds
        self.scope = scope
        self.paths = paths or []
        self.methods = methods or ["GET", "POST", "PUT", "DELETE", "PATCH"]
        self.exempt_ips = exempt_ips or []
        self.burst_limit = burst_limit or limit
    
    def applies_to(self, request: Request) -> bool:
        """Check if this rule applies to the request"""
        # Check method
        if request.method not in self.methods:
            return False
        
        # Check path
        if self.paths:
            return any(request.url.path.startswith(path) for path in self.paths)
        
        return True
    
    def get_key(self, request: Request) -> str:
        """Generate rate limiting key for the request"""
        if self.scope == "ip":
            client_ip = request.client.host if request.client else "unknown"
            return f"ip:{client_ip}:{self.name}"
        elif self.scope == "user":
            user_id = getattr(request.state, 'user_id', 'anonymous')
            return f"user:{user_id}:{self.name}"
        elif self.scope == "endpoint":
            return f"endpoint:{request.url.path}:{self.name}"
        else:
            return f"global:{self.name}"

class RateLimitingMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware with configurable rules"""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.store = RateLimitStore()
        self.rules = self._setup_default_rules()
        self.blocked_ips: Dict[str, float] = {}  # IP -> blocked_until_timestamp
        self.stats = {
            "total_requests": 0,
            "blocked_requests": 0,
            "rules_triggered": defaultdict(int)
        }
    
    def _setup_default_rules(self) -> List[RateLimitRule]:
        """Setup default rate limiting rules"""
        return [
            # Global API rate limit
            RateLimitRule(
                name="api_global",
                limit=1000,
                window_seconds=3600,  # 1000 requests per hour
                scope="ip",
                paths=["/api", "/routes"]
            ),
            
            # Authentication endpoints (stricter)
            RateLimitRule(
                name="auth_endpoints",
                limit=10,
                window_seconds=300,  # 10 requests per 5 minutes
                scope="ip",
                paths=["/api/auth", "/routes/auth"],
                burst_limit=3
            ),
            
            # AI endpoints (resource intensive)
            RateLimitRule(
                name="ai_endpoints",
                limit=50,
                window_seconds=3600,  # 50 requests per hour
                scope="user",
                paths=["/api/ai", "/routes/ai", "/api/chat"]
            ),
            
            # User data endpoints
            RateLimitRule(
                name="user_data",
                limit=500,
                window_seconds=3600,  # 500 requests per hour
                scope="user",
                paths=[
                    "/api/health_data",
                    "/api/nutrition",
                    "/api/training",
                    "/routes/api/v1/healthkit",
                    "/routes/biometrics",
                    "/routes/nutrition",
                    "/routes/training",
                ]
            ),
            
            # Burst protection (short window)
            RateLimitRule(
                name="burst_protection",
                limit=20,
                window_seconds=60,  # 20 requests per minute
                scope="ip"
            )
        ]
    
    async def dispatch(self, request: Request, call_next):
        self.stats["total_requests"] += 1
        current_time = time.time()
        
        # Check if IP is currently blocked
        client_ip = request.client.host if request.client else "unknown"
        if self._is_ip_blocked(client_ip, current_time):
            self.stats["blocked_requests"] += 1
            return self._create_rate_limit_response(
                "IP blocked due to excessive requests",
                retry_after=int(self.blocked_ips[client_ip] - current_time)
            )
        
        # Check rate limits
        for rule in self.rules:
            if not rule.applies_to(request):
                continue
            
            # Skip if IP is exempt
            if client_ip in rule.exempt_ips:
                continue
            
            key = rule.get_key(request)
            request_count = self.store.get_request_count(key, rule.window_seconds, current_time)
            
            if request_count >= rule.limit:
                self.stats["blocked_requests"] += 1
                self.stats["rules_triggered"][rule.name] += 1
                
                # Block IP temporarily for severe violations
                if request_count >= rule.limit * 2:
                    self._block_ip(client_ip, current_time)
                
                logger.warning(
                    f"Rate limit exceeded for {key}: {request_count}/{rule.limit} "
                    f"requests in {rule.window_seconds}s window"
                )
                
                return self._create_rate_limit_response(
                    f"Rate limit exceeded for {rule.name}",
                    retry_after=rule.window_seconds
                )
        
        # Record the request
        for rule in self.rules:
            if rule.applies_to(request):
                key = rule.get_key(request)
                self.store.add_request(key, current_time)
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers
        response.headers["X-RateLimit-Remaining"] = str(self._get_remaining_requests(request, current_time))
        response.headers["X-RateLimit-Reset"] = str(int(current_time + 3600))
        
        return response
    
    def _is_ip_blocked(self, ip: str, current_time: float) -> bool:
        """Check if IP is currently blocked"""
        if ip in self.blocked_ips:
            if current_time >= self.blocked_ips[ip]:
                del self.blocked_ips[ip]
                return False
            return True
        return False
    
    def _block_ip(self, ip: str, current_time: float, duration: int = 900):
        """Block IP for specified duration (default 15 minutes)"""
        self.blocked_ips[ip] = current_time + duration
        logger.warning(f"Temporarily blocked IP {ip} for {duration} seconds")
    
    def _get_remaining_requests(self, request: Request, current_time: float) -> int:
        """Get remaining requests for the most restrictive applicable rule"""
        min_remaining = float('inf')
        
        for rule in self.rules:
            if rule.applies_to(request):
                key = rule.get_key(request)
                used = self.store.get_request_count(key, rule.window_seconds, current_time)
                remaining = max(0, rule.limit - used)
                min_remaining = min(min_remaining, remaining)
        
        return int(min_remaining) if min_remaining != float('inf') else 1000
    
    def _create_rate_limit_response(self, message: str, retry_after: int) -> JSONResponse:
        """Create rate limit exceeded response"""
        return JSONResponse(
            status_code=429,
            content={
                "success": False,
                "error": {
                    "message": message,
                    "code": "RATE_LIMIT_EXCEEDED",
                    "retry_after": retry_after,
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }
            },
            headers={
                "Retry-After": str(retry_after),
                "X-RateLimit-Limit": "1000",
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(int(time.time() + retry_after))
            }
        )
    
    def get_stats(self) -> Dict[str, Any]:
        """Get rate limiting statistics"""
        return {
            "total_requests": self.stats["total_requests"],
            "blocked_requests": self.stats["blocked_requests"],
            "block_rate": self.stats["blocked_requests"] / max(1, self.stats["total_requests"]),
            "rules_triggered": dict(self.stats["rules_triggered"]),
            "blocked_ips_count": len(self.blocked_ips),
            "store_size": len(self.store._store)
        }
    
    def reset_stats(self):
        """Reset statistics"""
        self.stats = {
            "total_requests": 0,
            "blocked_requests": 0,
            "rules_triggered": defaultdict(int)
        }

# Global instance for accessing rate limiter stats
rate_limiter_instance: Optional[RateLimitingMiddleware] = None

def get_rate_limiter() -> Optional[RateLimitingMiddleware]:
    """Get the global rate limiter instance"""
    return rate_limiter_instance

def set_rate_limiter(limiter: RateLimitingMiddleware):
    """Set the global rate limiter instance"""
    global rate_limiter_instance
    rate_limiter_instance = limiter
