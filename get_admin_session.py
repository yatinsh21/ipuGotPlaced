#!/usr/bin/env python3
"""
Get admin session token from database
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent / 'backend'
load_dotenv(ROOT_DIR / '.env')

async def get_admin_session():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🔍 Looking for admin session tokens...")
    
    # Find admin users
    admin_users = await db.users.find({"is_admin": True}, {"_id": 0}).to_list(1000)
    
    if not admin_users:
        print("❌ No admin users found")
        client.close()
        return None
    
    print(f"Found {len(admin_users)} admin users")
    
    # Get sessions for admin users
    for admin_user in admin_users:
        user_id = admin_user.get('id')
        email = admin_user.get('email')
        
        sessions = await db.sessions.find({"user_id": user_id}, {"_id": 0}).to_list(10)
        
        if sessions:
            print(f"\nAdmin: {email} (ID: {user_id})")
            print(f"Sessions found: {len(sessions)}")
            
            # Return the first valid session token
            session_token = sessions[0].get('session_token')
            print(f"Session token: {session_token}")
            
            client.close()
            return session_token
    
    print("❌ No sessions found for admin users")
    client.close()
    return None

if __name__ == "__main__":
    token = asyncio.run(get_admin_session())
    if token:
        print(f"\n✅ Admin session token: {token}")
    else:
        print("\n❌ No admin session token found")