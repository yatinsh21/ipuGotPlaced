from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File, Header
from fastapi.responses import JSONResponse
from fastapi.middleware.gzip import GZipMiddleware
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import razorpay
import json
import cloudinary
import cloudinary.uploader
from clerk_backend_api import Clerk

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection with connection pooling
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(
    mongo_url,
    maxPoolSize=50,
    minPoolSize=10,
    maxIdleTimeMS=45000,
    connectTimeoutMS=10000,
    serverSelectionTimeoutMS=5000
)
db = client[os.environ['DB_NAME']]

# MongoDB-based cache collection
cache_collection = db.cache

# Clerk client
clerk_secret = os.environ.get('CLERK_SECRET_KEY', '')
if clerk_secret:
    clerk_client = Clerk(bearer_auth=clerk_secret)
else:
    clerk_client = None
    logging.warning("CLERK_SECRET_KEY not set")

# Cloudinary configuration
cloudinary.config(
    cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME', 'demo'),
    api_key=os.environ.get('CLOUDINARY_API_KEY', ''),
    api_secret=os.environ.get('CLOUDINARY_API_SECRET', '')
)

# Razorpay client
razorpay_client = razorpay.Client(auth=(
    os.environ.get('RAZORPAY_KEY_ID', ''), 
    os.environ.get('RAZORPAY_KEY_SECRET', '')
))

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    clerk_id: str
    email: str
    name: str
    picture: Optional[str] = None
    is_premium: bool = False
    is_admin: bool = False
    bookmarked_questions: List[str] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    bookmarked_questions: List[str] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Topic(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Question(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    topic_id: Optional[str] = None
    company_id: Optional[str] = None
    question: str
    answer: str
    difficulty: str
    tags: List[str] = []
    category: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Company(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    logo_url: Optional[str] = None
    question_count: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Experience(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    company_name: str
    role: str
    rounds: int
    experience: str
    status: str = "selected"
    posted_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CreateOrderRequest(BaseModel):
    amount: int

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

# MongoDB-based cache helper functions
def generate_cache_key(prefix: str, **kwargs) -> str:
    if not kwargs:
        return prefix
    params = "_".join(f"{k}:{v}" for k, v in sorted(kwargs.items()) if v is not None)
    return f"{prefix}_{params}" if params else prefix

async def get_cached_data(key: str):
    try:
        cached_doc = await cache_collection.find_one({"key": key})
        if cached_doc:
            if datetime.fromisoformat(cached_doc['expires_at']) > datetime.now(timezone.utc):
                return json.loads(cached_doc['data'])
            else:
                await cache_collection.delete_one({"key": key})
    except Exception as e:
        logging.warning(f"Cache get failed for {key}: {e}")
    return None

async def set_cached_data(key: str, data, ttl: int = 3600):
    try:
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=ttl)
        await cache_collection.update_one(
            {"key": key},
            {
                "$set": {
                    "key": key,
                    "data": json.dumps(data),
                    "expires_at": expires_at.isoformat(),
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
            },
            upsert=True
        )
    except Exception as e:
        logging.warning(f"Cache set failed for {key}: {e}")

async def invalidate_cache_pattern(pattern: str):
    try:
        regex_pattern = pattern.replace("*", ".*")
        await cache_collection.delete_many({"key": {"$regex": f"^{regex_pattern}$"}})
    except Exception as e:
        logging.warning(f"Cache invalidation failed for {pattern}: {e}")

# Auth dependency using Clerk
async def get_current_user(request: Request) -> Optional[User]:
    """Verify Clerk session token and get/create user"""
    authorization = request.headers.get('Authorization') or request.headers.get('authorization')
    
    if not authorization or not authorization.startswith('Bearer '):
        return None
    
    if not clerk_client:
        logging.error("Clerk client not initialized")
        return None
    
    token = authorization.split(' ')[1]
    
    try:
        # Decode JWT without verification to get clerk_user_id
        import jwt
        decoded = jwt.decode(token, options={"verify_signature": False})
        clerk_user_id = decoded.get('sub')
        
        if not clerk_user_id:
            return None
        
        # Get or create user in our database
        user_doc = await db.users.find_one({"clerk_id": clerk_user_id}, {"_id": 0})
        
        if not user_doc:
            # Get user info from Clerk
            try:
                clerk_user = clerk_client.users.get(user_id=clerk_user_id)
                
                # Create new user in our database
                new_user = {
                    "clerk_id": clerk_user_id,
                    "email": clerk_user.email_addresses[0].email_address if clerk_user.email_addresses else "",
                    "name": f"{clerk_user.first_name or ''} {clerk_user.last_name or ''}".strip() or "User",
                    "picture": clerk_user.image_url if hasattr(clerk_user, 'image_url') else None,
                    "is_premium": clerk_user.public_metadata.get('isPremium', False) if hasattr(clerk_user, 'public_metadata') else False,
                    "is_admin": clerk_user.public_metadata.get('isAdmin', False) if hasattr(clerk_user, 'public_metadata') else False,
                    "bookmarked_questions": [],
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await db.users.insert_one(new_user)
                user_doc = new_user
            except Exception as e:
                logging.error(f"Failed to get Clerk user: {e}")
                return None
        else:
            # Update user metadata from Clerk on each request
            try:
                clerk_user = clerk_client.users.get(user_id=clerk_user_id)
                is_premium = clerk_user.public_metadata.get('isPremium', False) if hasattr(clerk_user, 'public_metadata') else False
                is_admin = clerk_user.public_metadata.get('isAdmin', False) if hasattr(clerk_user, 'public_metadata') else False
                
                # Update if changed
                if user_doc.get('is_premium') != is_premium or user_doc.get('is_admin') != is_admin:
                    await db.users.update_one(
                        {"clerk_id": clerk_user_id},
                        {"$set": {"is_premium": is_premium, "is_admin": is_admin}}
                    )
                    user_doc['is_premium'] = is_premium
                    user_doc['is_admin'] = is_admin
            except Exception as e:
                logging.error(f"Failed to update user metadata: {e}")
        
        return User(**user_doc)
        
    except Exception as e:
        logging.error(f"Auth error: {e}")
        return None

async def require_auth(user: User = Depends(get_current_user)) -> User:
    """Require authenticated user"""
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user

async def require_premium(user: User = Depends(require_auth)) -> User:
    """Require premium user"""
    if not user.is_premium and not user.is_admin:
        raise HTTPException(status_code=403, detail="Premium subscription required")
    return user

async def require_admin(user: User = Depends(require_auth)) -> User:
    """Require admin user"""
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# Auth endpoints
@api_router.get("/auth/me")
async def get_current_user_info(user: User = Depends(get_current_user)):
    """Get current user info"""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user.model_dump()

# Free endpoints
@api_router.get("/topics", response_model=List[Topic])
async def get_topics():
    cache_key = "topics"
    cached = await get_cached_data(cache_key)
    if cached:
        return cached
    
    topics = await db.topics.find({}, {"_id": 0}).to_list(1000)
    await set_cached_data(cache_key, topics, ttl=7200)
    return topics

@api_router.get("/companies-preview", response_model=List[Company])
async def get_companies_preview():
    cache_key = "companies"
    cached = await get_cached_data(cache_key)
    if cached:
        return cached
    
    companies = await db.companies.find({}, {"_id": 0}).to_list(1000)
    await set_cached_data(cache_key, companies, ttl=7200)
    return companies

@api_router.get("/questions")
async def get_questions(topic_id: Optional[str] = None, difficulty: Optional[str] = None):
    cache_key = generate_cache_key("questions", topic_id=topic_id, difficulty=difficulty)
    cached = await get_cached_data(cache_key)
    if cached:
        return cached
    
    query = {"topic_id": {"$ne": None}}
    if topic_id:
        query["topic_id"] = topic_id
    if difficulty:
        query["difficulty"] = difficulty
    
    questions = await db.questions.find(query, {"_id": 0}).to_list(1000)
    await set_cached_data(cache_key, questions, ttl=3600)
    return questions

# Premium endpoints
@api_router.get("/companies", response_model=List[Company])
async def get_companies(user: User = Depends(require_auth)):
    if not user.is_premium and not user.is_admin:
        raise HTTPException(status_code=403, detail="Premium subscription required")
    
    cache_key = "companies"
    cached = await get_cached_data(cache_key)
    if cached:
        return cached
    
    companies = await db.companies.find({}, {"_id": 0}).to_list(1000)
    await set_cached_data(cache_key, companies, ttl=7200)
    return companies

@api_router.get("/company-questions/{company_id}")
async def get_company_questions(
    company_id: str, 
    category: Optional[str] = None,
    authorization: str = Header(None)
):
    user = await get_current_user(authorization) if authorization else None
    is_premium = user and (user.is_premium or user.is_admin)
    
    cache_key = generate_cache_key("company_questions", company_id=company_id, category=category)
    cached = await get_cached_data(cache_key)
    if cached:
        questions = cached
    else:
        query = {"company_id": company_id}
        if category:
            query["category"] = category
        
        questions = await db.questions.find(query, {"_id": 0}).to_list(1000)
        await set_cached_data(cache_key, questions, ttl=3600)
    
    if not is_premium and len(questions) > 3:
        preview_questions = questions[:3]
        locked_questions = [
            {**q, "answer": "🔒 Unlock premium to see the answer", "locked": True} 
            for q in questions[3:]
        ]
        return preview_questions + locked_questions
    
    return questions

@api_router.post("/bookmark/{question_id}")
async def toggle_bookmark(question_id: str, user: User = Depends(require_premium)):
    if question_id in user.bookmarked_questions:
        await db.users.update_one({"clerk_id": user.clerk_id}, {"$pull": {"bookmarked_questions": question_id}})
        await invalidate_cache_pattern(f"bookmarks_user:{user.clerk_id}")
        return {"bookmarked": False}
    else:
        await db.users.update_one({"clerk_id": user.clerk_id}, {"$addToSet": {"bookmarked_questions": question_id}})
        await invalidate_cache_pattern(f"bookmarks_user:{user.clerk_id}")
        return {"bookmarked": True}

@api_router.get("/bookmarks")
async def get_bookmarks(user: User = Depends(require_premium)):
    if not user.bookmarked_questions:
        return []
    
    cache_key = f"bookmarks_user:{user.clerk_id}"
    cached = await get_cached_data(cache_key)
    if cached:
        return cached
    
    questions = await db.questions.find({"id": {"$in": user.bookmarked_questions}}, {"_id": 0}).to_list(1000)
    await set_cached_data(cache_key, questions, ttl=1800)
    return questions

@api_router.get("/experiences", response_model=List[Experience])
async def get_experiences(company_id: Optional[str] = None):
    cache_key = generate_cache_key("experiences", company_id=company_id)
    cached = await get_cached_data(cache_key)
    if cached:
        return cached
    
    query = {}
    if company_id:
        query["company_id"] = company_id
    
    experiences = await db.experiences.find(query, {"_id": 0}).sort("posted_at", -1).to_list(1000)
    await set_cached_data(cache_key, experiences, ttl=3600)
    return experiences

# Payment endpoints
@api_router.post("/payment/create-order")
async def create_order(order_req: CreateOrderRequest, user: User = Depends(require_auth)):
    try:
        razor_order = razorpay_client.order.create({
            "amount": order_req.amount,
            "currency": "INR",
            "payment_capture": 1
        })
        return razor_order
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/payment/verify")
async def verify_payment(payment: VerifyPaymentRequest, user: User = Depends(require_auth)):
    try:
        params_dict = {
            'razorpay_order_id': payment.razorpay_order_id,
            'razorpay_payment_id': payment.razorpay_payment_id,
            'razorpay_signature': payment.razorpay_signature
        }
        razorpay_client.utility.verify_payment_signature(params_dict)
        
        # Update user to premium in MongoDB
        await db.users.update_one({"clerk_id": user.clerk_id}, {"$set": {"is_premium": True}})
        
        # Update Clerk user metadata
        if clerk_client:
            try:
                clerk_client.users.update_metadata(
                    user_id=user.clerk_id,
                    public_metadata={"isPremium": True}
                )
            except Exception as e:
                logging.error(f"Failed to update Clerk metadata: {e}")
        
        return {"success": True, "message": "Payment verified successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Payment verification failed")

# Admin endpoints
@api_router.get("/admin/stats")
async def get_admin_stats(user: User = Depends(require_admin)):
    total_users = await db.users.count_documents({})
    premium_users = await db.users.count_documents({"is_premium": True})
    total_questions = await db.questions.count_documents({})
    total_companies = await db.companies.count_documents({})
    total_experiences = await db.experiences.count_documents({})
    
    return {
        "total_users": total_users,
        "premium_users": premium_users,
        "total_questions": total_questions,
        "total_companies": total_companies,
        "total_experiences": total_experiences
    }

@api_router.get("/admin/users")
async def get_all_users(user: User = Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0}).to_list(10000)
    return users

@api_router.post("/admin/users/{user_id}/grant-admin")
async def grant_admin_access(user_id: str, current_user: User = Depends(require_admin)):
    target_user = await db.users.find_one({"clerk_id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.users.update_one({"clerk_id": user_id}, {"$set": {"is_admin": True, "is_premium": True}})
    
    return {"success": True, "message": f"Admin access granted to {target_user['email']}"}

@api_router.post("/admin/users/{user_id}/revoke-admin")
async def revoke_admin_access(user_id: str, current_user: User = Depends(require_admin)):
    target_user = await db.users.find_one({"clerk_id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_id == current_user.clerk_id:
        raise HTTPException(status_code=400, detail="Cannot revoke your own admin access")
    
    await db.users.update_one({"clerk_id": user_id}, {"$set": {"is_admin": False}})
    
    return {"success": True, "message": f"Admin access revoked from {target_user['email']}"}

@api_router.post("/admin/users/{user_id}/toggle-premium")
async def toggle_premium_status(user_id: str, current_user: User = Depends(require_admin)):
    target_user = await db.users.find_one({"clerk_id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if target_user.get('is_admin') and target_user.get('is_premium'):
        raise HTTPException(status_code=400, detail="Cannot remove premium status from admin users")
    
    new_premium_status = not target_user.get('is_premium', False)
    await db.users.update_one({"clerk_id": user_id}, {"$set": {"is_premium": new_premium_status}})
    
    status_text = "granted" if new_premium_status else "revoked"
    return {"success": True, "message": f"Premium access {status_text} for {target_user['email']}"}

# Admin CRUD - Topics
@api_router.post("/admin/topics")
async def create_topic(topic: Topic, user: User = Depends(require_admin)):
    await db.topics.insert_one(topic.model_dump())
    await invalidate_cache_pattern("topics*")
    return topic

@api_router.put("/admin/topics/{topic_id}")
async def update_topic(topic_id: str, topic: Topic, user: User = Depends(require_admin)):
    await db.topics.update_one({"id": topic_id}, {"$set": topic.model_dump()})
    await invalidate_cache_pattern("topics*")
    return topic

@api_router.delete("/admin/topics/{topic_id}")
async def delete_topic(topic_id: str, user: User = Depends(require_admin)):
    await db.topics.delete_one({"id": topic_id})
    await invalidate_cache_pattern("topics*")
    await invalidate_cache_pattern("questions*")
    return {"success": True}

# Admin CRUD - Questions
@api_router.get("/admin/questions")
async def get_all_questions(user: User = Depends(require_admin)):
    questions = await db.questions.find({}, {"_id": 0}).to_list(10000)
    return questions

@api_router.post("/admin/questions")
async def create_question(question: Question, user: User = Depends(require_admin)):
    await db.questions.insert_one(question.model_dump())
    
    await invalidate_cache_pattern("questions*")
    await invalidate_cache_pattern("company_questions*")
    await invalidate_cache_pattern("bookmarks*")
    
    if question.company_id:
        count = await db.questions.count_documents({"company_id": question.company_id})
        await db.companies.update_one({"id": question.company_id}, {"$set": {"question_count": count}})
        await invalidate_cache_pattern("companies*")
    
    return question

@api_router.put("/admin/questions/{question_id}")
async def update_question(question_id: str, question: Question, user: User = Depends(require_admin)):
    old_question = await db.questions.find_one({"id": question_id})
    
    await db.questions.update_one({"id": question_id}, {"$set": question.model_dump()})
    
    await invalidate_cache_pattern("questions*")
    await invalidate_cache_pattern("company_questions*")
    await invalidate_cache_pattern("bookmarks*")
    
    companies_to_update = set()
    if old_question and old_question.get('company_id'):
        companies_to_update.add(old_question['company_id'])
    if question.company_id:
        companies_to_update.add(question.company_id)
    
    for company_id in companies_to_update:
        count = await db.questions.count_documents({"company_id": company_id})
        await db.companies.update_one({"id": company_id}, {"$set": {"question_count": count}})
    
    if companies_to_update:
        await invalidate_cache_pattern("companies*")
    
    return question

@api_router.delete("/admin/questions/{question_id}")
async def delete_question(question_id: str, user: User = Depends(require_admin)):
    question = await db.questions.find_one({"id": question_id})
    await db.questions.delete_one({"id": question_id})
    
    await invalidate_cache_pattern("questions*")
    await invalidate_cache_pattern("company_questions*")
    await invalidate_cache_pattern("bookmarks*")
    
    if question and question.get('company_id'):
        count = await db.questions.count_documents({"company_id": question['company_id']})
        await db.companies.update_one({"id": question['company_id']}, {"$set": {"question_count": count}})
        await invalidate_cache_pattern("companies*")
    
    return {"success": True}

# Admin CRUD - Companies
@api_router.post("/admin/upload-image")
async def upload_image(file: UploadFile = File(...), user: User = Depends(require_admin)):
    try:
        contents = await file.read()
        
        upload_result = cloudinary.uploader.upload(
            contents,
            folder="interview_prep/companies",
            resource_type="auto"
        )
        
        return {"url": upload_result['secure_url']}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@api_router.post("/admin/companies")
async def create_company(company: Company, user: User = Depends(require_admin)):
    await db.companies.insert_one(company.model_dump())
    await invalidate_cache_pattern("companies*")
    return company

@api_router.put("/admin/companies/{company_id}")
async def update_company(company_id: str, company: Company, user: User = Depends(require_admin)):
    await db.companies.update_one({"id": company_id}, {"$set": company.model_dump()})
    await invalidate_cache_pattern("companies*")
    return company

@api_router.delete("/admin/companies/{company_id}")
async def delete_company(company_id: str, user: User = Depends(require_admin)):
    await db.companies.delete_one({"id": company_id})
    await db.questions.delete_many({"company_id": company_id})
    await invalidate_cache_pattern("companies*")
    await invalidate_cache_pattern("questions*")
    await invalidate_cache_pattern("company_questions*")
    return {"success": True}

# Admin CRUD - Experiences
@api_router.post("/admin/experiences")
async def create_experience(experience: Experience, user: User = Depends(require_admin)):
    await db.experiences.insert_one(experience.model_dump())
    await invalidate_cache_pattern("experiences*")
    return experience

@api_router.put("/admin/experiences/{experience_id}")
async def update_experience(experience_id: str, experience: Experience, user: User = Depends(require_admin)):
    await db.experiences.update_one({"id": experience_id}, {"$set": experience.model_dump()})
    await invalidate_cache_pattern("experiences*")
    return experience

@api_router.delete("/admin/experiences/{experience_id}")
async def delete_experience(experience_id: str, user: User = Depends(require_admin)):
    await db.experiences.delete_one({"id": experience_id})
    await invalidate_cache_pattern("experiences*")
    return {"success": True}

# Middleware setup - ORDER MATTERS!
# 1. CORS must be first to handle preflight requests
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# 2. GZip compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_db():
    try:
        await db.topics.create_index("id", unique=True)
        
        await db.questions.create_index("id", unique=True)
        await db.questions.create_index("topic_id")
        await db.questions.create_index("company_id")
        await db.questions.create_index([("difficulty", 1), ("topic_id", 1)])
        await db.questions.create_index([("category", 1), ("company_id", 1)])
        
        await db.companies.create_index("id", unique=True)
        await db.companies.create_index("name")
        
        await db.experiences.create_index("id", unique=True)
        await db.experiences.create_index("company_id")
        await db.experiences.create_index([("posted_at", -1)])
        
        # Users indexes
        await db.users.create_index("clerk_id", unique=True)
        try:
            await db.users.create_index("email", unique=True)
        except Exception:
            pass
        
        # Cache collection indexes
        await cache_collection.create_index("key", unique=True)
        await cache_collection.create_index("expires_at", expireAfterSeconds=0)
        
        logger.info("Database indexes created successfully")
        
        topics = await db.topics.find({}, {"_id": 0}).to_list(1000)
        await set_cached_data("topics", topics, ttl=7200)
        
        companies = await db.companies.find({}, {"_id": 0}).to_list(1000)
        await set_cached_data("companies", companies, ttl=7200)
        
        logger.info("Cache warmed up successfully")
        
    except Exception as e:
        logger.warning(f"Index creation warning: {e}")

@api_router.get("/admin/cache-stats")
async def get_cache_stats(user: User = Depends(require_admin)):
    try:
        total_keys = await cache_collection.count_documents({})
        now = datetime.now(timezone.utc).isoformat()
        valid_keys = await cache_collection.count_documents({"expires_at": {"$gt": now}})
        expired_keys = total_keys - valid_keys
        
        return {
            "total_keys": total_keys,
            "valid_keys": valid_keys,
            "expired_keys": expired_keys,
            "cache_type": "MongoDB"
        }
    except Exception as e:
        return {"error": str(e)}

@api_router.get("/health")
async def health_check():
    try:
        await db.command('ping')
        mongo_status = "healthy"
    except Exception as e:
        mongo_status = f"unhealthy: {str(e)}"
    
    try:
        await cache_collection.count_documents({})
        cache_status = "healthy"
    except Exception as e:
        cache_status = f"unhealthy: {str(e)}"
    
    return {
        "status": "healthy" if mongo_status == "healthy" and cache_status == "healthy" else "degraded",
        "mongodb": mongo_status,
        "cache": cache_status
    }

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

app.include_router(api_router)
