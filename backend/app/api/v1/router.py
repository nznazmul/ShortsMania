from fastapi import APIRouter
from app.api.v1.tasks import router as tasks_router
from app.api.v1.llm import router as llm_router
from app.api.v1.media import router as media_router
from app.api.v1.settings import router as settings_router

api_router = APIRouter(prefix="/v1")
api_router.include_router(tasks_router)
api_router.include_router(llm_router)
api_router.include_router(media_router)
api_router.include_router(settings_router)
