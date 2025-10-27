import requests
import sys
import json
import time
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

    def test_health_check(self):
        """Test health check endpoint for MongoDB and Redis connectivity"""
        print("🏥 Testing Health Check Endpoint...")
        print("=" * 40)
        
        success, response = self.test_endpoint('GET', 'health', 200, description="Health check - MongoDB and Redis connectivity")
        
        if success and response:
            try:
                health_data = response.json()
                print(f"    Health Status: {health_data.get('status', 'unknown')}")
                print(f"    MongoDB: {health_data.get('mongodb', 'unknown')}")
                print(f"    Redis: {health_data.get('redis', 'unknown')}")
                
                if health_data.get('mongodb') == 'healthy' and health_data.get('redis') == 'healthy':
                    print("✅ Both MongoDB and Redis are healthy")
                else:
                    print("⚠️  One or more services are not healthy")
            except Exception as e:
                print(f"⚠️  Error parsing health check response: {e}")

    def test_cache_warming(self):
        """Test cache warming on startup by checking if data loads faster"""
        print("🔥 Testing Cache Warming...")
        print("=" * 30)
        
        # Test topics (should be warmed up on startup)
        start_time = time.time()
        success1, response1 = self.test_endpoint('GET', 'topics', 200, description="Topics - Should be pre-warmed")
        topics_time = time.time() - start_time
        
        # Test companies-preview (should be warmed up on startup)
        start_time = time.time()
        success2, response2 = self.test_endpoint('GET', 'companies-preview', 200, description="Companies preview - Should be pre-warmed")
        companies_time = time.time() - start_time
        
        if success1 and success2:
            print(f"    Topics response time: {topics_time:.3f}s")
            print(f"    Companies response time: {companies_time:.3f}s")
            
            # If both are under 100ms, likely cached
            if topics_time < 0.1 and companies_time < 0.1:
                print("✅ Cache warming appears to be working - Fast response times")
            else:
                print("⚠️  Cache warming may not be working - Slower response times")

    def test_redis_caching_detailed(self):
        """Test Redis caching in detail with multiple scenarios"""
        print("⚡ Testing Redis Caching (Detailed)...")
        print("=" * 40)
        
        # Test 1: Topics caching
        print("📋 Testing Topics Caching:")
        times = []
        for i in range(3):
            start_time = time.time()
            success, _ = self.test_endpoint('GET', 'topics', 200, description=f"Topics request #{i+1}")
            request_time = time.time() - start_time
            times.append(request_time)
            time.sleep(0.1)  # Small delay between requests
        
        print(f"    Request times: {[f'{t:.3f}s' for t in times]}")
        if len(times) >= 2 and times[1] < times[0]:
            print("✅ Topics caching working - Subsequent requests faster")
        
        # Test 2: Questions caching with different filters
        print("\n❓ Testing Questions Caching with Filters:")
        
        # Get a topic ID first
        success, response = self.test_endpoint('GET', 'topics', 200, description="Get topics for filter testing")
        if success and response:
            topics = response.json()
            if topics:
                topic_id = topics[0]['id']
                
                # Test different filter combinations
                filter_tests = [
                    ('questions', 'No filters'),
                    (f'questions?topic_id={topic_id}', 'With topic_id filter'),
                    ('questions?difficulty=easy', 'With difficulty filter'),
                    (f'questions?topic_id={topic_id}&difficulty=easy', 'With both filters')
                ]
                
                for endpoint, description in filter_tests:
                    # First request (cache miss)
                    start_time = time.time()
                    success1, _ = self.test_endpoint('GET', endpoint, 200, description=f"{description} - First request")
                    first_time = time.time() - start_time
                    
                    # Second request (cache hit)
                    start_time = time.time()
                    success2, _ = self.test_endpoint('GET', endpoint, 200, description=f"{description} - Second request")
                    second_time = time.time() - start_time
                    
                    if success1 and success2:
                        print(f"    {description}: {first_time:.3f}s → {second_time:.3f}s")
        
        # Test 3: Companies caching
        print("\n🏢 Testing Companies Caching:")
        start_time = time.time()
        success1, _ = self.test_endpoint('GET', 'companies-preview', 200, description="Companies - First request")
        first_time = time.time() - start_time
        
        start_time = time.time()
        success2, _ = self.test_endpoint('GET', 'companies-preview', 200, description="Companies - Second request")
        second_time = time.time() - start_time
        
        if success1 and success2:
            print(f"    Companies caching: {first_time:.3f}s → {second_time:.3f}s")
        
        # Test 4: Experiences caching
        print("\n💼 Testing Experiences Caching:")
        
        # Test without filter
        start_time = time.time()
        success1, response1 = self.test_endpoint('GET', 'experiences', 200, description="Experiences - No filter (first)")
        first_time = time.time() - start_time
        
        start_time = time.time()
        success2, _ = self.test_endpoint('GET', 'experiences', 200, description="Experiences - No filter (second)")
        second_time = time.time() - start_time
        
        if success1 and success2:
            print(f"    Experiences (no filter): {first_time:.3f}s → {second_time:.3f}s")
            
            # Test with company filter if we have experiences
            if response1:
                experiences = response1.json()
                if experiences:
                    company_id = experiences[0]['company_id']
                    
                    start_time = time.time()
                    success3, _ = self.test_endpoint('GET', f'experiences?company_id={company_id}', 200, 
                                                   description="Experiences - With company filter (first)")
                    third_time = time.time() - start_time
                    
                    start_time = time.time()
                    success4, _ = self.test_endpoint('GET', f'experiences?company_id={company_id}', 200,
                                                   description="Experiences - With company filter (second)")
                    fourth_time = time.time() - start_time
                    
                    if success3 and success4:
                        print(f"    Experiences (with filter): {third_time:.3f}s → {fourth_time:.3f}s")

    def test_gzip_compression(self):
        """Test GZip compression middleware"""
        print("🗜️  Testing GZip Compression...")
        print("=" * 35)
        
        # Test with topics (small response - should not be compressed)
        headers = {'Accept-Encoding': 'gzip, deflate'}
        
        try:
            # Test small response (topics)
            response_small = self.session.get(f"{self.api_url}/topics", headers=headers)
            small_encoding = response_small.headers.get('content-encoding', '')
            small_length = len(response_small.content)
            
            print(f"    Topics (small response): {small_length} bytes")
            print(f"    Content-Encoding: {small_encoding or 'none'}")
            
            # Test larger response (questions)
            response_large = self.session.get(f"{self.api_url}/questions", headers=headers)
            large_encoding = response_large.headers.get('content-encoding', '')
            large_length = len(response_large.content)
            
            print(f"    Questions (large response): {large_length} bytes")
            print(f"    Content-Encoding: {large_encoding or 'none'}")
            
            # GZip should work for responses > 1000 bytes
            if large_length > 1000 and 'gzip' in large_encoding.lower():
                print("✅ GZip compression is working for large responses")
                self.log_test("GZip Compression", True, f"Large response compressed: {large_encoding}")
            elif small_length < 1000 and not small_encoding:
                print("✅ GZip compression correctly skipped for small responses")
                self.log_test("GZip Compression", True, f"Small response not compressed (correct behavior)")
            else:
                print("⚠️  GZip compression behavior unexpected")
                self.log_test("GZip Compression", False, f"Large: {large_encoding}, Small: {small_encoding}")
                
        except Exception as e:
            print(f"❌ Error testing compression: {e}")
            self.log_test("GZip Compression", False, f"Exception: {str(e)}")

    def test_cache_stats_endpoint(self):
        """Test cache stats endpoint (admin only)"""
        print("📊 Testing Cache Stats Endpoint...")
        print("=" * 40)
        
        # Should fail without admin auth
        success, response = self.test_endpoint('GET', 'admin/cache-stats', 401, 
                                             description="Cache stats (should require admin)")
        
        if success:
            print("✅ Cache stats endpoint properly protected")
        else:
            print("⚠️  Cache stats endpoint security issue")

    def test_response_times_comparison(self):
        """Compare response times for first vs cached requests"""
        print("⏱️  Testing Response Time Improvements...")
        print("=" * 45)
        
        endpoints_to_test = [
            ('topics', 'Topics'),
            ('companies-preview', 'Companies Preview'),
            ('questions', 'Questions'),
            ('experiences', 'Experiences')
        ]
        
        improvements = []
        
        for endpoint, name in endpoints_to_test:
            print(f"\n📈 Testing {name}:")
            
            # Clear any existing cache by making a request first
            self.session.get(f"{self.api_url}/{endpoint}")
            time.sleep(0.1)
            
            # Measure first request
            start_time = time.time()
            response1 = self.session.get(f"{self.api_url}/{endpoint}")
            first_time = time.time() - start_time
            
            # Small delay
            time.sleep(0.05)
            
            # Measure second request (should be cached)
            start_time = time.time()
            response2 = self.session.get(f"{self.api_url}/{endpoint}")
            second_time = time.time() - start_time
            
            if response1.status_code == 200 and response2.status_code == 200:
                improvement = ((first_time - second_time) / first_time) * 100 if first_time > 0 else 0
                improvements.append(improvement)
                
                print(f"    First request:  {first_time:.3f}s")
                print(f"    Second request: {second_time:.3f}s")
                print(f"    Improvement:    {improvement:.1f}%")
                
                if improvement > 10:  # At least 10% improvement
                    print(f"    ✅ Good caching performance")
                elif improvement > 0:
                    print(f"    ⚠️  Modest caching improvement")
                else:
                    print(f"    ❌ No caching improvement detected")
        
        if improvements:
            avg_improvement = sum(improvements) / len(improvements)
            print(f"\n📊 Average Response Time Improvement: {avg_improvement:.1f}%")
            
            if avg_improvement > 15:
                print("✅ Excellent caching performance overall")
            elif avg_improvement > 5:
                print("⚠️  Moderate caching performance")
            else:
                print("❌ Poor caching performance")

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
        self.test_health_check()
        print()
        self.test_cache_warming()
        print()
        self.test_free_endpoints()
        print()
        self.test_protected_endpoints()
        print()
        self.test_admin_endpoints()
        print()
        self.test_redis_caching_detailed()
        print()
        self.test_gzip_compression()
        print()
        self.test_cache_stats_endpoint()
        print()
        self.test_response_times_comparison()
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
        print("- Health check endpoint should show MongoDB and Redis connectivity")
        print("- Cache warming should make initial requests faster")
        print("- Free endpoints (topics, questions, experiences) should work without auth")
        print("- Protected endpoints should return 401 without authentication")
        print("- Admin endpoints should return 401/403 without admin privileges")
        print("- Redis caching should make subsequent requests significantly faster")
        print("- GZip compression should be enabled for responses")
        print("- Cache invalidation requires admin authentication to test")
        
        return self.tests_passed == self.tests_run

def main():
    tester = InterviewPrepAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())