import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone
import uuid

async def seed_database():
    mongo_url = "mongodb://localhost:27017"
    client = AsyncIOMotorClient(mongo_url)
    db = client["interview_prep_db"]
    
    # Clear existing data
    await db.topics.delete_many({})
    await db.questions.delete_many({})
    await db.companies.delete_many({})
    await db.experiences.delete_many({})
    
    print("Seeding topics...")
    topics = [
        {
            "id": str(uuid.uuid4()),
            "name": "Data Structures",
            "description": "Questions on arrays, linked lists, trees, graphs, etc.",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Algorithms",
            "description": "Sorting, searching, dynamic programming, greedy algorithms",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "System Design",
            "description": "Design scalable systems and architecture",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "OOP Concepts",
            "description": "Object-oriented programming principles",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.topics.insert_many(topics)
    
    print("Seeding companies...")
    companies = [
        {
            "id": str(uuid.uuid4()),
            "name": "Google",
            "logo_url": "https://cdn.worldvectorlogo.com/logos/google-icon.svg",
            "question_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Microsoft",
            "logo_url": "https://cdn.worldvectorlogo.com/logos/microsoft-5.svg",
            "question_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Amazon",
            "logo_url": "https://cdn.worldvectorlogo.com/logos/amazon-icon-1.svg",
            "question_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Meta",
            "logo_url": "https://cdn.worldvectorlogo.com/logos/meta-icon-new.svg",
            "question_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.companies.insert_many(companies)
    
    print("Seeding questions...")
    # Free questions for topics
    topic_questions = [
        {
            "id": str(uuid.uuid4()),
            "topic_id": topics[0]["id"],
            "company_id": None,
            "question": "What is the difference between an array and a linked list?",
            "answer": "Arrays store elements in contiguous memory locations with fixed size, while linked lists use nodes with pointers allowing dynamic size. Arrays provide O(1) access but O(n) insertion/deletion, whereas linked lists offer O(1) insertion/deletion but O(n) access.",
            "difficulty": "easy",
            "tags": [],
            "category": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "topic_id": topics[0]["id"],
            "company_id": None,
            "question": "Explain the concept of a hash table and its time complexity",
            "answer": "A hash table is a data structure that maps keys to values using a hash function. It provides average O(1) time complexity for insertion, deletion, and lookup operations. Collisions are handled using techniques like chaining or open addressing.",
            "difficulty": "medium",
            "tags": [],
            "category": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "topic_id": topics[1]["id"],
            "company_id": None,
            "question": "What is the time complexity of binary search?",
            "answer": "Binary search has a time complexity of O(log n) as it divides the search space in half with each comparison. It requires the array to be sorted and works by repeatedly comparing the middle element with the target value.",
            "difficulty": "easy",
            "tags": [],
            "category": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "topic_id": topics[2]["id"],
            "company_id": None,
            "question": "How would you design a URL shortening service like bit.ly?",
            "answer": "Key components: 1) Hash function to generate unique short URLs 2) Database to store mappings 3) Redirection service 4) Analytics tracking. Use base62 encoding, distributed caching (Redis), load balancers, and SQL/NoSQL database for scalability.",
            "difficulty": "hard",
            "tags": [],
            "category": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Premium questions for companies
    company_questions = [
        {
            "id": str(uuid.uuid4()),
            "topic_id": None,
            "company_id": companies[0]["id"],
            "question": "Design a scalable web crawler for Google Search",
            "answer": "Use distributed architecture with: 1) URL frontier for managing URLs to crawl 2) DNS resolver pool 3) Robots.txt checker 4) Content parser 5) Duplicate detector using Bloom filters 6) Storage system (HBase/Bigtable) 7) Prioritization using PageRank",
            "difficulty": "hard",
            "tags": ["v.imp"],
            "category": "technical",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "topic_id": None,
            "company_id": companies[0]["id"],
            "question": "Tell me about a challenging project you worked on",
            "answer": "Example answer: Describe a project where you faced technical challenges, how you approached problem-solving, collaboration with team members, and the positive outcome. Focus on your specific contributions and learnings.",
            "difficulty": "medium",
            "tags": ["just-read"],
            "category": "HR",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "topic_id": None,
            "company_id": companies[1]["id"],
            "question": "Reverse a linked list iteratively and recursively",
            "answer": "Iterative: Use three pointers (prev, curr, next) to reverse links. Recursive: Base case is null/single node, recursively reverse rest and adjust pointers. Time O(n), Space O(1) iterative, O(n) recursive.",
            "difficulty": "medium",
            "tags": ["v.imp", "fav"],
            "category": "coding",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "topic_id": None,
            "company_id": companies[2]["id"],
            "question": "Describe Amazon's leadership principles",
            "answer": "Amazon has 16 leadership principles including: Customer Obsession, Ownership, Invent and Simplify, Learn and Be Curious, Hire and Develop the Best, etc. Prepare specific examples demonstrating these principles from your experience.",
            "difficulty": "easy",
            "tags": ["just-read"],
            "category": "HR",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "topic_id": None,
            "company_id": companies[3]["id"],
            "question": "Explain how you would optimize React application performance",
            "answer": "Techniques: 1) Use React.memo for component memoization 2) useMemo/useCallback hooks 3) Code splitting with lazy loading 4) Virtual scrolling for large lists 5) Debouncing/throttling 6) Optimize re-renders 7) Use production build",
            "difficulty": "medium",
            "tags": ["v.imp"],
            "category": "technical",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.questions.insert_many(topic_questions + company_questions)
    
    # Update company question counts
    for company in companies:
        count = len([q for q in company_questions if q["company_id"] == company["id"]])
        await db.companies.update_one({"id": company["id"]}, {"$set": {"question_count": count}})
    
    print("Seeding experiences...")
    experiences = [
        {
            "id": str(uuid.uuid4()),
            "company_id": companies[0]["id"],
            "company_name": "Google",
            "role": "Software Engineer",
            "rounds": 5,
            "experience": "Round 1: Phone screening with coding (45 min)\\nRound 2: Technical interview - algorithms and data structures\\nRound 3: System design - design YouTube\\nRound 4: Behavioral questions using STAR method\\nRound 5: Team matching and culture fit\\n\\nTips: Practice LeetCode medium/hard, understand Google's products, prepare system design scenarios.",
            "posted_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "company_id": companies[1]["id"],
            "company_name": "Microsoft",
            "role": "SDE 2",
            "rounds": 4,
            "experience": "Round 1: Coding round - two medium level problems\\nRound 2: System design - design a distributed cache\\nRound 3: Technical + behavioral mix\\nRound 4: Hiring manager discussion\\n\\nFocus on: Azure services knowledge, clean code practices, teamwork examples, growth mindset.",
            "posted_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.experiences.insert_many(experiences)
    
    print("Database seeded successfully!")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
