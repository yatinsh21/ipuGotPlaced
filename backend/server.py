from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Header, UploadFile, File
from fastapi.responses import JSONResponse
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
import redis.asyncio as redis
import json
import httpx
import cloudinary
import cloudinary.uploader

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Redis connection
redis_client = redis.from_url(os.environ.get('REDIS_URL', 'redis://localhost:6379'), decode_responses=True)

# Razorpay client
razorpay_client = razorpay.Client(auth=(os.environ['RAZORPAY_KEY_ID'], os.environ['RAZORPAY_KEY_SECRET']))

# Admin emails
ADMIN_EMAILS = os.environ.get('ADMIN_EMAILS', '').split(',')

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    picture: Optional[str] = None
    is_premium: bool = False
    is_admin: bool = False
    bookmarked_questions: List[str] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Session(BaseModel):
    model_config = ConfigDict(extra="ignore")
    session_token: str
    user_id: str
    expires_at: str

class Topic(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Question(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    topic_id: Optional[str] = None
    company_id: Optional[str] = None
    question: str
    answer: str
    difficulty: str  # easy, medium, hard
    tags: List[str] = []  # just-read, v.imp, fav
    category: Optional[str] = None  # project, HR, technical, coding
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
    posted_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CreateOrderRequest(BaseModel):
    amount: int  # in paise

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

# Auth dependency
async def get_current_user(request: Request) -> Optional[User]:
    session_token = request.cookies.get('session_token')
    if not session_token:
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            session_token = auth_header.split(' ')[1]
    
    if not session_token:
        return None
    
    session = await db.sessions.find_one({"session_token": session_token})
    if not session:
        return None
    
    expires_at = datetime.fromisoformat(session['expires_at'])
    if expires_at < datetime.now(timezone.utc):
        await db.sessions.delete_one({"session_token": session_token})
        return None
    
    user = await db.users.find_one({"id": session['user_id']}, {"_id": 0})
    if not user:
        return None
    
    return User(**user)

async def require_auth(request: Request) -> User:
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user

async def require_premium(request: Request) -> User:
    user = await require_auth(request)
    if not user.is_premium:
        raise HTTPException(status_code=403, detail="Premium subscription required")
    return user

async def require_admin(request: Request) -> User:
    user = await require_auth(request)
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# Auth endpoints
@api_router.post("/auth/session")
async def create_session(request: Request, response: Response, x_session_id: str = Header(...)):
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": x_session_id}
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            data = resp.json()
            email = data['email']
            
            # Check if user exists
            existing_user = await db.users.find_one({"email": email}, {"_id": 0})
            
            if existing_user:
                user = User(**existing_user)
                # Update admin status if email is in admin list
                if email in ADMIN_EMAILS and not user.is_admin:
                    user.is_admin = True
                    await db.users.update_one({"id": user.id}, {"$set": {"is_admin": True, "is_premium": True}})
                    user.is_premium = True
            else:
                # Create new user
                is_admin = email in ADMIN_EMAILS
                user = User(
                    email=email,
                    name=data['name'],
                    picture=data.get('picture'),
                    is_admin=is_admin,
                    is_premium=is_admin  # Admins are premium by default
                )
                await db.users.insert_one(user.model_dump())
            
            # Create session
            session_token = data['session_token']
            expires_at = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
            session = Session(session_token=session_token, user_id=user.id, expires_at=expires_at)
            await db.sessions.insert_one(session.model_dump())
            
            # Set cookie
            response.set_cookie(
                key="session_token",
                value=session_token,
                httponly=True,
                secure=True,
                samesite="none",
                max_age=7*24*60*60,
                path="/"
            )
            
            return {"user": user.model_dump()}
    except Exception as e:
        logging.error(f"Session creation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/auth/me")
async def get_me(user: User = Depends(require_auth)):
    return {"user": user.model_dump()}

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response, user: User = Depends(require_auth)):
    session_token = request.cookies.get('session_token')
    if session_token:
        await db.sessions.delete_one({"session_token": session_token})
    response.delete_cookie("session_token", path="/")
    return {"success": True}

# Free endpoints - Topics & Questions
@api_router.get("/topics", response_model=List[Topic])
async def get_topics():
    # Check cache
    cached = await redis_client.get("topics")
    if cached:
        return json.loads(cached)
    
    topics = await db.topics.find({}, {"_id": 0}).to_list(1000)
    await redis_client.set("topics", json.dumps(topics), ex=3600)
    return topics

@api_router.get("/companies-preview", response_model=List[Company])
async def get_companies_preview():
    # Public endpoint for browsing companies without auth
    cached = await redis_client.get("companies")
    if cached:
        return json.loads(cached)
    
    companies = await db.companies.find({}, {"_id": 0}).to_list(1000)
    await redis_client.set("companies", json.dumps(companies), ex=3600)
    return companies

@api_router.get("/questions")
async def get_questions(topic_id: Optional[str] = None, difficulty: Optional[str] = None):
    query = {"topic_id": {"$ne": None}}
    if topic_id:
        query["topic_id"] = topic_id
    if difficulty:
        query["difficulty"] = difficulty
    
    questions = await db.questions.find(query, {"_id": 0}).to_list(1000)
    return questions

# Premium endpoints - Companies & Questions
@api_router.get("/companies", response_model=List[Company])
async def get_companies(user: User = Depends(require_auth)):
    # Allow both premium users and admins
    if not user.is_premium and not user.is_admin:
        raise HTTPException(status_code=403, detail="Premium subscription required")
    
    cached = await redis_client.get("companies")
    if cached:
        return json.loads(cached)
    
    companies = await db.companies.find({}, {"_id": 0}).to_list(1000)
    await redis_client.set("companies", json.dumps(companies), ex=3600)
    return companies

@api_router.get("/company-questions/{company_id}")
async def get_company_questions(company_id: str, category: Optional[str] = None, user: User = Depends(require_premium)):
    query = {"company_id": company_id}
    if category:
        query["category"] = category
    
    questions = await db.questions.find(query, {"_id": 0}).to_list(1000)
    return questions

@api_router.post("/bookmark/{question_id}")
async def toggle_bookmark(question_id: str, user: User = Depends(require_premium)):
    if question_id in user.bookmarked_questions:
        await db.users.update_one(
            {"id": user.id},
            {"$pull": {"bookmarked_questions": question_id}}
        )
        return {"bookmarked": False}
    else:
        await db.users.update_one(
            {"id": user.id},
            {"$addToSet": {"bookmarked_questions": question_id}}
        )
        return {"bookmarked": True}

@api_router.get("/bookmarks")
async def get_bookmarks(user: User = Depends(require_premium)):
    if not user.bookmarked_questions:
        return []
    questions = await db.questions.find({"id": {"$in": user.bookmarked_questions}}, {"_id": 0}).to_list(1000)
    return questions

# Experiences
@api_router.get("/experiences", response_model=List[Experience])
async def get_experiences(company_id: Optional[str] = None):
    query = {}
    if company_id:
        query["company_id"] = company_id
    
    experiences = await db.experiences.find(query, {"_id": 0}).sort("posted_at", -1).to_list(1000)
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
        
        # Update user to premium
        await db.users.update_one({"id": user.id}, {"$set": {"is_premium": True}})
        
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

# Admin - Topics
@api_router.post("/admin/topics")
async def create_topic(topic: Topic, user: User = Depends(require_admin)):
    await db.topics.insert_one(topic.model_dump())
    await redis_client.delete("topics")
    return topic

@api_router.put("/admin/topics/{topic_id}")
async def update_topic(topic_id: str, topic: Topic, user: User = Depends(require_admin)):
    await db.topics.update_one({"id": topic_id}, {"$set": topic.model_dump()})
    await redis_client.delete("topics")
    return topic

@api_router.delete("/admin/topics/{topic_id}")
async def delete_topic(topic_id: str, user: User = Depends(require_admin)):
    await db.topics.delete_one({"id": topic_id})
    await redis_client.delete("topics")
    return {"success": True}

# Admin - Questions
@api_router.get("/admin/questions")
async def get_all_questions(user: User = Depends(require_admin)):
    questions = await db.questions.find({}, {"_id": 0}).to_list(10000)
    return questions

@api_router.post("/admin/questions")
async def create_question(question: Question, user: User = Depends(require_admin)):
    await db.questions.insert_one(question.model_dump())
    
    # Update company question count if company_id exists
    if question.company_id:
        count = await db.questions.count_documents({"company_id": question.company_id})
        await db.companies.update_one({"id": question.company_id}, {"$set": {"question_count": count}})
        await redis_client.delete("companies")
    
    return question

@api_router.put("/admin/questions/{question_id}")
async def update_question(question_id: str, question: Question, user: User = Depends(require_admin)):
    await db.questions.update_one({"id": question_id}, {"$set": question.model_dump()})
    
    if question.company_id:
        count = await db.questions.count_documents({"company_id": question.company_id})
        await db.companies.update_one({"id": question.company_id}, {"$set": {"question_count": count}})
        await redis_client.delete("companies")
    
    return question

@api_router.delete("/admin/questions/{question_id}")
async def delete_question(question_id: str, user: User = Depends(require_admin)):
    question = await db.questions.find_one({"id": question_id})
    await db.questions.delete_one({"id": question_id})
    
    if question and question.get('company_id'):
        count = await db.questions.count_documents({"company_id": question['company_id']})
        await db.companies.update_one({"id": question['company_id']}, {"$set": {"question_count": count}})
        await redis_client.delete("companies")
    
    return {"success": True}

# Admin - Companies
@api_router.post("/admin/companies")
async def create_company(company: Company, user: User = Depends(require_admin)):
    await db.companies.insert_one(company.model_dump())
    await redis_client.delete("companies")
    return company

@api_router.put("/admin/companies/{company_id}")
async def update_company(company_id: str, company: Company, user: User = Depends(require_admin)):
    await db.companies.update_one({"id": company_id}, {"$set": company.model_dump()})
    await redis_client.delete("companies")
    return company

@api_router.delete("/admin/companies/{company_id}")
async def delete_company(company_id: str, user: User = Depends(require_admin)):
    await db.companies.delete_one({"id": company_id})
    await db.questions.delete_many({"company_id": company_id})
    await redis_client.delete("companies")
    return {"success": True}

# Admin - Experiences
@api_router.post("/admin/experiences")
async def create_experience(experience: Experience, user: User = Depends(require_admin)):
    await db.experiences.insert_one(experience.model_dump())
    return experience

@api_router.put("/admin/experiences/{experience_id}")
async def update_experience(experience_id: str, experience: Experience, user: User = Depends(require_admin)):
    await db.experiences.update_one({"id": experience_id}, {"$set": experience.model_dump()})
    return experience

@api_router.delete("/admin/experiences/{experience_id}")
async def delete_experience(experience_id: str, user: User = Depends(require_admin)):
    await db.experiences.delete_one({"id": experience_id})
    return {"success": True}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    await redis_client.close()