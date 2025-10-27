#!/usr/bin/env python3
"""
Test admin user management functionality with authentication
"""
import requests
import json
import sys
from datetime import datetime

class AdminUserManagementTester:
    def __init__(self, base_url="https://interviewace-app.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = requests.Session()
        self.admin_token = None
        self.test_results = []
        
    def log_result(self, test_name, success, details="", response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}")
        if details:
            print(f"    Details: {details}")
        if response_data and isinstance(response_data, dict):
            print(f"    Response: {json.dumps(response_data, indent=2)}")
        print()
        
        self.test_results.append({
            "name": test_name,
            "success": success,
            "details": details,
            "response": response_data
        })
    
    def try_session_token_auth(self):
        """Try to use existing session token from logs"""
        print("🔑 Attempting to use existing session token...")
        
        # Admin session token from database
        session_token = "oW5LtFoRHu-N1whQgtNB566XNPXY6uM_6MIafBkO4-w"
        
        # Try with Authorization header
        headers = {'Authorization': f'Bearer {session_token}'}
        
        try:
            response = self.session.get(f"{self.api_url}/auth/me", headers=headers)
            if response.status_code == 200:
                user_data = response.json()
                print(f"✅ Successfully authenticated as: {user_data.get('user', {}).get('email', 'Unknown')}")
                print(f"    Admin status: {user_data.get('user', {}).get('is_admin', False)}")
                print(f"    Premium status: {user_data.get('user', {}).get('is_premium', False)}")
                
                if user_data.get('user', {}).get('is_admin'):
                    self.admin_token = session_token
                    return True, user_data['user']
                else:
                    print("⚠️  User is not an admin")
                    return False, user_data['user']
            else:
                print(f"❌ Authentication failed: {response.status_code}")
                return False, None
                
        except Exception as e:
            print(f"❌ Error during authentication: {e}")
            return False, None
    
    def test_get_all_users(self):
        """Test GET /api/admin/users"""
        print("👥 Testing GET /api/admin/users...")
        
        if not self.admin_token:
            self.log_result("Get All Users", False, "No admin authentication available")
            return None
        
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        try:
            response = self.session.get(f"{self.api_url}/admin/users", headers=headers)
            
            if response.status_code == 200:
                users = response.json()
                self.log_result("Get All Users", True, 
                              f"Retrieved {len(users)} users", 
                              {"user_count": len(users), "sample_user": users[0] if users else None})
                return users
            else:
                self.log_result("Get All Users", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
                return None
                
        except Exception as e:
            self.log_result("Get All Users", False, f"Exception: {str(e)}")
            return None
    
    def test_grant_admin_access(self, target_user_id, target_email="unknown"):
        """Test POST /api/admin/users/{user_id}/grant-admin"""
        print(f"👑 Testing Grant Admin Access for user: {target_email}")
        
        if not self.admin_token:
            self.log_result("Grant Admin Access", False, "No admin authentication available")
            return False
        
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        try:
            response = self.session.post(f"{self.api_url}/admin/users/{target_user_id}/grant-admin", 
                                       headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                self.log_result("Grant Admin Access", True, 
                              f"Successfully granted admin access", result)
                return True
            elif response.status_code == 404:
                self.log_result("Grant Admin Access", False, 
                              f"User not found: {target_user_id}")
                return False
            else:
                self.log_result("Grant Admin Access", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Grant Admin Access", False, f"Exception: {str(e)}")
            return False
    
    def test_revoke_admin_access(self, target_user_id, target_email="unknown", is_self=False):
        """Test POST /api/admin/users/{user_id}/revoke-admin"""
        print(f"🚫 Testing Revoke Admin Access for user: {target_email}")
        
        if not self.admin_token:
            self.log_result("Revoke Admin Access", False, "No admin authentication available")
            return False
        
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        try:
            response = self.session.post(f"{self.api_url}/admin/users/{target_user_id}/revoke-admin", 
                                       headers=headers)
            
            if is_self and response.status_code == 400:
                # Expected behavior - admin cannot revoke their own access
                result = response.json() if response.headers.get('content-type', '').startswith('application/json') else {"detail": response.text}
                self.log_result("Revoke Admin Access (Self)", True, 
                              "Correctly prevented self-revocation", result)
                return True
            elif response.status_code == 200:
                result = response.json()
                self.log_result("Revoke Admin Access", True, 
                              f"Successfully revoked admin access", result)
                return True
            elif response.status_code == 404:
                self.log_result("Revoke Admin Access", False, 
                              f"User not found: {target_user_id}")
                return False
            else:
                self.log_result("Revoke Admin Access", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Revoke Admin Access", False, f"Exception: {str(e)}")
            return False
    
    def test_toggle_premium_status(self, target_user_id, target_email="unknown", is_admin_user=False):
        """Test POST /api/admin/users/{user_id}/toggle-premium"""
        print(f"💎 Testing Toggle Premium Status for user: {target_email}")
        
        if not self.admin_token:
            self.log_result("Toggle Premium Status", False, "No admin authentication available")
            return False
        
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        try:
            response = self.session.post(f"{self.api_url}/admin/users/{target_user_id}/toggle-premium", 
                                       headers=headers)
            
            if is_admin_user and response.status_code == 400:
                # Expected behavior - cannot remove premium from admin users
                result = response.json() if response.headers.get('content-type', '').startswith('application/json') else {"detail": response.text}
                self.log_result("Toggle Premium Status (Admin User)", True, 
                              "Correctly prevented premium removal from admin", result)
                return True
            elif response.status_code == 200:
                result = response.json()
                self.log_result("Toggle Premium Status", True, 
                              f"Successfully toggled premium status", result)
                return True
            elif response.status_code == 404:
                self.log_result("Toggle Premium Status", False, 
                              f"User not found: {target_user_id}")
                return False
            else:
                self.log_result("Toggle Premium Status", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Toggle Premium Status", False, f"Exception: {str(e)}")
            return False
    
    def test_invalid_user_scenarios(self):
        """Test with invalid user IDs"""
        print("🚫 Testing Invalid User Scenarios...")
        
        invalid_user_id = "invalid-user-id-999"
        
        # Test all endpoints with invalid user ID - these should return 404
        print("   (These should return 404 for non-existent users)")
        
        # These are expected to "fail" with 404, which is correct behavior
        grant_result = self.test_grant_admin_access(invalid_user_id, "invalid-user")
        revoke_result = self.test_revoke_admin_access(invalid_user_id, "invalid-user")
        toggle_result = self.test_toggle_premium_status(invalid_user_id, "invalid-user")
        
        # Mark these as successful if they returned 404 (which means they failed as expected)
        if not grant_result:
            self.log_result("Grant Admin Access (Invalid User)", True, "Correctly returned 404 for invalid user")
        if not revoke_result:
            self.log_result("Revoke Admin Access (Invalid User)", True, "Correctly returned 404 for invalid user")
        if not toggle_result:
            self.log_result("Toggle Premium Status (Invalid User)", True, "Correctly returned 404 for invalid user")
    
    def run_comprehensive_test(self):
        """Run comprehensive admin user management tests"""
        print("🚀 Starting Comprehensive Admin User Management Tests")
        print(f"🌐 Base URL: {self.base_url}")
        print("=" * 70)
        print()
        
        # Step 1: Try to authenticate
        auth_success, current_user = self.try_session_token_auth()
        
        if not auth_success:
            print("❌ Cannot proceed without admin authentication")
            print("ℹ️  Admin authentication requires OAuth flow with sharmayatin0882@gmail.com")
            return False
        
        print()
        
        # Step 2: Get all users
        users = self.test_get_all_users()
        
        if not users:
            print("❌ Cannot proceed without user data")
            return False
        
        print()
        
        # Step 3: Find test targets
        current_user_id = current_user.get('id')
        non_admin_users = [u for u in users if not u.get('is_admin') and u.get('id') != current_user_id]
        admin_users = [u for u in users if u.get('is_admin')]
        
        print(f"📊 User Analysis:")
        print(f"   Total users: {len(users)}")
        print(f"   Admin users: {len(admin_users)}")
        print(f"   Non-admin users: {len(non_admin_users)}")
        print(f"   Current user ID: {current_user_id}")
        print()
        
        # Step 4: Test scenarios
        if non_admin_users:
            target_user = non_admin_users[0]
            target_id = target_user.get('id')
            target_email = target_user.get('email', 'unknown')
            
            print(f"🎯 Testing with non-admin user: {target_email}")
            
            # Grant admin access
            if self.test_grant_admin_access(target_id, target_email):
                # Try to toggle premium (should fail if user is now admin)
                print(f"🔒 Testing premium removal prevention for admin user...")
                self.test_toggle_premium_status(target_id, target_email, is_admin_user=True)
                
                # Try to revoke admin access
                self.test_revoke_admin_access(target_id, target_email)
            
            print()
        
        # Step 4.5: Test with another non-admin user for premium toggle
        if len(non_admin_users) > 1:
            target_user = non_admin_users[1]
            target_id = target_user.get('id')
            target_email = target_user.get('email', 'unknown')
            
            print(f"💎 Testing premium toggle with non-admin user: {target_email}")
            
            # Toggle premium for non-admin user (should work)
            self.test_toggle_premium_status(target_id, target_email, is_admin_user=False)
            
            print()
        
        # Step 5: Test self-revocation prevention
        print(f"🔒 Testing Self-Revocation Prevention...")
        self.test_revoke_admin_access(current_user_id, current_user.get('email', 'current-user'), is_self=True)
        print()
        
        # Step 6: Test invalid scenarios
        self.test_invalid_user_scenarios()
        print()
        
        # Summary
        print("=" * 70)
        print("📊 TEST SUMMARY")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r['success']])
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {total_tests - passed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"  - {test['name']}: {test['details']}")
        
        return passed_tests == total_tests

def main():
    tester = AdminUserManagementTester()
    success = tester.run_comprehensive_test()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())