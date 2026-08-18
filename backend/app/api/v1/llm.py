from fastapi import APIRouter, HTTPException
from app.models.schemas import ScriptGenerateRequest, ScriptData
from app.services.llm_service import llm_service

router = APIRouter(prefix="/llm", tags=["llm"])

@router.post("/generate-script", response_model=ScriptData)
async def generate_script(request: ScriptGenerateRequest):
    """Generates an editable multi-scene short video script with scene breakdown."""
    try:
        script = await llm_service.generate_script(
            prompt=request.prompt,
            tone=request.tone,
            duration=request.duration,
            language=request.language
        )
        return script
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate script: {str(e)}")
