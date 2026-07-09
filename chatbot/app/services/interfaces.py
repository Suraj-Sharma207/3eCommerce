from abc import ABC, abstractmethod
from typing import Any
from app.models.schema import ChatResponse, ChatRequest

class BaseDetector(ABC):
    """Abstract interface for all message detectors in the pipeline."""
    
    @abstractmethod
    def detect(self, request: Any) -> Any:
        """Analyze the input request and return a detection result (bool or object)."""
        pass

class BaseHandler(ABC):
    """Abstract interface for all message response handlers."""
    
    @abstractmethod
    def handle(self, request: ChatRequest) -> ChatResponse:
        """Produce the chatbot response payload for the given request."""
        pass
