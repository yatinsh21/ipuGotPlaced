from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File, Header
from fastapi.responses import JSONResponse, HTMLResponse
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
# from emergentintegrations.llm.chat import LlmChat, UserMessage
import google.generativeai as genai
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

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
    cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME', 'dzlwzbwf2'),
    api_key=os.environ.get('CLOUDINARY_API_KEY', ''),
    api_secret=os.environ.get('CLOUDINARY_API_SECRET', '')
)

# Razorpay client
razorpay_client = razorpay.Client(auth=(
    os.environ.get('RAZORPAY_KEY_ID', ''), 
    os.environ.get('RAZORPAY_KEY_SECRET', '')
))

# Email Configuration
SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
SMTP_USERNAME = os.environ.get('SMTP_USERNAME', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
NOTIFICATION_EMAIL = os.environ.get('NOTIFICATION_EMAIL', '')

def send_email_notification(subject: str, body: str, is_html: bool = True):
    """
    Send email notification via Gmail SMTP
    """
    if not SMTP_USERNAME or not SMTP_PASSWORD or not NOTIFICATION_EMAIL:
        logging.warning("⚠️ Email configuration missing - skipping email notification")
        return False
    
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['From'] = SMTP_USERNAME
        msg['To'] = NOTIFICATION_EMAIL
        msg['Subject'] = subject
        
        # Attach body
        if is_html:
            msg.attach(MIMEText(body, 'html'))
        else:
            msg.attach(MIMEText(body, 'plain'))
        
        # Connect to Gmail SMTP server
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()  # Enable TLS encryption
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        
        logging.info(f"📧 Email sent successfully: {subject}")
        return True
    except Exception as e:
        logging.error(f"❌ Failed to send email: {e}")
        return False

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models (keeping all your existing models)
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

class Alumni(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    phone: Optional[str] = None
    role: str
    company: str
    college: Optional[str] = None
    location: Optional[str] = None
    graduation_year: Optional[int] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CreateOrderRequest(BaseModel):
    amount: int

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

# ============= SEO ENHANCEMENT: SITEMAP & ROBOTS.TXT =============

@app.get("/sitemap.xml", response_class=Response)
async def get_sitemap():
    """Generate dynamic XML sitemap for better SEO"""
    base_url = os.environ.get('FRONTEND_URL', 'https://yourdomain.com')
    
    # Fetch all companies for company-specific pages
    companies = await db.companies.find({}, {"_id": 0, "id": 1, "slug": 1, "name": 1}).to_list(1000)
    
    # Fetch all topics for topic-specific pages
    topics = await db.topics.find({}, {"_id": 0, "id": 1, "name": 1}).to_list(1000)
    
    # Fetch all experiences
    experiences = await db.experiences.find({}, {"_id": 0, "id": 1}).to_list(1000)
    
    # Build sitemap XML
    sitemap = ['<?xml version="1.0" encoding="UTF-8"?>']
    sitemap.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    
    # Static pages with high priority
    static_pages = [
        {'loc': '/', 'priority': '1.0', 'changefreq': 'daily'},
        {'loc': '/topics', 'priority': '0.9', 'changefreq': 'daily'},
        {'loc': '/goldmine', 'priority': '0.9', 'changefreq': 'daily'},
        {'loc': '/experiences', 'priority': '0.8', 'changefreq': 'weekly'},
        {'loc': '/alumni', 'priority': '0.7', 'changefreq': 'weekly'},
        {'loc': '/project-interview-prep', 'priority': '0.8', 'changefreq': 'weekly'},
        {'loc': '/about', 'priority': '0.5', 'changefreq': 'monthly'},
        {'loc': '/contact', 'priority': '0.5', 'changefreq': 'monthly'},
        {'loc': '/faq', 'priority': '0.6', 'changefreq': 'monthly'},
    ]
    
    for page in static_pages:
        sitemap.append(f'''
  <url>
    <loc>{base_url}{page['loc']}</loc>
    <lastmod>{datetime.now(timezone.utc).strftime('%Y-%m-%d')}</lastmod>
    <changefreq>{page['changefreq']}</changefreq>
    <priority>{page['priority']}</priority>
  </url>''')
    
    # Company-specific pages (HIGHEST SEO PRIORITY - these are goldmine pages)
    for company in companies:
        company_id = company.get('id')
        if company_id:
            sitemap.append(f'''
  <url>
    <loc>{base_url}/company/{company_id}</loc>
    <lastmod>{datetime.now(timezone.utc).strftime('%Y-%m-%d')}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.95</priority>
  </url>''')
    
    # Topic-specific pages (HIGH SEO PRIORITY for "java interview questions" etc)
    for topic in topics:
        topic_id = topic.get('id')
        if topic_id:
            sitemap.append(f'''
  <url>
    <loc>{base_url}/topics?topic={topic_id}</loc>
    <lastmod>{datetime.now(timezone.utc).strftime('%Y-%m-%d')}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.92</priority>
  </url>''')
    
    # Experience pages
    for exp in experiences:
        sitemap.append(f'''
  <url>
    <loc>{base_url}/experience/{exp['id']}</loc>
    <lastmod>{datetime.now(timezone.utc).strftime('%Y-%m-%d')}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>''')
    
    sitemap.append('</urlset>')
    
    return Response(
        content=''.join(sitemap),
        media_type='application/xml',
        headers={'Cache-Control': 'public, max-age=3600'}
    )

@app.get("/robots.txt", response_class=Response)
async def get_robots():
    """Robots.txt for SEO crawling"""
    base_url = os.environ.get('FRONTEND_URL', 'https://yourdomain.com')
    
    robots_content = f"""User-agent: *
Allow: /
Allow: /topics
Allow: /goldmine
Allow: /company/*
Allow: /experiences
Allow: /experience/*
Allow: /alumni

Disallow: /admin
Disallow: /api/admin
Disallow: /dashboard

Sitemap: {base_url}/sitemap.xml
"""
    
    return Response(
        content=robots_content,
        media_type='text/plain',
        headers={'Cache-Control': 'public, max-age=86400'}
    )

# ============= SEO ENHANCEMENT: STRUCTURED DATA ENDPOINTS =============

@api_router.get("/seo/company/{company_id}")
async def get_company_seo_data(company_id: str):
    """Get SEO-optimized company data with structured data markup"""
    company = await db.companies.find_one({"id": company_id}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    questions_count = await db.questions.count_documents({"company_id": company_id})
    
    # Get sample questions for FAQPage schema
    sample_questions = await db.questions.find(
        {"company_id": company_id},
        {"_id": 0, "question": 1, "answer": 1, "difficulty": 1, "category": 1}
    ).limit(15).to_list(15)
    
    # Create FAQPage structured data for better SEO
    faq_entities = []
    for q in sample_questions:
        faq_entities.append({
            "@type": "Question",
            "name": q.get('question', ''),
            "acceptedAnswer": {
                "@type": "Answer",
                "text": q.get('answer', '')[:500] + "..." if len(q.get('answer', '')) > 500 else q.get('answer', '')
            }
        })
    
    # Multiple structured data types for maximum SEO impact
    structured_data = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "FAQPage",
                "mainEntity": faq_entities,
                "about": {
                    "@type": "Organization",
                    "name": company['name']
                }
            },
            {
                "@type": "EducationalOrganization",
                "name": f"{company['name']} Interview Preparation",
                "description": f"Practice {questions_count} real interview questions asked at {company['name']}. Ace your {company['name']} interview with our comprehensive question bank.",
                "url": f"{os.environ.get('FRONTEND_URL', 'https://yourdomain.com')}/company/{company_id}",
                "image": company.get('logo_url', ''),
                "offers": {
                    "@type": "Offer",
                    "category": "Interview Preparation",
                    "itemOffered": {
                        "@type": "Course",
                        "name": f"{company['name']} Interview Questions",
                        "description": f"Complete collection of interview questions from {company['name']}",
                        "provider": {
                            "@type": "Organization",
                            "name": "InterviewGuru Pro"
                        }
                    }
                }
            },
            {
                "@type": "WebPage",
                "name": f"{company['name']} Interview Questions",
                "description": f"Comprehensive collection of {questions_count}+ interview questions from {company['name']}",
                "url": f"{os.environ.get('FRONTEND_URL', 'https://yourdomain.com')}/company/{company_id}",
                "breadcrumb": {
                    "@type": "BreadcrumbList",
                    "itemListElement": [
                        {
                            "@type": "ListItem",
                            "position": 1,
                            "name": "Home",
                            "item": os.environ.get('FRONTEND_URL', 'https://yourdomain.com')
                        },
                        {
                            "@type": "ListItem",
                            "position": 2,
                            "name": "Goldmine",
                            "item": f"{os.environ.get('FRONTEND_URL', 'https://yourdomain.com')}/goldmine"
                        },
                        {
                            "@type": "ListItem",
                            "position": 3,
                            "name": company['name'],
                            "item": f"{os.environ.get('FRONTEND_URL', 'https://yourdomain.com')}/company/{company_id}"
                        }
                    ]
                }
            }
        ]
    }
    
    return {
        "title": f"{company['name']} Interview Questions & Answers 2025 | {questions_count}+ Real Problems | IGP",
        "description": f"Ace {company['name']} interviews! Practice {questions_count}+ real interview questions covering DSA, System Design, HR rounds. Get hired at {company['name']} with 98% success rate.",
        "keywords": f"{company['name']} interview questions, {company['name']} interview preparation, {company['name']} coding questions, {company['name']} technical interview, {company['name']} interview experience, {company['name']} DSA questions",
        "canonical": f"/company/{company_id}",
        "structuredData": structured_data,
        "company": company,
        "questionsCount": questions_count
    }

@api_router.get("/seo/experience/{experience_id}")
async def get_experience_seo_data(experience_id: str):
    """Get SEO-optimized experience data"""
    experience = await db.experiences.find_one({"id": experience_id}, {"_id": 0})
    if not experience:
        raise HTTPException(status_code=404, detail="Experience not found")
    
    structured_data = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Article",
                "headline": f"{experience['company_name']} Interview Experience - {experience['role']}",
                "description": f"Real interview experience at {experience['company_name']} for {experience['role']} position. {experience['rounds']} rounds covered.",
                "author": {
                    "@type": "Person",
                    "name": "InterviewGuru Pro Community"
                },
                "datePublished": experience['posted_at'],
                "publisher": {
                    "@type": "Organization",
                    "name": "InterviewGuru Pro",
                    "url": os.environ.get('FRONTEND_URL', 'https://yourdomain.com')
                }
            },
            {
                "@type": "WebPage",
                "name": f"{experience['company_name']} Interview Experience",
                "description": f"Detailed interview experience at {experience['company_name']}",
                "url": f"{os.environ.get('FRONTEND_URL', 'https://yourdomain.com')}/experience/{experience_id}",
                "breadcrumb": {
                    "@type": "BreadcrumbList",
                    "itemListElement": [
                        {
                            "@type": "ListItem",
                            "position": 1,
                            "name": "Home",
                            "item": os.environ.get('FRONTEND_URL', 'https://yourdomain.com')
                        },
                        {
                            "@type": "ListItem",
                            "position": 2,
                            "name": "Experiences",
                            "item": f"{os.environ.get('FRONTEND_URL', 'https://yourdomain.com')}/experiences"
                        },
                        {
                            "@type": "ListItem",
                            "position": 3,
                            "name": f"{experience['company_name']} - {experience['role']}",
                            "item": f"{os.environ.get('FRONTEND_URL', 'https://yourdomain.com')}/experience/{experience_id}"
                        }
                    ]
                }
            }
        ]
    }

@api_router.get("/seo/goldmine")
async def get_goldmine_seo_data():
    """Get SEO-optimized data for goldmine/companies page"""
    companies_count = await db.companies.count_documents({})
    total_questions = await db.questions.count_documents({})
    
    # Get top companies
    top_companies = await db.companies.find(
        {"question_count": {"$gt": 0}},
        {"_id": 0, "name": 1}
    ).sort("question_count", -1).limit(20).to_list(20)
    
    company_names = [c['name'] for c in top_companies]
    
    structured_data = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Company Interview Questions - Goldmine",
        "description": f"Access interview questions from {companies_count}+ top tech companies. Over {total_questions} real interview questions to practice.",
        "url": f"{os.environ.get('FRONTEND_URL', 'https://yourdomain.com')}/goldmine",
        "about": {
            "@type": "Thing",
            "name": "Company-wise Interview Questions",
            "description": f"Comprehensive collection from {companies_count} companies"
        }
    }
    
    return {
        "title": f"Company Interview Questions 2025 - {companies_count}+ Companies | Goldmine | IGP",
        "description": f"Practice real interview questions from {companies_count}+ top companies including {', '.join(company_names[:5])} and more. {total_questions}+ authentic coding and technical questions.",
        "keywords": f"company interview questions, {', '.join(company_names[:10])}, coding interview preparation, technical interview questions",
        "canonical": "/goldmine",
        "structuredData": structured_data,
        "companiesCount": companies_count,
        "totalQuestions": total_questions
    }

@api_router.get("/seo/topics-page")
async def get_topics_page_seo_data():
    """Get SEO-optimized data for topics/home page"""
    topics_count = await db.topics.count_documents({})
    total_questions = await db.questions.count_documents({})
    
    # Get popular topics
    topics = await db.topics.find({}, {"_id": 0, "name": 1}).limit(20).to_list(20)
    topic_names = [t['name'] for t in topics]
    
    structured_data = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Topic-wise Interview Questions",
        "description": f"Practice {total_questions}+ interview questions organized by {topics_count} topics. Master DSA, System Design, and coding interviews.",
        "url": f"{os.environ.get('FRONTEND_URL', 'https://yourdomain.com')}/topics",
        "about": {
            "@type": "Thing",
            "name": "Programming Interview Questions by Topic",
            "description": f"Organized collection across {topics_count} topics"
        }
    }
    
    return {
        "title": f"Interview Questions by Topic 2025 - Practice {total_questions}+ Problems | IGP",
        "description": f"Master coding interviews with {total_questions}+ questions across {topics_count} topics including {', '.join(topic_names[:5])} and more. Practice DSA, System Design, and technical interviews.",
        "keywords": f"interview questions by topic, {', '.join(topic_names[:10])}, coding interview preparation, DSA questions, technical interview",
        "canonical": "/topics",
        "structuredData": structured_data,
        "topicsCount": topics_count,
        "totalQuestions": total_questions
    }

@api_router.get("/seo/alumni")
async def get_alumni_seo_data():
    """Get SEO-optimized data for alumni page"""
    alumni_count = await db.alumni.count_documents({})
    companies = await db.alumni.distinct("company")
    
    structured_data = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Alumni Network - Connect with Industry Professionals",
        "description": f"Connect with {alumni_count}+ alumni working at top tech companies. Get career guidance and referrals.",
        "url": f"{os.environ.get('FRONTEND_URL', 'https://yourdomain.com')}/alumni"
    }
    
    return {
        "title": f"Alumni Network - Connect with {alumni_count}+ Professionals at Top Companies | IGP",
        "description": f"Network with {alumni_count}+ professionals from top companies like {', '.join(companies[:5]) if companies else 'Google, Microsoft, Amazon'}. Get referrals, career guidance, and mentorship.",
        "keywords": f"alumni network, tech professionals, career guidance, job referrals, {', '.join(companies[:10]) if companies else ''}",
        "canonical": "/alumni",
        "structuredData": structured_data,
        "alumniCount": alumni_count
    }

    
    return {
        "title": f"{experience['company_name']} Interview Experience - {experience['role']} 2025 | Real Candidate Story | IGP",
        "description": f"Read authentic {experience['company_name']} interview experience for {experience['role']} position. Learn about {experience['rounds']} interview rounds, questions asked, and tips to get selected at {experience['company_name']}.",
        "keywords": f"{experience['company_name']} interview experience, {experience['company_name']} {experience['role']}, {experience['company_name']} interview rounds, {experience['company_name']} placement, interview tips",
        "canonical": f"/experience/{experience_id}",
        "structuredData": structured_data,
        "experience": experience
    }

@api_router.get("/seo/experiences")
async def get_experiences_page_seo_data(company_name: Optional[str] = None):
    """Get SEO-optimized data for experiences listing page"""
    experiences_count = await db.experiences.count_documents({})
    companies_with_exp = await db.experiences.distinct("company_name")
    
    title = "Interview Experiences - Real Candidate Stories from Top Companies | IGP"
    description = f"Read {experiences_count}+ real interview experiences from top tech companies. Learn from successful candidates, understand interview rounds, and ace your next interview."
    keywords = "interview experiences, placement experiences, interview stories, company interview process"
    
    if company_name:
        company_exp_count = await db.experiences.count_documents({"company_name": company_name})
        title = f"{company_name} Interview Experiences 2025 - {company_exp_count}+ Real Stories | IGP"
        description = f"Read {company_exp_count}+ authentic {company_name} interview experiences. Learn about interview rounds, questions asked, selection process, and tips from selected candidates."
        keywords = f"{company_name} interview experience, {company_name} interview process, {company_name} placement, {company_name} interview rounds"
    
    structured_data = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": title,
        "description": description,
        "url": f"{os.environ.get('FRONTEND_URL', 'https://yourdomain.com')}/experiences",
        "about": {
            "@type": "Thing",
            "name": "Interview Experiences",
            "description": f"Collection of {experiences_count} real interview experiences"
        }
    }
    
    return {
        "title": title,
        "description": description,
        "keywords": keywords,
        "canonical": "/experiences",
        "structuredData": structured_data,
        "experiencesCount": experiences_count,
        "companies": companies_with_exp
    }

@api_router.get("/seo/topic/{topic_id}")
async def get_topic_seo_data(topic_id: str):
    """Get SEO-optimized topic data with structured data markup"""
    topic = await db.topics.find_one({"id": topic_id}, {"_id": 0})
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    # Count questions for this topic
    questions_count = await db.questions.count_documents({"topic_id": topic_id})
    
    # Get sample questions for FAQPage schema
    sample_questions = await db.questions.find(
        {"topic_id": topic_id},
        {"_id": 0, "question": 1, "answer": 1, "difficulty": 1}
    ).limit(10).to_list(10)
    
    # Create FAQPage structured data for better SEO
    faq_entities = []
    for q in sample_questions:
        faq_entities.append({
            "@type": "Question",
            "name": q.get('question', ''),
            "acceptedAnswer": {
                "@type": "Answer",
                "text": q.get('answer', '')[:500] + "..." if len(q.get('answer', '')) > 500 else q.get('answer', '')
            }
        })
    
    structured_data = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faq_entities,
        "about": {
            "@type": "Thing",
            "name": f"{topic['name']} Programming",
            "description": topic.get('description', f"Practice {questions_count} {topic['name']} interview questions")
        },
        "provider": {
            "@type": "Organization",
            "name": "InterviewGuru Pro",
            "url": os.environ.get('FRONTEND_URL', 'https://yourdomain.com')
        }
    }
    
    return {
        "title": f"{topic['name']} Interview Questions 2025 - Practice {questions_count}+ Problems | IGP",
        "description": f"Master {topic['name']} interviews with {questions_count}+ real coding questions. Practice DSA problems, system design, and ace your technical interview. Updated for 2025.",
        "keywords": f"{topic['name']} interview questions, {topic['name']} coding problems, {topic['name']} DSA, {topic['name']} programming interview, {topic['name']} practice questions",
        "canonical": f"/topics?topic={topic_id}",
        "structuredData": structured_data,
        "topic": topic,
        "questionsCount": questions_count
    }

# ============= EXISTING ENDPOINTS (keeping all your code) =============

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
        
        await cache_collection.update_one(
            {"key": key},
            {
                "$set": {
                    "key": key,
                    "data": json.dumps(serialized_data),
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

# Auth dependency using Clerk (keeping your existing auth code)
async def get_current_user(authorization: str = Header(None, alias="Authorization")) -> Optional[User]:
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
        import jwt
        decoded = jwt.decode(token, options={"verify_signature": False})
        clerk_user_id = decoded.get('sub')
        
        if not clerk_user_id:
            logging.warning("No 'sub' claim in token")
            return None
        
        logging.info(f"✓ Token decoded successfully for clerk_id: {clerk_user_id}")
        
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
        
        return User(**user_doc)
        
    except Exception as e:
        logging.error(f"✗ Auth error: {e}")
        import traceback
        logging.error(traceback.format_exc())
        return None

async def require_auth(user: User = Depends(get_current_user)) -> User:
    if not user:
        logging.warning("✗ Authentication required but no user found")
        raise HTTPException(status_code=401, detail="Authentication required")
    return user

async def require_premium(user: User = Depends(require_auth)) -> User:
    if not user.is_premium and not user.is_admin:
        raise HTTPException(status_code=403, detail="Premium subscription required")
    return user

async def require_admin(user: User = Depends(require_auth)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# Auth endpoints
@api_router.get("/auth/me")
async def get_current_user_info(user: User = Depends(get_current_user)):
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
        logging.info(f"💰 Payment order request from user: {user.email} (clerk_id: {user.clerk_id})")
        logging.info(f"💰 Amount requested: ₹{order_req.amount / 100}")
        
        razor_order = razorpay_client.order.create({
            "amount": order_req.amount,
            "currency": "INR",
            "payment_capture": 1,
        })
        
        logging.info(f"✓ Razorpay order created: {razor_order['id']}")
        
        # Send email notification for payment initialization
        amount_inr = order_req.amount / 100
        email_subject = f"💳 Payment Initialized - ₹{amount_inr}"
        email_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #2563eb; margin-bottom: 20px;">💳 Payment Initialized</h2>
                
                <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
                    <h3 style="margin-top: 0; color: #1e40af;">Payment Details</h3>
                    <p><strong>User Email:</strong> {user.email}</p>
                    <p><strong>User Name:</strong> {user.name}</p>
                    <p><strong>Clerk ID:</strong> {user.clerk_id}</p>
                    <p><strong>Amount:</strong> ₹{amount_inr}</p>
                    <p><strong>Order ID:</strong> {razor_order['id']}</p>
                    <p><strong>Currency:</strong> INR</p>
                    <p><strong>Time:</strong> {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                    <p style="margin: 0; color: #92400e;"><strong>⚠️ Action Required:</strong> User is proceeding with payment. Monitor for completion.</p>
                </div>
                
                <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
                    This is an automated notification from your Interview Prep Platform.
                </p>
            </div>
        </body>
        </html>
        """
        send_email_notification(email_subject, email_body)
        
        return razor_order
        
    except Exception as e:
        logging.error(f"✗ Payment order creation failed: {e}")
        
        # Send email notification for payment error
        email_subject = f"❌ Payment Order Creation Failed"
        email_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #dc2626; margin-bottom: 20px;">❌ Payment Order Creation Failed</h2>
                
                <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626;">
                    <h3 style="margin-top: 0; color: #991b1b;">Error Details</h3>
                    <p><strong>User Email:</strong> {user.email}</p>
                    <p><strong>User Name:</strong> {user.name}</p>
                    <p><strong>Clerk ID:</strong> {user.clerk_id}</p>
                    <p><strong>Attempted Amount:</strong> ₹{order_req.amount / 100}</p>
                    <p><strong>Error:</strong> {str(e)}</p>
                    <p><strong>Time:</strong> {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                    <p style="margin: 0; color: #92400e;"><strong>⚠️ Action Required:</strong> Payment order creation failed. Please investigate the issue.</p>
                </div>
                
                <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
                    This is an automated notification from your Interview Prep Platform.
                </p>
            </div>
        </body>
        </html>
        """
        send_email_notification(email_subject, email_body)
        
        raise HTTPException(status_code=500, detail=f"Failed to create payment order: {str(e)}")

@api_router.post("/payment/verify")
async def verify_payment(payment: VerifyPaymentRequest, user: User = Depends(require_auth)):
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
        
        if clerk_client:
            try:
                clerk_client.users.update_metadata(
                    user_id=user.clerk_id,
                    public_metadata={"isPremium": True}
                )
                logging.info(f"✓ User metadata updated in Clerk")
            except Exception as e:
                logging.error(f"⚠️ Failed to update Clerk metadata (non-critical): {e}")
        
        # Send email notification for successful payment verification
        email_subject = f"✅ Payment Verified Successfully"
        email_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #16a34a; margin-bottom: 20px;">✅ Payment Verified Successfully</h2>
                
                <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #16a34a;">
                    <h3 style="margin-top: 0; color: #15803d;">Payment Verification Details</h3>
                    <p><strong>User Email:</strong> {user.email}</p>
                    <p><strong>User Name:</strong> {user.name}</p>
                    <p><strong>Clerk ID:</strong> {user.clerk_id}</p>
                    <p><strong>Order ID:</strong> {payment.razorpay_order_id}</p>
                    <p><strong>Payment ID:</strong> {payment.razorpay_payment_id}</p>
                    <p><strong>Premium Status:</strong> Activated ✅</p>
                    <p><strong>Time:</strong> {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background-color: #dbeafe; border-radius: 8px; border-left: 4px solid #2563eb;">
                    <p style="margin: 0; color: #1e40af;"><strong>🎉 Success:</strong> User has been upgraded to premium access.</p>
                </div>
                
                <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
                    This is an automated notification from your Interview Prep Platform.
                </p>
            </div>
        </body>
        </html>
        """
        send_email_notification(email_subject, email_body)
        
        return {
            "success": True,
            "message": "Payment verified and premium access granted"
        }
        
    except Exception as e:
        logging.error(f"✗ Payment verification failed: {e}")
        
        # Send email notification for payment verification error
        email_subject = f"❌ Payment Verification Failed"
        email_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #dc2626; margin-bottom: 20px;">❌ Payment Verification Failed</h2>
                
                <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626;">
                    <h3 style="margin-top: 0; color: #991b1b;">Verification Error Details</h3>
                    <p><strong>User Email:</strong> {user.email}</p>
                    <p><strong>User Name:</strong> {user.name}</p>
                    <p><strong>Clerk ID:</strong> {user.clerk_id}</p>
                    <p><strong>Order ID:</strong> {payment.razorpay_order_id}</p>
                    <p><strong>Payment ID:</strong> {payment.razorpay_payment_id}</p>
                    <p><strong>Error:</strong> {str(e)}</p>
                    <p><strong>Time:</strong> {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                    <p style="margin: 0; color: #92400e;"><strong>⚠️ Critical:</strong> Payment verification failed. This could indicate a signature mismatch or fraudulent attempt. Please investigate immediately.</p>
                </div>
                
                <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
                    This is an automated notification from your Interview Prep Platform.
                </p>
            </div>
        </body>
        </html>
        """
        send_email_notification(email_subject, email_body)
        
        raise HTTPException(status_code=400, detail=f"Payment verification failed: {str(e)}")

# Admin endpoints (keeping all your existing admin code)
@api_router.get("/admin/stats")
async def get_admin_stats(user: User = Depends(require_admin)):
    total_users = await db.users.count_documents({})
    premium_users = await db.users.count_documents({"is_premium": True})
    total_questions = await db.questions.count_documents({})
    total_companies = await db.companies.count_documents({})
    total_experiences = await db.experiences.count_documents({})
    total_alumni = await db.alumni.count_documents({})
    
    return {
        "total_users": total_users,
        "premium_users": premium_users,
        "total_questions": total_questions,
        "total_companies": total_companies,
        "total_experiences": total_experiences,
        "total_alumni": total_alumni
    }

@api_router.get("/admin/users")
async def get_all_users(user: User = Depends(require_admin)):
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
    
    await db.users.update_one(
        {"clerk_id": user_id}, 
        {"$set": {"is_admin": True, "is_premium": True}}
    )
    
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
async def create_question(question_data: dict, user: User = Depends(require_admin)):
    company_ids = question_data.get('company_ids', [])
    
    if not company_ids and question_data.get('company_id'):
        company_ids = [question_data['company_id']]
    
    if company_ids and isinstance(company_ids, list) and len(company_ids) > 1:
        created_questions = []
        for company_id in company_ids:
            question_dict = {**question_data}
            question_dict['company_id'] = company_id
            if 'company_ids' in question_dict:
                del question_dict['company_ids']
            
            question = Question(**question_dict)
            await db.questions.insert_one(question.model_dump())
            created_questions.append(question)
        
        await invalidate_cache_pattern("questions*")
        await invalidate_cache_pattern("company_questions*")
        await invalidate_cache_pattern("bookmarks*")
        
        for company_id in company_ids:
            count = await db.questions.count_documents({"company_id": company_id})
            await db.companies.update_one({"id": company_id}, {"$set": {"question_count": count}})
        
        await invalidate_cache_pattern("companies*")
        
        return {"success": True, "created": len(created_questions), "questions": [q.model_dump() for q in created_questions]}
    else:
        # Handle single company case
        if 'company_ids' in question_data and company_ids:
            # Extract the first company_id and set it
            question_data['company_id'] = company_ids[0]
            del question_data['company_ids']
        elif 'company_ids' in question_data:
            # No companies selected, just remove the field
            del question_data['company_ids']
        
        question = Question(**question_data)
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
        logging.error(f"✗ Failed to create company: {e}")
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
        logging.error(f"✗ Failed to update company: {e}")
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

# Alumni endpoints
@api_router.get("/admin/alumni")
async def get_all_alumni(user: User = Depends(require_admin)):
    alumni = await db.alumni.find({}, {"_id": 0}).to_list(10000)
    return alumni

@api_router.post("/admin/alumni")
async def create_alumni(alumni: Alumni, user: User = Depends(require_admin)):
    try:
        alumni_data = alumni.model_dump()
        logging.info(f"Creating alumni: {alumni_data}")
        
        await db.alumni.insert_one(alumni_data)
        await invalidate_cache_pattern("alumni*")
        
        logging.info(f"✓ Alumni created: {alumni.name} - College: {alumni.college}")
        return alumni
        
    except Exception as e:
        logging.error(f"✗ Failed to create alumni: {e}")
        import traceback
        logging.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to create alumni: {str(e)}")

@api_router.put("/admin/alumni/{alumni_id}")
async def update_alumni(alumni_id: str, alumni: Alumni, user: User = Depends(require_admin)):
    try:
        alumni_data = alumni.model_dump()
        logging.info(f"Updating alumni {alumni_id}: {alumni_data}")
        
        await db.alumni.update_one({"id": alumni_id}, {"$set": alumni_data})
        await invalidate_cache_pattern("alumni*")
        
        logging.info(f"✓ Alumni updated successfully")
        return alumni
        
    except Exception as e:
        logging.error(f"✗ Failed to update alumni: {e}")
        import traceback
        logging.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to update alumni: {str(e)}")

@api_router.delete("/admin/alumni/{alumni_id}")
async def delete_alumni(alumni_id: str, user: User = Depends(require_admin)):
    await db.alumni.delete_one({"id": alumni_id})
    await invalidate_cache_pattern("alumni*")
    return {"success": True}

# Public Alumni Endpoints
@api_router.get("/alumni/search")
async def search_alumni(
    company: Optional[str] = None,
    name: Optional[str] = None,
    role: Optional[str] = None,
    college: Optional[str] = None,
    location: Optional[str] = None,
    graduation_year: Optional[int] = None,
    user: Optional[User] = Depends(get_current_user)
):
    query = {}
    if company:
        query["company"] = {"$regex": company, "$options": "i"}
    if name:
        query["name"] = {"$regex": name, "$options": "i"}
    if role:
        query["role"] = {"$regex": role, "$options": "i"}
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    if college:
        query["college"] = {"$regex": college, "$options": "i"}
    if graduation_year is not None:
        query["graduation_year"] = graduation_year
    
    cache_key = generate_cache_key(
        "alumni_search",
        company=company,
        name=name,
        role=role,
        college=college,
        location=location,
        graduation_year=graduation_year
    )
    cached = await get_cached_data(cache_key)
    if cached:
        alumni_list = cached
    else:
        alumni_list = await db.alumni.find(query, {"_id": 0}).to_list(1000)
        await set_cached_data(cache_key, alumni_list, ttl=3600)
    
    is_premium = user and (user.is_premium or user.is_admin) if user else False
    
    if not is_premium:
        for alumni in alumni_list:
            if alumni.get('email'):
                alumni['email'] = '***@***.***'
            if alumni.get('phone'):
                alumni['phone'] = '***-***-****'
    
    return alumni_list

@api_router.get("/alumni/{alumni_id}/reveal")
async def reveal_alumni_contact(alumni_id: str, user: User = Depends(require_premium)):
    alumni = await db.alumni.find_one({"id": alumni_id}, {"_id": 0})
    if not alumni:
        raise HTTPException(status_code=404, detail="Alumni not found")
    
    return {
        "id": alumni["id"],
        "name": alumni["name"],
        "email": alumni.get("email", ""),
        "phone": alumni.get("phone", ""),
        "role": alumni["role"],
        "company": alumni["company"],
        "college": alumni.get("college"),
        "location": alumni.get("location"),
        "graduation_year": alumni.get("graduation_year")
    }

# ============= PROJECT-BASED INTERVIEW QUESTIONS (PREMIUM FEATURE) =============

# Pydantic models for Project Interview
class ProjectInterviewRequest(BaseModel):
    """Request model for project-based interview question generation"""
    model_config = ConfigDict(extra="ignore")
    project_title: str
    tech_stack: List[str]  # List of technologies used
    project_description: str
    features_implemented: str
    student_role: str  # Frontend / Backend / Full Stack / Solo

class InterviewQuestion(BaseModel):
    """Single interview question model"""
    question: str
    difficulty: str  # easy, medium, hard
    topic: str  # What aspect of the project this relates to

class ProjectInterviewResponse(BaseModel):
    """Response model with generated interview questions"""
    easy_questions: List[InterviewQuestion]
    medium_questions: List[InterviewQuestion]
    hard_questions: List[InterviewQuestion]
    generated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ProjectInterviewRateLimit(BaseModel):
    """Track daily rate limit for project interview generation"""
    model_config = ConfigDict(extra="ignore")
    user_id: str
    date: str  # YYYY-MM-DD format
    generation_count: int = 0
    last_generation: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# Constants for rate limiting
MAX_GENERATIONS_PER_DAY = 3

async def check_rate_limit(user_id: str) -> tuple[bool, int]:
    """
    Check if user has exceeded daily rate limit for project interview generation.
    Returns (is_allowed, remaining_count)
    """
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    
    rate_limit_doc = await db.project_interview_rate_limits.find_one({
        "user_id": user_id,
        "date": today
    })
    
    if not rate_limit_doc:
        # First generation today
        return True, MAX_GENERATIONS_PER_DAY
    
    current_count = rate_limit_doc.get('generation_count', 0)
    remaining = MAX_GENERATIONS_PER_DAY - current_count
    
    return remaining > 0, remaining

async def increment_rate_limit(user_id: str):
    """Increment the generation count for a user today"""
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    
    await db.project_interview_rate_limits.update_one(
        {"user_id": user_id, "date": today},
        {
            "$set": {
                "user_id": user_id,
                "date": today,
                "last_generation": datetime.now(timezone.utc).isoformat()
            },
            "$inc": {"generation_count": 1}
        },
        upsert=True
    )

@api_router.get("/project-interview/rate-limit")
async def get_project_interview_rate_limit(user: User = Depends(require_premium)):
    """Get remaining generations for today (premium users only)"""
    is_allowed, remaining = await check_rate_limit(user.clerk_id)
    return {
        "remaining_generations": remaining,
        "max_per_day": MAX_GENERATIONS_PER_DAY,
        "can_generate": is_allowed
    }

# Replace the import at the top of your file:
# OLD: from emergentintegrations.llm.chat import LlmChat, UserMessage
# NEW: import google.generativeai as genai

# Then update the generate_project_interview_questions function:

@api_router.post("/project-interview/generate")
async def generate_project_interview_questions(
    request: ProjectInterviewRequest,
    user: User = Depends(require_premium)
):
    """
    Generate AI-powered interview questions based on project details.
    PREMIUM USERS ONLY - Rate limited to 3 generations per day.
    """
    # Check rate limit
    is_allowed, remaining = await check_rate_limit(user.clerk_id)
    if not is_allowed:
        raise HTTPException(
            status_code=429,
            detail={
                "message": "Daily limit reached. You can generate up to 3 sets of questions per day.",
                "remaining": 0,
                "reset_at": "midnight UTC"
            }
        )
    
    # Validate input
    if not request.project_title.strip():
        raise HTTPException(status_code=400, detail="Project title is required")
    if not request.tech_stack or len(request.tech_stack) == 0:
        raise HTTPException(status_code=400, detail="At least one technology in tech stack is required")
    if not request.project_description.strip():
        raise HTTPException(status_code=400, detail="Project description is required")
    if not request.features_implemented.strip():
        raise HTTPException(status_code=400, detail="Features implemented is required")
    if request.student_role not in ["Frontend", "Backend", "Full Stack", "Solo"]:
        raise HTTPException(status_code=400, detail="Invalid student role. Must be Frontend, Backend, Full Stack, or Solo")
    
    # Get Gemini API key
    gemini_api_key = os.environ.get('GEMINI_API_KEY')
    if not gemini_api_key:
        logging.error("GEMINI_API_KEY not configured")
        raise HTTPException(status_code=500, detail="AI service not configured")
    
    try:
        # Configure Gemini
        genai.configure(api_key=gemini_api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Create the prompt
        system_prompt = """You are an expert technical interviewer with years of experience interviewing candidates for software engineering positions at top tech companies. Your job is to generate personalized interview questions based on a candidate's project experience.
Generate questions that:
1. Test the candidate's understanding of their own project
2. Probe technical decisions and trade-offs
3. Explore scalability, performance, and design considerations
4. Are relevant to the technologies they used
5. Match the difficulty level specified

Always output ONLY valid JSON in the exact format requested. No markdown, no explanations."""

        user_prompt = f"""Based on the following project details, generate exactly 15 interview questions - 5 Easy, 5 Medium, and 5 Hard.

PROJECT DETAILS:
- Title: {request.project_title}
- Tech Stack: {', '.join(request.tech_stack)}
- Description: {request.project_description}
- Features Implemented: {request.features_implemented}
- Candidate Role: {request.student_role}

DIFFICULTY GUIDELINES:
- Easy: Basic understanding questions, "What is...", "How did you...", "Explain..."
- Medium: Design decisions, "Why did you choose...", "What challenges...", "How would you improve..."
- Hard: Deep technical, scalability, system design, edge cases, performance optimization

Output ONLY a valid JSON object in this exact format (no markdown code blocks):
{{
  "easy_questions": [
    {{"question": "...", "difficulty": "easy", "topic": "..."}},
    {{"question": "...", "difficulty": "easy", "topic": "..."}},
    {{"question": "...", "difficulty": "easy", "topic": "..."}},
    {{"question": "...", "difficulty": "easy", "topic": "..."}},
    {{"question": "...", "difficulty": "easy", "topic": "..."}}
  ],
  "medium_questions": [
    {{"question": "...", "difficulty": "medium", "topic": "..."}},
    {{"question": "...", "difficulty": "medium", "topic": "..."}},
    {{"question": "...", "difficulty": "medium", "topic": "..."}},
    {{"question": "...", "difficulty": "medium", "topic": "..."}},
    {{"question": "...", "difficulty": "medium", "topic": "..."}}
  ],
  "hard_questions": [
    {{"question": "...", "difficulty": "hard", "topic": "..."}},
    {{"question": "...", "difficulty": "hard", "topic": "..."}},
    {{"question": "...", "difficulty": "hard", "topic": "..."}},
    {{"question": "...", "difficulty": "hard", "topic": "..."}},
    {{"question": "...", "difficulty": "hard", "topic": "..."}}
  ]
}}"""

        # Generate questions using Gemini (run in thread pool to not block)
        import asyncio
        full_prompt = f"{system_prompt}\n\n{user_prompt}"
        response = await asyncio.to_thread(model.generate_content, full_prompt)
        
        logging.info(f"Gemini response received for user {user.email}")
        
        # Parse the response
        response_text = response.text.strip()
        
        # Remove markdown code blocks if present
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        # Parse JSON
        questions_data = json.loads(response_text)
        
        # Validate structure
        if not all(key in questions_data for key in ['easy_questions', 'medium_questions', 'hard_questions']):
            raise ValueError("Invalid response structure from AI")
        
        # Increment rate limit after successful generation
        await increment_rate_limit(user.clerk_id)
        
        # Get updated remaining count
        _, new_remaining = await check_rate_limit(user.clerk_id)
        
        return {
            "success": True,
            "questions": questions_data,
            "remaining_generations": new_remaining,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
        
    except json.JSONDecodeError as e:
        logging.error(f"Failed to parse AI response: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response. Please try again.")
    except Exception as e:
        logging.error(f"Error generating interview questions: {e}")
        import traceback
        logging.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to generate questions: {str(e)}")

# Middleware setup
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
        
        logger.info("Dropping old indexes...")
        old_indexes = ["id_1", "email_1"]
        for index_name in old_indexes:
            try:
                await db.users.drop_index(index_name)
                logger.info(f"✓ Dropped old index: {index_name}")
            except Exception:
                pass
        
        logger.info("Creating indexes...")
        
        await db.topics.create_index("id", unique=True)
        
        await db.questions.create_index("id", unique=True)
        await db.questions.create_index("topic_id")
        await db.questions.create_index("company_id")
        await db.questions.create_index([("difficulty", 1), ("topic_id", 1)])
        await db.questions.create_index([("category", 1), ("company_id", 1)])
        
        await db.companies.create_index("id", unique=True)
        await db.companies.create_index("name")
        await db.companies.create_index("slug", unique=True)
        
        await db.experiences.create_index("id", unique=True)
        await db.experiences.create_index("company_id")
        await db.experiences.create_index([("posted_at", -1)])
        
        await db.users.create_index("clerk_id", unique=True)
        await db.users.create_index("email")
        
        await cache_collection.create_index("key", unique=True)
        await cache_collection.create_index("expires_at", expireAfterSeconds=0)
        
        logger.info("✓ All indexes created successfully")
        
        if razorpay_client:
            logger.info("✓ Razorpay client initialized")
        else:
            logger.warning("⚠️ Razorpay not configured - payments disabled")
        
        if clerk_client:
            logger.info("✓ Clerk client initialized")
        else:
            logger.warning("⚠️ Clerk not configured")
        
        logger.info("Warming up cache...")
        topics = await db.topics.find({}, {"_id": 0}).to_list(1000)
        await set_cached_data("topics", topics, ttl=7200)
        
        companies = await db.companies.find({}, {"_id": 0}).to_list(1000)
        await set_cached_data("companies", companies, ttl=7200)
        
        logger.info("✓ Cache warmed up")
        logger.info("🎉 Database initialization complete!")
        
    except Exception as e:
        logger.error(f"✗ Startup error: {e}")
        import traceback
        logger.error(traceback.format_exc())

@api_router.get("/debug/razorpay-status")
async def check_razorpay_status():
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
    
    return {
        "status": "healthy" if mongo_status == "healthy" and cache_status == "healthy" else "degraded",
        "mongodb": mongo_status,
        "cache": cache_status
    }

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

app.include_router(api_router)