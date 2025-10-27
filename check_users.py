#!/usr/bin/env python3
"""
Check users in the database
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent / 'backend'
load_dotenv(ROOT_DIR / '.env')

async def check_users():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🔍 Checking users in database...")
    print("=" * 50)
    
    # Get all users
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    
    print(f"Total users found: {len(users)}")
    print()
    
    admin_emails = os.environ.get('ADMIN_EMAILS', '').split(',')
    print(f"Configured admin emails: {admin_emails}")
    print()
    
    for i, user in enumerate(users, 1):
        print(f"User {i}:")
        print(f"  ID: {user.get('id', 'N/A')}")
        print(f"  Email: {user.get('email', 'N/A')}")
        print(f"  Name: {user.get('name', 'N/A')}")
        print(f"  Is Admin: {user.get('is_admin', False)}")
        print(f"  Is Premium: {user.get('is_premium', False)}")
        print(f"  Created: {user.get('created_at', 'N/A')}")
        
        # Check if this email should be admin
        if user.get('email') in admin_emails:
            print(f"  ⚠️  This user should be admin but is_admin={user.get('is_admin')}")
        
        print()
    
    # Check sessions
    sessions = await db.sessions.find({}, {"_id": 0}).to_list(1000)
    print(f"Active sessions: {len(sessions)}")
    
    for session in sessions:
        user_id = session.get('user_id')
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user:
            print(f"  Session for: {user.get('email')} (Admin: {user.get('is_admin')})")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_users())