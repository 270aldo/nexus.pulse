import os
import pathlib
import json
import logging
import dotenv
from fastapi import FastAPI, APIRouter, Depends

from app.demo_data import is_demo_mode, load_demo_dataset
from app.middleware import (
    CORSSecurityMiddleware,
    GlobalErrorHandler,
    InputSanitizationMiddleware,
    RateLimitingMiddleware,
    SecurityHeadersMiddleware,
)

dotenv.load_dotenv()

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

from app.utils.auth import AuthConfig, get_authorized_user


def get_router_config() -> dict:
    """Return the router configuration or an empty dict if not found."""
    config_path = pathlib.Path("routers.json")

    if not config_path.exists():
        # Missing config is not fatal; just return an empty configuration
        return {}

    try:
        with config_path.open() as f:
            return json.load(f)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid router configuration: {exc}") from exc


def is_auth_disabled(router_config: dict | None, name: str) -> bool:
    """Return ``True`` if auth is disabled for the given router."""
    if not isinstance(router_config, dict):
        return False

    return (
        router_config.get("routers", {})
        .get(name, {})
        .get("disableAuth", False)
    )


def import_api_routers() -> APIRouter:
    """Create top level router including all user defined endpoints."""
    routes = APIRouter(prefix="/routes")

    router_config = get_router_config()

    src_path = pathlib.Path(__file__).parent

    # Import API routers from "src/app/apis/*/__init__.py"
    apis_path = src_path / "app" / "apis"

    api_names = [
        p.relative_to(apis_path).parent.as_posix()
        for p in apis_path.glob("*/__init__.py")
    ]

    api_module_prefix = "app.apis."

    for name in api_names:
        # Skip demo endpoints in non-demo environments to avoid leaking mock data
        if name == "demo" and not is_demo_mode():
            logger.info("Skipping demo routers (STAGING_DEMO_MODE is disabled)")
            continue
        logger.info("Importing API: %s", name)
        try:
            api_module = __import__(api_module_prefix + name, fromlist=[name])
            api_router = getattr(api_module, "router", None)
            if isinstance(api_router, APIRouter):
                routes.include_router(
                    api_router,
                    dependencies=(
                        []
                        if is_auth_disabled(router_config, name)
                        else [Depends(get_authorized_user)]
                    ),
                )
        except Exception as e:
            logger.exception(e)
            continue

    logger.debug(routes.routes)

    return routes


def get_firebase_config() -> dict | None:
    extensions = os.environ.get("DATABUTTON_EXTENSIONS", "[]")
    extensions = json.loads(extensions)

    for ext in extensions:
        if ext["name"] == "firebase-auth":
            return ext["config"]["firebaseConfig"]

    return None


def _configure_middlewares(app: FastAPI) -> None:
    """Attach shared middleware stack including security, CORS and rate limiting."""
    allowed_origins = os.getenv("ALLOWED_ORIGINS")
    origins = [o.strip() for o in allowed_origins.split(",")] if allowed_origins else None

    app.add_middleware(GlobalErrorHandler)
    app.add_middleware(InputSanitizationMiddleware)
    app.add_middleware(CORSSecurityMiddleware, allowed_origins=origins)
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RateLimitingMiddleware)


def create_app() -> FastAPI:
    """Create the app. This is called by uvicorn with the factory option to construct the app object."""
    app = FastAPI()

    if is_demo_mode():
        load_demo_dataset()

    app.include_router(import_api_routers())

    _configure_middlewares(app)

    for route in app.routes:
        if hasattr(route, "methods"):
            for method in route.methods:
                logger.debug("%s %s", method, route.path)

    firebase_config = get_firebase_config()

    if firebase_config is None:
        logger.info("No firebase config found")
        app.state.auth_config = None
    else:
        logger.info("Firebase config found")
        auth_config = {
            "jwks_url": "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
            "audience": firebase_config["projectId"],
            "header": "authorization",
        }

        app.state.auth_config = AuthConfig(**auth_config)

    return app


app = create_app()
