from app.services.chatbot import ChatbotService
from app.models.schema import ChatRequest, ConversationMetadata, PendingState

service = ChatbotService()
req = ChatRequest(
    message="1112k",
    metadata=ConversationMetadata(
        pendingState=PendingState(awaiting="budget", search_term="bed", category=None)
    )
)
res = service.process_message(req)
print("Type:", res.type)
print("Reply:", res.reply)
if res.products:
    for p in res.products:
        print(p["name"])
