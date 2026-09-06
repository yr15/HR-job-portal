import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class BulkMessageRequest(BaseModel):
    candidate_ids: list[uuid.UUID] = Field(min_length=1, max_length=200)
    subject: str = Field(min_length=1, max_length=255)
    body: str = Field(min_length=1, max_length=5000)


class BulkMessageResponse(BaseModel):
    sent_count: int


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    subject: str
    body: str
    sent_at: datetime
    read_at: datetime | None
    sender_name: str
    sender_company: str | None
