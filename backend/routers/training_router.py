from __future__ import annotations

import uuid

from fastapi import APIRouter, BackgroundTasks, HTTPException

from backend.schemas.training_schemas import JobStatusResponse, TrainRequest, TrainResponse
from backend.training.job_manager import job_manager
from backend.training.trainer import run_training

router = APIRouter(prefix="/train", tags=["training"])


@router.post("", response_model=TrainResponse, status_code=202)
def start_training(request: TrainRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    job_manager.create_job(job_id)
    background_tasks.add_task(run_training, job_id, request)
    return TrainResponse(job_id=job_id)


@router.get("/{job_id}", response_model=JobStatusResponse)
def get_training_status(job_id: str):
    job = job_manager.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobStatusResponse(
        job_id=job.job_id,
        status=job.status,
        progress=job.progress,
        model_id=job.model_id,
        error=job.error,
    )
