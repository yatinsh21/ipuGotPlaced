from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File, Header
from fastapi.responses import JSONResponse
from fastapi.middleware.gzip import GZipMiddleware
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware

from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
import re
import uuid
from bson import ObjectId
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import razorpay
import json
import cloudinary
import cloudinary.uploader
from clerk_backend_api import Clerk

# Upstash Redis imports
import redis.asyncio as aioredis
from redis.asyncio import Redis

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

# MongoDB-based cache collection (fallback)
cache_collection = db.cache

# Upstash Redis configuration
redis_client: Optional[Redis] = None
REDIS_ENABLED = False

async def init_redis():
    """Initialize Upstash Redis connection"""
    global redis_client, REDIS_ENABLED
    
    upstash_url = os.environ.get('UPSTASH_REDIS_REST_URL', '')
    upstash_token = os.environ.get('UPSTASH_REDIS_REST_TOKEN', '')
    
    if upstash_url and upstash_token:
        try:
            # For Upstash REST API, we need to use the REST endpoint
            # Format: redis://default:TOKEN@HOST:PORT
            if upstash_url.startswith('https://'):
                # Extract host from URL
                host = upstash_url.replace('https://', '').replace('http://', '')
                redis_url = f"rediss://default:{upstash_token}@{host}:6379"
            else:
                redis_url = upstash_url
            
            redis_client = await aioredis.from_url(
                redis_url,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=5,
                socket_keepalive=True,
                health_check_interval=30
            )
            
            # Test connection
            await redis_client.ping()
            REDIS_ENABLED = True
            logging.info("✓ Upstash Redis connected successfully")
            
        except Exception as e:
            logging.warning(f"⚠️ Upstash Redis connection failed, using MongoDB cache: {e}")
            redis_client = None
            REDIS_ENABLED = False
    else:
        logging.warning("⚠️ Upstash Redis not configured, using MongoDB cache")
        REDIS_ENABLED = False

# Clerk client
clerk_secret = os.environ.get('CLERK_SECRET_KEY', '')
if clerk_secret:
    clerk_client = Clerk(bearer_auth=clerk_secret)
else:
    clerk_client = None
    logging.warning("CLERK_SECRET_KEY not set")

# Cloudinary configuration
cloudinary.config(
    cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME', 'dzlwzbwf2'),
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
    clerk_id: str  # This is the primary key
    email: str
    name: str
    picture: Optional[str] = None
    is_premium: bool = False
    is_admin: bool = False
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
    slug: Optional[str] = None
    logo_url: Optional[str] = None
    question_count: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    
    def __init__(self, **data):
        super().__init__(**data)
        if not self.slug and self.name:
            self.slug = self.generate_slug(self.name)
    
    @staticmethod
    def generate_slug(name: str) -> str:
        """Generate URL-friendly slug from company name"""
        slug = name.lower()
        slug = re.sub(r'[^a-z0-9\s-]', '', slug)
        slug = re.sub(r'[\s]+', '-', slug)
        slug = slug.strip('-')
        return slug or str(uuid.uuid4())[:8]

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

# Enhanced cache helper functions with Upstash Redis
def generate_cache_key(prefix: str, **kwargs) -> str:
    """Generate cache key with prefix and parameters"""
    if not kwargs:
        return prefix
    params = "_".join(f"{k}:{v}" for k, v in sorted(kwargs.items()) if v is not None)
    return f"{prefix}_{params}" if params else prefix

async def get_cached_data(key: str):
    """Get data from Upstash Redis or fallback to MongoDB"""
    try:
        # Try Redis first
        if REDIS_ENABLED and redis_client:
            cached = await redis_client.get(key)
            if cached:
                return json.loads(cached)
        
        # Fallback to MongoDB cache
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
    """Set data in Upstash Redis and MongoDB (dual-write for reliability)"""
    try:
        # Serialize data
        def serialize_data(obj):
            if isinstance(obj, datetime):
                return obj.isoformat()
            elif isinstance(obj, ObjectId):
                return str(obj)
            elif isinstance(obj, dict):
                return {k: serialize_data(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [serialize_data(item) for item in obj]
            return obj
        
        serialized_data = serialize_data(data)
        json_data = json.dumps(serialized_data)
        
        # Write to Redis (primary)
        if REDIS_ENABLED and redis_client:
            await redis_client.setex(key, ttl, json_data)
        
        # Write to MongoDB (fallback/backup)
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=ttl)
        await cache_collection.update_one(
            {"key": key},
            {
                "$set": {
                    "key": key,
                    "data": json_data,
                    "expires_at": expires_at.isoformat(),
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
            },
            upsert=True
        )
        
    except Exception as e:
        logging.warning(f"Cache set failed for {key}: {e}")

async def invalidate_cache_pattern(pattern: str):
    """Invalidate cache keys matching pattern in both Redis and MongoDB"""
    try:
        # Invalidate in Redis
        if REDIS_ENABLED and redis_client:
            # Convert wildcard pattern to Redis pattern
            redis_pattern = pattern.replace("*", "*")
            cursor = 0
            
            while True:
                cursor, keys = await redis_client.scan(cursor, match=redis_pattern, count=100)
                if keys:
                    await redis_client.delete(*keys)
                if cursor == 0:
                    break
        
        # Invalidate in MongoDB
        regex_pattern = pattern.replace("*", ".*")
        await cache_collection.delete_many({"key": {"$regex": f"^{regex_pattern}$"}})
        
    except Exception as e:
        logging.warning(f"Cache invalidation failed for {pattern}: {e}")

# Auth dependency using Clerk
async def get_current_user(authorization: str = Header(None, alias="Authorization")) -> Optional[User]:
    """Verify Clerk session token and get/create user"""
    
    if not authorization:
        logging.warning("No Authorization header provided")
        return None
    
    if not authorization.startswith('Bearer '):
        logging.warning(f"Invalid Authorization format: {authorization[:20]}")
        return None
    
    if not clerk_client:
        logging.error("Clerk client not initialized")
        return None
    
    token = authorization.replace('Bearer ', '').strip()
    
    if not token:
        logging.warning("Empty token after Bearer prefix")
        return None
    
    try:
        # Decode JWT to get clerk_user_id
        import jwt
        decoded = jwt.decode(token, options={"verify_signature": False})
        clerk_user_id = decoded.get('sub')
        
        if not clerk_user_id:
            logging.warning("No 'sub' claim in token")
            return None
        
        logging.info(f"✓ Token decoded successfully for clerk_id: {clerk_user_id}")
        
        # Try to get user from cache first
        cache_key = f"user:{clerk_user_id}"
        cached_user = await get_cached_data(cache_key)
        if cached_user:
            return User(**cached_user)
        
        # Get or create user in database
        user_doc = await db.users.find_one({"clerk_id": clerk_user_id}, {"_id": 0})
        
        if not user_doc:
            try:
                clerk_user = clerk_client.users.get(user_id=clerk_user_id)
                
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
                
                try:
                    await db.users.insert_one(new_user)
                    user_doc = new_user
                    logging.info(f"✓ Created new user: {new_user['email']}")
                except Exception as insert_error:
                    if "duplicate key" in str(insert_error).lower():
                        logging.warning(f"Duplicate key error, searching for existing user by email")
                        user_doc = await db.users.find_one({"email": new_user['email']}, {"_id": 0})
                        if user_doc:
                            await db.users.update_one(
                                {"email": new_user['email']},
                                {"$set": {"clerk_id": clerk_user_id}}
                            )
                            user_doc['clerk_id'] = clerk_user_id
                            logging.info(f"✓ Updated existing user with new clerk_id: {new_user['email']}")
                        else:
                            logging.error(f"Could not find user after duplicate key error")
                            return None
                    else:
                        raise insert_error
                        
            except Exception as e:
                logging.error(f"Failed to get Clerk user: {e}")
                return None
        else:
            try:
                clerk_user = clerk_client.users.get(user_id=clerk_user_id)
                is_premium = clerk_user.public_metadata.get('isPremium', False) if hasattr(clerk_user, 'public_metadata') else False
                is_admin = clerk_user.public_metadata.get('isAdmin', False) if hasattr(clerk_user, 'public_metadata') else False
                
                if user_doc.get('is_premium') != is_premium or user_doc.get('is_admin') != is_admin:
                    await db.users.update_one(
                        {"clerk_id": clerk_user_id},
                        {"$set": {"is_premium": is_premium, "is_admin": is_admin}}
                    )
                    user_doc['is_premium'] = is_premium
                    user_doc['is_admin'] = is_admin
                logging.info(f"✓ User authenticated: {user_doc['email']}")
            except Exception as e:
                logging.error(f"Failed to update user metadata: {e}")
        
        # Cache user data for 5 minutes
        user_obj = User(**user_doc)
        await set_cached_data(cache_key, user_doc, ttl=300)
        
        return user_obj
        
    except Exception as e:
        logging.error(f"❌ Auth error: {e}")
        import traceback
        logging.error(traceback.format_exc())
        return None

async def require_auth(user: User = Depends(get_current_user)) -> User:
    """Require authenticated user"""
    if not user:
        logging.warning("❌ Authentication required but no user found")
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
        await invalidate_cache_pattern(f"user:{user.clerk_id}")
        return {"bookmarked": False}
    else:
        await db.users.update_one({"clerk_id": user.clerk_id}, {"$addToSet": {"bookmarked_questions": question_id}})
        await invalidate_cache_pattern(f"bookmarks_user:{user.clerk_id}")
        await invalidate_cache_pattern(f"user:{user.clerk_id}")
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
    """Create Razorpay order for payment"""
    try:
        logging.info(f"💰 Payment order request from user: {user.email} (clerk_id: {user.clerk_id})")
        logging.info(f"💰 Amount requested: ₹{order_req.amount / 100}")
        
        razor_order = razorpay_client.order.create({
            "amount": order_req.amount,
            "currency": "INR",
            "payment_capture": 1
        })
        
        logging.info(f"✓ Razorpay order created: {razor_order['id']}")
        return razor_order
        
    except Exception as e:
        logging.error(f"❌ Payment order creation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create payment order: {str(e)}")

@api_router.post("/payment/verify")
async def verify_payment(payment: VerifyPaymentRequest, user: User = Depends(require_auth)):
    """Verify Razorpay payment and upgrade user to premium"""
    try:
        logging.info(f"💰 Payment verification request from user: {user.email}")
        
        params_dict = {
            'razorpay_order_id': payment.razorpay_order_id,
            'razorpay_payment_id': payment.razorpay_payment_id,
            'razorpay_signature': payment.razorpay_signature
        }
        
        razorpay_client.utility.verify_payment_signature(params_dict)
        logging.info(f"✓ Payment signature verified")
        
        await db.users.update_one({"clerk_id": user.clerk_id}, {"$set": {"is_premium": True}})
        logging.info(f"✓ User upgraded to premium in MongoDB")
        
        # Invalidate user cache
        await invalidate_cache_pattern(f"user:{user.clerk_id}")
        
        if clerk_client:
            try:
                clerk_client.users.update_metadata(
                    user_id=user.clerk_id,
                    public_metadata={"isPremium": True}
                )
                logging.info(f"✓ User metadata updated in Clerk")
            except Exception as e:
                logging.error(f"⚠️ Failed to update Clerk metadata (non-critical): {e}")
        
        return {
            "success": True,
            "message": "Payment verified and premium access granted"
        }
        
    except Exception as e:
        logging.error(f"❌ Payment verification failed: {e}")
        raise HTTPException(status_code=400, detail=f"Payment verification failed: {str(e)}")

# Admin endpoints
@api_router.get("/admin/stats")
async def get_admin_stats(user: User = Depends(require_admin)):
    cache_key = "admin_stats"
    cached = await get_cached_data(cache_key)
    if cached:
        return cached
    
    total_users = await db.users.count_documents({})
    premium_users = await db.users.count_documents({"is_premium": True})
    total_questions = await db.questions.count_documents({})
    total_companies = await db.companies.count_documents({})
    total_experiences = await db.experiences.count_documents({})
    
    stats = {
        "total_users": total_users,
        "premium_users": premium_users,
        "total_questions": total_questions,
        "total_companies": total_companies,
        "total_experiences": total_experiences
    }
    
    await set_cached_data(cache_key, stats, ttl=300)
    return stats

@api_router.get("/admin/users")
async def get_all_users(user: User = Depends(require_admin)):
    """Get all users"""
    users = await db.users.find({}).to_list(10000)
    
    def make_json_safe(obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        elif isinstance(obj, datetime):
            return obj.isoformat()
        elif isinstance(obj, dict):
            return {k: make_json_safe(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [make_json_safe(item) for item in obj]
        return obj
    
    safe_users = [make_json_safe(user) for user in users]
    return JSONResponse(content=safe_users)

@api_router.post("/admin/users/{user_id}/grant-admin")
async def grant_admin_access(user_id: str, current_user: User = Depends(require_admin)):
    if not user_id or user_id == "undefined" or user_id == "null":
        raise HTTPException(status_code=400, detail="Invalid user_id provided")
    
    target_user = await db.users.find_one({"clerk_id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if target_user.get('is_admin') and target_user.get('is_premium'):
        raise HTTPException(
            status_code=400, 
            detail="Cannot remove premium status from admin users"
        )
    
    new_premium_status = not target_user.get('is_premium', False)
    
    await db.users.update_one(
        {"clerk_id": user_id}, 
        {"$set": {"is_premium": new_premium_status}}
    )
    
    # Invalidate user cache
    await invalidate_cache_pattern(f"user:{user_id}")
    await invalidate_cache_pattern("admin_stats")
    
    if clerk_client:
        try:
            clerk_user = clerk_client.users.get(user_id=user_id)
            clerk_client.users.update(
                user_id=user_id,
                public_metadata={
                    **clerk_user.public_metadata,
                    'isPremium': new_premium_status
                }
            )
            logging.info(f"✓ Updated Clerk metadata for premium toggle: {target_user['email']}")
        except Exception as e:
            logging.error(f"⚠️ Failed to update Clerk metadata: {e}")
    
    status_text = "granted" if new_premium_status else "revoked"
    return {
        "success": True, 
        "message": f"Premium access {status_text} for {target_user['email']}"
    }

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
    try:
        logging.info(f"Creating company: {company.name}")
        
        if not company.slug:
            company.slug = Company.generate_slug(company.name)
        
        existing = await db.companies.find_one({"slug": company.slug})
        if existing:
            company.slug = f"{company.slug}-{str(uuid.uuid4())[:8]}"
            logging.info(f"Slug already exists, using: {company.slug}")
        
        await db.companies.insert_one(company.model_dump())
        await invalidate_cache_pattern("companies*")
        
        logging.info(f"✓ Company created successfully: {company.name}")
        return company
        
    except Exception as e:
        logging.error(f"❌ Failed to create company: {e}")
        import traceback
        logging.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to create company: {str(e)}")

@api_router.put("/admin/companies/{company_id}")
async def update_company(company_id: str, company: Company, user: User = Depends(require_admin)):
    try:
        logging.info(f"Updating company: {company_id}")
        
        if not company.slug:
            company.slug = Company.generate_slug(company.name)
        
        existing = await db.companies.find_one({"slug": company.slug, "id": {"$ne": company_id}})
        if existing:
            company.slug = f"{company.slug}-{str(uuid.uuid4())[:8]}"
            logging.info(f"Slug conflict, using: {company.slug}")
        
        await db.companies.update_one({"id": company_id}, {"$set": company.model_dump()})
        await invalidate_cache_pattern("companies*")
        
        logging.info(f"✓ Company updated successfully")
        return company
        
    except Exception as e:
        logging.error(f"❌ Failed to update company: {e}")
        import traceback
        logging.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to update company: {str(e)}")
        
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
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_db():
    try:
        logger.info("🚀 Starting database initialization...")
        
        # Initialize Redis
        await init_redis()
        
        # Step 1: Clean up null values
        logger.info("Cleaning up null ID documents...")
        null_users = await db.users.count_documents({"clerk_id": None})
        if null_users > 0:
            logger.warning(f"Found {null_users} users with null clerk_id - deleting them")
            await db.users.delete_many({"clerk_id": None})
        
        await db.questions.delete_many({"id": None})
        await db.topics.delete_many({"id": None})
        await db.companies.delete_many({"id": None})
        await db.experiences.delete_many({"id": None})
        logger.info("✓ Null ID cleanup complete")
        
        # Step 2: Drop old/unused indexes
        logger.info("Dropping old indexes...")
        old_indexes = ["id_1", "email_1"]
        for index_name in old_indexes:
            try:
                await db.users.drop_index(index_name)
                logger.info(f"✓ Dropped old index: {index_name}")
            except Exception:
                pass
        
        # Step 3: Create proper indexes
        logger.info("Creating indexes...")
        
        # Topics
        await db.topics.create_index("id", unique=True)
        
        # Questions
        await db.questions.create_index("id", unique=True)
        await db.questions.create_index("topic_id")
        await db.questions.create_index("company_id")
        await db.questions.create_index([("difficulty", 1), ("topic_id", 1)])
        await db.questions.create_index([("category", 1), ("company_id", 1)])
        
        # Companies
        await db.companies.create_index("id", unique=True)
        await db.companies.create_index("name")
        
        # Experiences
        await db.experiences.create_index("id", unique=True)
        await db.experiences.create_index("company_id")
        await db.experiences.create_index([("posted_at", -1)])
        
        # Users
        await db.users.create_index("clerk_id", unique=True)
        await db.users.create_index("email")
        
        # Cache
        await cache_collection.create_index("key", unique=True)
        await cache_collection.create_index("expires_at", expireAfterSeconds=0)
        
        logger.info("✓ All indexes created successfully")
        
        # Step 4: Verify services
        if razorpay_client:
            logger.info("✓ Razorpay client initialized")
        else:
            logger.warning("⚠️ Razorpay not configured - payments disabled")
        
        if clerk_client:
            logger.info("✓ Clerk client initialized")
        else:
            logger.warning("⚠️ Clerk not configured")
        
        # Step 5: Warm up cache
        logger.info("Warming up cache...")
        topics = await db.topics.find({}, {"_id": 0}).to_list(1000)
        await set_cached_data("topics", topics, ttl=7200)
        
        companies = await db.companies.find({}, {"_id": 0}).to_list(1000)
        await set_cached_data("companies", companies, ttl=7200)
        
        logger.info("✓ Cache warmed up")
        
        # Cache statistics
        if REDIS_ENABLED:
            logger.info("✓ Using Upstash Redis for caching")
        else:
            logger.info("✓ Using MongoDB for caching (Redis fallback)")
        
        logger.info("🎉 Database initialization complete!")
        
    except Exception as e:
        logger.error(f"❌ Startup error: {e}")
        import traceback
        logger.error(traceback.format_exc())

@api_router.get("/debug/razorpay-status")
async def check_razorpay_status():
    """Debug endpoint - REMOVE IN PRODUCTION"""
    key_id = os.environ.get('RAZORPAY_KEY_ID', '')
    key_secret = os.environ.get('RAZORPAY_KEY_SECRET', '')
    
    return {
        "razorpay_client_exists": razorpay_client is not None,
        "key_id_present": bool(key_id),
        "key_secret_present": bool(key_secret),
        "key_id_length": len(key_id) if key_id else 0,
        "key_secret_length": len(key_secret) if key_secret else 0,
        "key_id_prefix": key_id[:15] if len(key_id) >= 15 else key_id,
        "all_env_vars": list(os.environ.keys())
    }

@api_router.get("/admin/cache-stats")
async def get_cache_stats(user: User = Depends(require_admin)):
    try:
        stats = {
            "cache_type": "Upstash Redis + MongoDB" if REDIS_ENABLED else "MongoDB only",
            "redis_enabled": REDIS_ENABLED
        }
        
        # Redis stats
        if REDIS_ENABLED and redis_client:
            try:
                info = await redis_client.info()
                stats["redis"] = {
                    "connected": True,
                    "used_memory": info.get('used_memory_human', 'N/A'),
                    "total_keys": await redis_client.dbsize(),
                    "uptime_seconds": info.get('uptime_in_seconds', 0)
                }
            except Exception as e:
                stats["redis"] = {"connected": False, "error": str(e)}
        else:
            stats["redis"] = {"connected": False}
        
        # MongoDB cache stats
        total_keys = await cache_collection.count_documents({})
        now = datetime.now(timezone.utc).isoformat()
        valid_keys = await cache_collection.count_documents({"expires_at": {"$gt": now}})
        expired_keys = total_keys - valid_keys
        
        stats["mongodb"] = {
            "total_keys": total_keys,
            "valid_keys": valid_keys,
            "expired_keys": expired_keys
        }
        
        return stats
        
    except Exception as e:
        return {"error": str(e)}

@api_router.head("/health")
async def health_head():
    return Response(status_code=200)

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
    
    # Redis health check
    redis_status = "disabled"
    if REDIS_ENABLED and redis_client:
        try:
            await redis_client.ping()
            redis_status = "healthy"
        except Exception as e:
            redis_status = f"unhealthy: {str(e)}"
    
    overall_status = "healthy"
    if mongo_status != "healthy" or cache_status != "healthy":
        overall_status = "degraded"
    if redis_status.startswith("unhealthy"):
        overall_status = "degraded"
    
    return {
        "status": overall_status,
        "mongodb": mongo_status,
        "cache": cache_status,
        "redis": redis_status
    }

@app.on_event("shutdown")
async def shutdown_db_client():
    try:
        if redis_client:
            await redis_client.close()
            logger.info("✓ Redis connection closed")
    except Exception as e:
        logger.error(f"Error closing Redis: {e}")
    
    client.close()
    logger.info("✓ MongoDB connection closed")

app.include_router(api_router)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.users.update_one(
        {"clerk_id": user_id}, 
        {"$set": {"is_admin": True, "is_premium": True}}
    )
    
    # Invalidate user cache
    await invalidate_cache_pattern(f"user:{user_id}")
    await invalidate_cache_pattern("admin_stats")
    
    if clerk_client:
        try:
            clerk_user = clerk_client.users.get(user_id=user_id)
            clerk_client.users.update(
                user_id=user_id,
                public_metadata={
                    **clerk_user.public_metadata,
                    'isAdmin': True,
                    'isPremium': True
                }
            )
            logging.info(f"✓ Updated Clerk metadata for admin grant: {target_user['email']}")
        except Exception as e:
            logging.error(f"⚠️ Failed to update Clerk metadata: {e}")
    
    return {
        "success": True, 
        "message": f"Admin access granted to {target_user['email']}"
    }

@api_router.post("/admin/users/{user_id}/revoke-admin")
async def revoke_admin_access(user_id: str, current_user: User = Depends(require_admin)):
    if not user_id or user_id == "undefined" or user_id == "null":
        raise HTTPException(status_code=400, detail="Invalid user_id provided")
    
    target_user = await db.users.find_one({"clerk_id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_id == current_user.clerk_id:
        raise HTTPException(status_code=400, detail="Cannot revoke your own admin access")
    
    await db.users.update_one(
        {"clerk_id": user_id}, 
        {"$set": {"is_admin": False}}
    )
    
    # Invalidate user cache
    await invalidate_cache_pattern(f"user:{user_id}")
    await invalidate_cache_pattern("admin_stats")
    
    if clerk_client:
        try:
            clerk_user = clerk_client.users.get(user_id=user_id)
            clerk_client.users.update(
                user_id=user_id,
                public_metadata={
                    **clerk_user.public_metadata,
                    'isAdmin': False
                }
            )
            logging.info(f"✓ Updated Clerk metadata for admin revoke: {target_user['email']}")
        except Exception as e:
            logging.error(f"⚠️ Failed to update Clerk metadata: {e}")
    
    return {
        "success": True, 
        "message": f"Admin access revoked from {target_user['email']}"
    }

@api_router.post("/admin/users/{user_id}/toggle-premium")
async def toggle_premium_status(user_id: str, current_user: User = Depends(require_admin)):
    if not user_id or user_id == "undefined" or user_id == "null":
        raise HTTPException(status_code=400, detail="Invalid user_id provided")
    
    target_user = await db.users.find_one({"clerk_id": user_id})