from pydantic import BaseModel, Field


class TrainRequest(BaseModel):
    algorithm: str = Field(
        ...,
        pattern="^(qlearning|monte_carlo|sarsa|expected_sarsa|double_qlearning)$",
    )
    episodes: int = Field(default=100_000, ge=1_000, le=1_000_000)
    learning_rate: float = Field(default=0.01, gt=0, le=1)
    discount_factor: float = Field(default=0.95, gt=0, le=1)
    epsilon_start: float = Field(default=1.0, gt=0, le=1)
    epsilon_end: float = Field(default=0.1, ge=0, le=1)
    model_name: str = Field(default="")


class TrainResponse(BaseModel):
    job_id: str


class JobStatusResponse(BaseModel):
    job_id: str
    status: str  # "running" | "complete" | "failed"
    progress: float
    model_id: str | None = None
    error: str | None = None
