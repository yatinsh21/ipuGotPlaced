import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def fix_question_counts():
    """Recalculate and update question counts for all companies"""
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("Fixing question counts for all companies...")
    
    # Get all companies
    companies = await db.companies.find({}, {"_id": 0, "id": 1, "name": 1}).to_list(1000)
    
    for company in companies:
        # Count questions for this company
        count = await db.questions.count_documents({"company_id": company['id']})
        
        # Update the company document
        await db.companies.update_one(
            {"id": company['id']}, 
            {"$set": {"question_count": count}}
        )
        
        print(f"✅ Updated {company['name']}: {count} questions")
    
    print(f"\n✅ Successfully updated question counts for {len(companies)} companies")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_question_counts())
