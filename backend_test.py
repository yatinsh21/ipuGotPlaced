import requests
import sys
import json
from datetime import datetime

class InterviewPrepAPITester:
    def __init__(self, base_url="https://interviewace-app.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.admin_token = None

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    Details: {details}")
        if success:
            self.tests_passed += 1
        else:
            self.failed_tests.append({"name": name, "details": details})
        print()

    def test_endpoint(self, method, endpoint, expected_status=200, data=None, headers=None, description=""):
        """Generic endpoint tester"""
        url = f"{self.api_url}/{endpoint}"
        
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, headers=headers)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data, headers=headers)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, headers=headers)
            
            success = response.status_code == expected_status
            details = f"Status: {response.status_code}, Expected: {expected_status}"
            
            if success and response.status_code == 200:
                try:
                    json_data = response.json()
                    if isinstance(json_data, list):
                        details += f", Items: {len(json_data)}"
                    elif isinstance(json_data, dict):
                        details += f", Keys: {list(json_data.keys())}"
                except:
                    details += ", Non-JSON response"
            
            self.log_test(f"{method.upper()} {endpoint} - {description}", success, details)
            return success, response
            
        except Exception as e:
            self.log_test(f"{method.upper()} {endpoint} - {description}", False, f"Exception: {str(e)}")
            return False, None

    def test_free_endpoints(self):
        """Test all free endpoints that don't require authentication"""
        print("🔍 Testing Free Endpoints...")
        print("=" * 50)
        
        # Test topics endpoint (should be cached in Redis)
        success, response = self.test_endpoint('GET', 'topics', 200, description="Get all topics (Redis cached)")
        if success and response:
            try:
                topics = response.json()
                if len(topics) > 0:
                    # Test questions with first topic
                    topic_id = topics[0]['id']
                    self.test_endpoint('GET', f'questions?topic_id={topic_id}', 200, 
                                     description=f"Get questions for topic {topics[0]['name']}")
                    
                    # Test difficulty filter
                    self.test_endpoint('GET', f'questions?topic_id={topic_id}&difficulty=easy', 200,
                                     description="Get easy questions with difficulty filter")
                else:
                    print("⚠️  No topics found in database")
            except Exception as e:
                print(f"⚠️  Error processing topics response: {e}")
        
        # Test questions endpoint without filters
        self.test_endpoint('GET', 'questions', 200, description="Get all questions")
        
        # Test experiences endpoint
        self.test_endpoint('GET', 'experiences', 200, description="Get all interview experiences")

    def test_protected_endpoints(self):
        """Test endpoints that require authentication but no admin"""
        print("🔒 Testing Protected Endpoints (without auth - should fail)...")
        print("=" * 60)
        
        # These should return 401 without authentication
        self.test_endpoint('GET', 'companies', 401, description="Get companies (should require auth)")
        self.test_endpoint('GET', 'auth/me', 401, description="Get current user (should require auth)")
        self.test_endpoint('POST', 'auth/logout', 401, description="Logout (should require auth)")

    def test_admin_endpoints(self):
        """Test admin endpoints (should fail without admin auth)"""
        print("👑 Testing Admin Endpoints (without admin auth - should fail)...")
        print("=" * 65)
        
        # Admin stats
        self.test_endpoint('GET', 'admin/stats', 401, description="Get admin stats (should require admin)")
        
        # Admin CRUD endpoints
        self.test_endpoint('GET', 'admin/questions', 401, description="Get all questions (admin)")
        self.test_endpoint('GET', 'admin/users', 401, description="Get all users (admin)")
        
        # Test POST endpoints (should fail without auth)
        test_topic = {"name": "Test Topic", "description": "Test Description"}
        self.test_endpoint('POST', 'admin/topics', 401, data=test_topic, description="Create topic (should require admin)")
        
        test_company = {"name": "Test Company", "logo_url": ""}
        self.test_endpoint('POST', 'admin/companies', 401, data=test_company, description="Create company (should require admin)")

    def test_redis_caching(self):
        """Test Redis caching by making multiple requests"""
        print("⚡ Testing Redis Caching...")
        print("=" * 30)
        
        # Test topics caching
        start_time = datetime.now()
        success1, _ = self.test_endpoint('GET', 'topics', 200, description="Topics - First request (cache miss)")
        first_request_time = (datetime.now() - start_time).total_seconds()
        
        start_time = datetime.now()
        success2, _ = self.test_endpoint('GET', 'topics', 200, description="Topics - Second request (cache hit)")
        second_request_time = (datetime.now() - start_time).total_seconds()
        
        if success1 and success2:
            if second_request_time < first_request_time:
                print(f"✅ Redis caching working - Second request faster ({second_request_time:.3f}s vs {first_request_time:.3f}s)")
            else:
                print(f"⚠️  Redis caching unclear - Times: {first_request_time:.3f}s vs {second_request_time:.3f}s")

    def test_error_handling(self):
        """Test error handling for invalid requests"""
        print("🚫 Testing Error Handling...")
        print("=" * 30)
        
        # Test invalid endpoints
        self.test_endpoint('GET', 'invalid-endpoint', 404, description="Invalid endpoint (should return 404)")
        
        # Test invalid question ID
        self.test_endpoint('GET', 'questions?topic_id=invalid-id', 200, description="Invalid topic ID (should return empty array)")

    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting Interview Prep Platform API Tests")
        print(f"🌐 Base URL: {self.base_url}")
        print("=" * 70)
        print()
        
        # Run test suites
        self.test_free_endpoints()
        print()
        self.test_protected_endpoints()
        print()
        self.test_admin_endpoints()
        print()
        self.test_redis_caching()
        print()
        self.test_error_handling()
        
        # Print summary
        print("=" * 70)
        print("📊 TEST SUMMARY")
        print("=" * 70)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {len(self.failed_tests)}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in self.failed_tests:
                print(f"  - {test['name']}: {test['details']}")
        
        print("\n🔍 TESTING NOTES:")
        print("- Free endpoints (topics, questions, experiences) should work without auth")
        print("- Protected endpoints should return 401 without authentication")
        print("- Admin endpoints should return 401/403 without admin privileges")
        print("- Redis caching should make subsequent requests faster")
        
        return self.tests_passed == self.tests_run

def main():
    tester = InterviewPrepAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())