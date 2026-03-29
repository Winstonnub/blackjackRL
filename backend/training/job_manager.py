from __future__ import annotations

from dataclasses import dataclass, field
from threading import Lock


@dataclass
class JobStatus:
    job_id: str
    status: str = "running"  # running | complete | failed
    progress: float = 0.0
    model_id: str | None = None
    error: str | None = None


class JobManager:
    def __init__(self) -> None:
        self._jobs: dict[str, JobStatus] = {}
        self._lock = Lock()

    def create_job(self, job_id: str) -> JobStatus:
        job = JobStatus(job_id=job_id)
        with self._lock:
            self._jobs[job_id] = job
        return job

    def get_job(self, job_id: str) -> JobStatus | None:
        with self._lock:
            return self._jobs.get(job_id)

    def update_progress(self, job_id: str, progress: float) -> None:
        with self._lock:
            if job_id in self._jobs:
                self._jobs[job_id].progress = round(progress, 3)

    def complete_job(self, job_id: str, model_id: str) -> None:
        with self._lock:
            if job_id in self._jobs:
                self._jobs[job_id].status = "complete"
                self._jobs[job_id].progress = 1.0
                self._jobs[job_id].model_id = model_id

    def fail_job(self, job_id: str, error: str) -> None:
        with self._lock:
            if job_id in self._jobs:
                self._jobs[job_id].status = "failed"
                self._jobs[job_id].error = error


# Singleton
job_manager = JobManager()
