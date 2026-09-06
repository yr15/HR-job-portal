import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.error_handlers import register_exception_handlers
from app.routers import applications, auth, candidates, health, hr, jobs, messages

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    logger.info("HireHub API starting up (environment=%s)", settings.environment)
    yield


app = FastAPI(title="HireHub API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(health.router)
app.include_router(auth.router, prefix="/api/v1")
app.include_router(jobs.router, prefix="/api/v1")
app.include_router(hr.router, prefix="/api/v1")
app.include_router(applications.router, prefix="/api/v1")
app.include_router(candidates.router, prefix="/api/v1")
app.include_router(messages.router, prefix="/api/v1")
