import os
import sys
from pathlib import Path
from loguru import logger
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer

# Add the project root to sys.path so we can import app modules
sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.config import get_settings

def seed_qdrant():
    settings = get_settings()
    collection_name = settings.intent_collection_name
    
    logger.info(f"Connecting to Qdrant at {settings.qdrant_url}...")
    client = QdrantClient(
        url=settings.qdrant_url, 
        api_key=settings.qdrant_api_key or None,
        timeout=60
    )
    
    logger.info("Loading SentenceTransformer model 'all-MiniLM-L6-v2'...")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    logger.info(f"Recreating collection '{collection_name}' with dimension 384...")
    if client.collection_exists(collection_name):
        client.delete_collection(collection_name)
        
    client.create_collection(
        collection_name=collection_name,
        vectors_config=VectorParams(size=384, distance=Distance.COSINE),
    )
    
    intent_examples = {
        "identity": [
            "who are you",
            "tell me about yourself",
            "who u are",
            "what can you do",
            "what are your services",
            "tell me about your services",
            "explain what you do"
        ],
        "order_status": [
            "where is my order",
            "track my package",
            "order status",
            "check shipping status",
            "i want to track my delivery",
            "when will my order arrive",
            "has my order shipped yet"
        ],
        "product_search": [
            "find a sofa",
            "i want to buy a wooden table",
            "search for beds",
            "show me living room decor",
            "do you have recliners",
            "looking for outdoor furniture",
            "i need a new chair"
        ],
        "faq_refund": [
            "do you have a return policy",
            "how to return an item",
            "can i get a refund",
            "money back guarantee",
            "exchange policy",
            "return this sofa",
            "what is your refund policy"
        ],
        "faq_hours": [
            "what are your business hours",
            "when do you open",
            "are you open on weekends",
            "closing time",
            "store hours",
            "when do you close"
        ],
        "faq_password": [
            "how do i reset my password",
            "forgot password help",
            "cannot log in",
            "i lost my password",
            "password recovery"
        ],
        "faq_contact": [
            "how to contact support",
            "customer service email",
            "support phone number",
            "i need to talk to a human",
            "contact us"
        ],
        "faq_payment": [
            "what payment methods do you accept",
            "can i pay with paypal",
            "do you take credit cards",
            "how can i pay",
            "accepted payment types"
        ],
        "faq_cancel": [
            "how to cancel my order",
            "cancel purchase",
            "stop my order",
            "i want to cancel my purchase",
            "can i cancel this"
        ]
    }
    
    points = []
    idx = 1
    logger.info("Generating embeddings and preparing payload...")
    for intent, examples in intent_examples.items():
        for example in examples:
            vector = model.encode(example).tolist()
            payload = {
                "intent": intent,
                "example": example
            }
            points.append(
                PointStruct(id=idx, vector=vector, payload=payload)
            )
            idx += 1
            
    logger.info(f"Upserting {len(points)} intent examples into Qdrant...")
    client.upsert(
        collection_name=collection_name,
        points=points
    )
    
    logger.info("Seeding complete! You can now test the semantic intent matcher.")

if __name__ == "__main__":
    seed_qdrant()
