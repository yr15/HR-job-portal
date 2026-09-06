from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")

DEFAULT_PAGE_SIZE = 10
MAX_PAGE_SIZE = 50


class Page(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
