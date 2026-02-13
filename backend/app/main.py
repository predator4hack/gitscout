import logging
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables BEFORE importing modules that use config
load_dotenv()

from .api.routes import router
from .api.chat_routes import router as chat_router
from .api.job_search_routes import router as job_search_router
from .api.profile_routes import router as profile_router
from .services.cache.search_cache import get_search_cache
from .services.firebase import initialize_firebase, is_firebase_initialized
from .config import config

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)-25s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

# Set log levels for different modules
logging.getLogger("gitscout").setLevel(logging.DEBUG)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)

logger = logging.getLogger("gitscout.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan events"""
    # Startup: Initialize Firebase
    try:
        initialize_firebase()
        if is_firebase_initialized():
            logger.info("✓ Firebase Admin SDK initialized successfully")
        else:
            logger.warning("⚠ Firebase initialization skipped (no credentials configured)")
    except Exception as e:
        logger.error(f"✗ Firebase initialization failed: {e}")
        # Continue without Firebase - some features may not work
        logger.warning("⚠ Continuing without Firebase - authentication disabled")

    # Startup: Initialize cache cleanup task
    cache = get_search_cache()
    cache.start_cleanup_task()
    logger.info("Search cache initialized with cleanup task")
    yield
    # Shutdown: cleanup happens automatically


# Create FastAPI app
app = FastAPI(
    title="GitScout API",
    description="GitHub candidate discovery API for recruiters",
    version="0.1.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(job_search_router, prefix="/api")
app.include_router(profile_router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "GitScout API",
        "version": "0.1.0",
        "docs": "/docs"
    }
