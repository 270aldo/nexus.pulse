"""
Global error handling middleware for NGX Pulse Backend
Provides centralized error handling, logging, and standardized API responses
"""

import logging
import traceback
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

# Configure logger
logger = logging.getLogger(__name__)

class ErrorResponse:
    """Standardized error response format"""
    
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_code: Optional[str] = None,
        trace_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or f"ERR_{status_code}"
        self.trace_id = trace_id or self._generate_trace_id()
        self.details = details or {}
        self.timestamp = datetime.utcnow().isoformat() + "Z"
    
    def _generate_trace_id(self) -> str:
        """Generate a unique trace ID for error tracking"""
        return f"trace_{int(datetime.utcnow().timestamp())}_{str(uuid.uuid4())[:8]}"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert error response to dictionary"""
        response = {
            "success": False,
            "error": {
                "message": self.message,
                "code": self.error_code,
                "trace_id": self.trace_id,
                "timestamp": self.timestamp
            }
        }
        
        if self.details:
            response["error"]["details"] = self.details
            
        return response

class GlobalErrorHandler(BaseHTTPMiddleware):
    """Global error handling middleware"""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.error_stats = {
            "total_errors": 0,
            "errors_by_status": {},
            "last_errors": []
        }
    
    async def dispatch(self, request: Request, call_next):
        trace_id = request.headers.get("X-Trace-ID") or self._generate_trace_id()
        
        try:
            # Add trace ID to request state
            request.state.trace_id = trace_id
            
            # Process request
            response = await call_next(request)
            
            # Add trace ID to response headers
            response.headers["X-Trace-ID"] = trace_id
            
            return response
            
        except HTTPException as exc:
            # Handle known HTTP exceptions
            return await self._handle_http_exception(exc, trace_id, request)
            
        except Exception as exc:
            # Handle unexpected exceptions
            return await self._handle_unexpected_exception(exc, trace_id, request)
    
    def _generate_trace_id(self) -> str:
        """Generate a unique trace ID"""
        return f"trace_{int(datetime.utcnow().timestamp())}_{str(uuid.uuid4())[:8]}"
    
    async def _handle_http_exception(
        self, 
        exc: HTTPException, 
        trace_id: str, 
        request: Request
    ) -> JSONResponse:
        """Handle known HTTP exceptions"""
        
        error_response = ErrorResponse(
            message=exc.detail,
            status_code=exc.status_code,
            trace_id=trace_id
        )
        
        # Log the error
        await self._log_error(
            error=exc,
            trace_id=trace_id,
            request=request,
            status_code=exc.status_code
        )
        
        # Update error statistics
        self._update_error_stats(exc.status_code, error_response.to_dict())
        
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response.to_dict()
        )
    
    async def _handle_unexpected_exception(
        self, 
        exc: Exception, 
        trace_id: str, 
        request: Request
    ) -> JSONResponse:
        """Handle unexpected exceptions"""
        
        # Log full traceback for debugging
        logger.error(
            f"Unexpected error (trace_id: {trace_id}): {str(exc)}",
            extra={
                "trace_id": trace_id,
                "path": request.url.path,
                "method": request.method,
                "traceback": traceback.format_exc()
            }
        )
        
        # Create user-friendly error response
        error_response = ErrorResponse(
            message="Error interno del servidor. El equipo técnico ha sido notificado.",
            status_code=500,
            error_code="INTERNAL_SERVER_ERROR",
            trace_id=trace_id
        )
        
        # In development, include more details
        if request.app.debug:
            error_response.details = {
                "exception_type": type(exc).__name__,
                "exception_message": str(exc),
                "traceback": traceback.format_exc().split('\n')
            }
        
        # Update error statistics
        self._update_error_stats(500, error_response.to_dict())
        
        return JSONResponse(
            status_code=500,
            content=error_response.to_dict()
        )
    
    async def _log_error(
        self, 
        error: Exception, 
        trace_id: str, 
        request: Request, 
        status_code: int
    ) -> None:
        """Log error with context information"""
        
        log_data = {
            "trace_id": trace_id,
            "error_type": type(error).__name__,
            "error_message": str(error),
            "status_code": status_code,
            "path": request.url.path,
            "method": request.method,
            "user_agent": request.headers.get("user-agent"),
            "ip_address": request.client.host if request.client else None,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Add user ID if available
        if hasattr(request.state, 'user') and request.state.user:
            log_data["user_id"] = getattr(request.state.user, 'sub', None)
        
        # Log at appropriate level
        if status_code >= 500:
            logger.error(f"Server error: {error}", extra=log_data)
        elif status_code >= 400:
            logger.warning(f"Client error: {error}", extra=log_data)
        else:
            logger.info(f"Request error: {error}", extra=log_data)
    
    def _update_error_stats(self, status_code: int, error_data: Dict[str, Any]) -> None:
        """Update error statistics for monitoring"""
        
        self.error_stats["total_errors"] += 1
        
        # Update status code counts
        status_key = str(status_code)
        if status_key not in self.error_stats["errors_by_status"]:
            self.error_stats["errors_by_status"][status_key] = 0
        self.error_stats["errors_by_status"][status_key] += 1
        
        # Keep last 50 errors
        self.error_stats["last_errors"].append(error_data)
        if len(self.error_stats["last_errors"]) > 50:
            self.error_stats["last_errors"] = self.error_stats["last_errors"][-50:]
    
    def get_error_stats(self) -> Dict[str, Any]:
        """Get current error statistics"""
        return self.error_stats.copy()
    
    def reset_error_stats(self) -> None:
        """Reset error statistics"""
        self.error_stats = {
            "total_errors": 0,
            "errors_by_status": {},
            "last_errors": []
        }
        logger.info("Error statistics reset")

# Global instance for accessing error stats
global_error_handler: Optional[GlobalErrorHandler] = None

def get_error_handler() -> Optional[GlobalErrorHandler]:
    """Get the global error handler instance"""
    return global_error_handler

def set_error_handler(handler: GlobalErrorHandler) -> None:
    """Set the global error handler instance"""
    global global_error_handler
    global_error_handler = handler