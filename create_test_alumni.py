#!/usr/bin/env python3
"""
Script to create test alumni data for testing the Alumni/Senior Search feature
"""

import asyncio
import os
import sys
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import uuid

# Add the backend directory to the path
sys.path.append(str(Path(__file__).parent / 'backend'))

async def create_test_alumni():
    """Create test alumni data in the database"""
    
    # Connect to MongoDB
    mongo_url = "mongodb://localhost:27017"
    client = AsyncIOMotorClient(mongo_url)
    db = client["interview_prep_db"]
    
    # Test alumni data
    test_alumni = [
        {
            "id": str(uuid.uuid4()),
            "name": "Sarah Johnson",
            "email": "sarah.johnson@google.com",
            "phone": "+1-555-0123",
            "role": "Senior Software Engineer",
            "company": "Google",
            "years_of_experience": 5,
            "location": "Mountain View, CA",
            "graduation_year": 2018,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Michael Chen",
            "email": "michael.chen@microsoft.com",
            "phone": "+1-555-0456",
            "role": "Principal Engineer",
            "company": "Microsoft",
            "years_of_experience": 8,
            "location": "Seattle, WA",
            "graduation_year": 2015,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Priya Sharma",
            "email": "priya.sharma@amazon.com",
            "role": "Software Development Manager",
            "company": "Amazon",
            "years_of_experience": 6,
            "location": "Bangalore, India",
            "graduation_year": 2017,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "David Wilson",
            "email": "david.wilson@meta.com",
            "phone": "+1-555-0789",
            "role": "Staff Engineer",
            "company": "Meta",
            "years_of_experience": 7,
            "location": "Menlo Park, CA",
            "graduation_year": 2016,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Emily Rodriguez",
            "email": "emily.rodriguez@netflix.com",
            "phone": "+1-555-0321",
            "role": "Senior Data Scientist",
            "company": "Netflix",
            "years_of_experience": 4,
            "location": "Los Gatos, CA",
            "graduation_year": 2019,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    try:
        # Clear existing alumni data
        await db.alumni.delete_many({})
        print("Cleared existing alumni data")
        
        # Insert test alumni
        result = await db.alumni.insert_many(test_alumni)
        print(f"✅ Created {len(result.inserted_ids)} test alumni records")
        
        # Verify the data
        count = await db.alumni.count_documents({})
        print(f"✅ Total alumni in database: {count}")
        
        # Show sample data
        sample = await db.alumni.find_one({})
        if sample:
            print(f"✅ Sample alumni: {sample['name']} - {sample['role']} at {sample['company']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating test alumni: {e}")
        return False
    
    finally:
        client.close()

async def main():
    """Main function"""
    print("🎓 Creating test alumni data...")
    success = await create_test_alumni()
    
    if success:
        print("\n✅ Test alumni data created successfully!")
        print("You can now test the Alumni/Senior Search feature with real data.")
    else:
        print("\n❌ Failed to create test alumni data")
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)