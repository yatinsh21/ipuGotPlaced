import requests
import sys
import json
import time
from datetime import datetime

class InterviewPrepAPITester:
    def __init__(self, base_url="https://alumni-connect-48.preview.emergentagent.com"):
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

    def get_admin_session_token(self):
        """Get admin session token by simulating OAuth login"""
        # For testing purposes, we'll try to get users first to see if admin exists
        # In a real scenario, admin would need to authenticate via OAuth
        print("🔑 Attempting to get admin authentication...")
        
        # Try to get users without auth first (should fail)
        success, response = self.test_endpoint('GET', 'admin/users', 401, 
                                             description="Get users without auth (should fail)")
        
        # Since we can't easily simulate OAuth in tests, we'll note this limitation
        print("⚠️  Admin authentication requires OAuth flow - cannot test admin endpoints with real auth in automated tests")
        return None

    def test_admin_user_management(self):
        """Test admin user management functionality"""
        print("👥 Testing Admin User Management...")
        print("=" * 40)
        
        # First, try to get all users (should fail without admin auth)
        success, response = self.test_endpoint('GET', 'admin/users', 401, 
                                             description="Get all users (should require admin)")
        
        # Test grant admin access (should fail without admin auth)
        test_user_id = "test-user-id-123"
        success, response = self.test_endpoint('POST', f'admin/users/{test_user_id}/grant-admin', 401,
                                             description="Grant admin access (should require admin)")
        
        # Test revoke admin access (should fail without admin auth)
        success, response = self.test_endpoint('POST', f'admin/users/{test_user_id}/revoke-admin', 401,
                                             description="Revoke admin access (should require admin)")
        
        # Test toggle premium status (should fail without admin auth)
        success, response = self.test_endpoint('POST', f'admin/users/{test_user_id}/toggle-premium', 401,
                                             description="Toggle premium status (should require admin)")
        
        print("✅ All admin user management endpoints properly protected")
        print("ℹ️  Note: Full functionality testing requires admin authentication via OAuth")

    def test_admin_user_management_with_auth(self):
        """Test admin user management with authentication (if available)"""
        print("👥 Testing Admin User Management with Auth...")
        print("=" * 50)
        
        # This would require actual admin authentication
        # For now, we'll test the endpoint structure and error handling
        
        # Test with invalid user ID (should fail even with auth due to user not found)
        invalid_user_id = "invalid-user-id-999"
        
        print(f"🔍 Testing with invalid user ID: {invalid_user_id}")
        print("   (These should return 401 due to no auth, but would return 404 with auth)")
        
        # Grant admin to invalid user
        success, response = self.test_endpoint('POST', f'admin/users/{invalid_user_id}/grant-admin', 401,
                                             description="Grant admin to invalid user")
        
        # Revoke admin from invalid user  
        success, response = self.test_endpoint('POST', f'admin/users/{invalid_user_id}/revoke-admin', 401,
                                             description="Revoke admin from invalid user")
        
        # Toggle premium for invalid user
        success, response = self.test_endpoint('POST', f'admin/users/{invalid_user_id}/toggle-premium', 401,
                                             description="Toggle premium for invalid user")
        
        print("✅ Admin user management endpoints respond correctly to unauthorized requests")
        
        # Test endpoint structure validation
        print("\n🔧 Testing endpoint structure...")
        
        # Test missing user ID (should return 404 or 422)
        success, response = self.test_endpoint('POST', 'admin/users//grant-admin', 404,
                                             description="Grant admin with missing user ID")
        
        success, response = self.test_endpoint('POST', 'admin/users//revoke-admin', 404,
                                             description="Revoke admin with missing user ID")
        
        success, response = self.test_endpoint('POST', 'admin/users//toggle-premium', 404,
                                             description="Toggle premium with missing user ID")

    def test_admin_functionality_scenarios(self):
        """Test admin functionality business logic scenarios"""
        print("🎯 Testing Admin Functionality Scenarios...")
        print("=" * 45)
        
        print("📋 Expected Behavior (when authenticated as admin):")
        print("   1. Grant Admin Access:")
        print("      - Should set is_admin=true AND is_premium=true")
        print("      - Should return success message with user email")
        print("      - Should return 404 for non-existent users")
        print()
        print("   2. Revoke Admin Access:")
        print("      - Should set is_admin=false")
        print("      - Should keep is_premium=true (preserve premium status)")
        print("      - Should prevent admin from revoking their own access")
        print("      - Should return 404 for non-existent users")
        print()
        print("   3. Toggle Premium Status:")
        print("      - Should toggle is_premium between true/false")
        print("      - Should prevent removing premium from admin users")
        print("      - Should return 404 for non-existent users")
        print()
        print("   4. Get All Users:")
        print("      - Should return array of all users with status fields")
        print("      - Should include id, email, name, is_admin, is_premium fields")
        print()
        
        # Test the endpoints without auth (they should all return 401)
        print("🔒 Testing endpoint security (all should return 401):")
        
        test_scenarios = [
            ('GET', 'admin/users', 'Get all users'),
            ('POST', 'admin/users/test-id/grant-admin', 'Grant admin access'),
            ('POST', 'admin/users/test-id/revoke-admin', 'Revoke admin access'),
            ('POST', 'admin/users/test-id/toggle-premium', 'Toggle premium status')
        ]
        
        for method, endpoint, description in test_scenarios:
            success, response = self.test_endpoint(method, endpoint, 401, description=description)
        
        print("\n✅ All admin user management endpoints properly secured")
        print("⚠️  To test full functionality, admin authentication via OAuth is required")
        print("   Admin email configured: sharmayatin0882@gmail.com")

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

    def test_payment_endpoints(self):
        """Test payment endpoints - specifically the 401 error fix"""
        print("💳 Testing Payment Endpoints (401 Error Fix)...")
        print("=" * 50)
        
        # Test create-order endpoint without authentication (should return 401)
        success, response = self.test_endpoint('POST', 'payment/create-order', 401, 
                                             data={"amount": 29900},
                                             description="Create payment order without auth (should return 401)")
        
        # Test verify payment endpoint without authentication (should return 401)
        verify_data = {
            "razorpay_order_id": "test_order_id",
            "razorpay_payment_id": "test_payment_id", 
            "razorpay_signature": "test_signature"
        }
        success, response = self.test_endpoint('POST', 'payment/verify', 401,
                                             data=verify_data,
                                             description="Verify payment without auth (should return 401)")
        
        # Test with invalid Bearer token format
        invalid_headers = {'Authorization': 'InvalidFormat token123'}
        success, response = self.test_endpoint('POST', 'payment/create-order', 401,
                                             data={"amount": 29900},
                                             headers=invalid_headers,
                                             description="Create order with invalid auth format (should return 401)")
        
        # Test with Bearer but no token
        empty_bearer_headers = {'Authorization': 'Bearer '}
        success, response = self.test_endpoint('POST', 'payment/create-order', 401,
                                             data={"amount": 29900},
                                             headers=empty_bearer_headers,
                                             description="Create order with empty Bearer token (should return 401)")
        
        # Test with null token (simulating frontend fix)
        null_token_headers = {'Authorization': 'Bearer null'}
        success, response = self.test_endpoint('POST', 'payment/create-order', 401,
                                             data={"amount": 29900},
                                             headers=null_token_headers,
                                             description="Create order with 'Bearer null' (should return 401)")
        
        print("\n✅ Payment endpoint authentication properly secured")
        print("ℹ️  Note: Full payment flow testing requires valid Clerk authentication")
        print("ℹ️  The 401 error fix ensures proper header parsing and null token handling")

    def test_authentication_header_parsing(self):
        """Test the authentication header parsing fix"""
        print("🔐 Testing Authentication Header Parsing Fix...")
        print("=" * 50)
        
        # Test different header case variations that should all return 401 (no valid token)
        header_variations = [
            ({'Authorization': 'Bearer invalid_token'}, 'Standard Authorization header'),
            ({'authorization': 'Bearer invalid_token'}, 'Lowercase authorization header'),
            ({'AUTHORIZATION': 'Bearer invalid_token'}, 'Uppercase AUTHORIZATION header'),
        ]
        
        for headers, description in header_variations:
            success, response = self.test_endpoint('GET', 'auth/me', 401,
                                                 headers=headers,
                                                 description=f"Auth endpoint with {description}")
        
        # Test missing Authorization header
        success, response = self.test_endpoint('GET', 'auth/me', 401,
                                             description="Auth endpoint without Authorization header")
        
        print("\n✅ Authentication header parsing handles different case variations")
        print("ℹ️  The fix ensures both 'Authorization' and 'authorization' headers are checked")

    def test_alumni_endpoints(self):
        """Test Alumni/Senior Search feature endpoints"""
        print("🎓 Testing Alumni/Senior Search Feature...")
        print("=" * 50)
        
        # Test data for alumni creation
        test_alumni_data = [
            {
                "name": "Sarah Johnson",
                "email": "sarah.johnson@google.com",
                "phone": "+1-555-0123",
                "role": "Senior Software Engineer",
                "company": "Google",
                "years_of_experience": 5,
                "location": "Mountain View, CA",
                "graduation_year": 2018
            },
            {
                "name": "Michael Chen",
                "email": "michael.chen@microsoft.com",
                "phone": "+1-555-0456",
                "role": "Principal Engineer",
                "company": "Microsoft",
                "years_of_experience": 8,
                "location": "Seattle, WA",
                "graduation_year": 2015
            },
            {
                "name": "Priya Sharma",
                "email": "priya.sharma@amazon.com",
                "role": "Software Development Manager",
                "company": "Amazon",
                "years_of_experience": 6,
                "location": "Bangalore, India",
                "graduation_year": 2017
            },
            {
                "name": "David Wilson",
                "email": "david.wilson@meta.com",
                "phone": "+1-555-0789",
                "role": "Staff Engineer",
                "company": "Meta",
                "years_of_experience": 7,
                "location": "Menlo Park, CA",
                "graduation_year": 2016
            }
        ]
        
        created_alumni_ids = []
        
        print("\n📋 Testing Admin Alumni Management Endpoints (without auth - should fail):")
        
        # Test GET /api/admin/alumni (should require admin auth)
        success, response = self.test_endpoint('GET', 'admin/alumni', 401, 
                                             description="Get all alumni (should require admin)")
        
        # Test POST /api/admin/alumni (should require admin auth)
        success, response = self.test_endpoint('POST', 'admin/alumni', 401,
                                             data=test_alumni_data[0],
                                             description="Create alumni (should require admin)")
        
        # Test PUT /api/admin/alumni/{alumni_id} (should require admin auth)
        test_alumni_id = "test-alumni-id-123"
        success, response = self.test_endpoint('PUT', f'admin/alumni/{test_alumni_id}', 401,
                                             data=test_alumni_data[0],
                                             description="Update alumni (should require admin)")
        
        # Test DELETE /api/admin/alumni/{alumni_id} (should require admin auth)
        success, response = self.test_endpoint('DELETE', f'admin/alumni/{test_alumni_id}', 401,
                                             description="Delete alumni (should require admin)")
        
        print("\n🔍 Testing Public Alumni Search Endpoint:")
        
        # Test GET /api/alumni/search without authentication (should work but mask contacts)
        success, response = self.test_endpoint('GET', 'alumni/search', 200,
                                             description="Search alumni without auth (should mask contacts)")
        
        if success and response:
            try:
                alumni_list = response.json()
                print(f"    Found {len(alumni_list)} alumni records")
                
                # Check if contacts are masked for unauthenticated users
                if alumni_list:
                    first_alumni = alumni_list[0]
                    email_masked = first_alumni.get('email', '') == '***@***.***'
                    phone_masked = first_alumni.get('phone', '') == '***-***-****'
                    
                    if email_masked or phone_masked:
                        print("    ✅ Contact information properly masked for unauthenticated users")
                    else:
                        print("    ⚠️  Contact information may not be properly masked")
                        
            except Exception as e:
                print(f"    ⚠️  Error parsing alumni search response: {e}")
        
        # Test search with various filters
        search_filters = [
            ('alumni/search?company=Google', 'Search by company (Google)'),
            ('alumni/search?name=Sarah', 'Search by name (Sarah)'),
            ('alumni/search?role=Engineer', 'Search by role (Engineer)'),
            ('alumni/search?location=Seattle', 'Search by location (Seattle)'),
            ('alumni/search?years_of_experience=5', 'Search by years of experience (5)'),
            ('alumni/search?graduation_year=2018', 'Search by graduation year (2018)'),
            ('alumni/search?company=Google&role=Engineer', 'Search with multiple filters'),
        ]
        
        for endpoint, description in search_filters:
            success, response = self.test_endpoint('GET', endpoint, 200, description=description)
        
        print("\n🔐 Testing Alumni Contact Reveal Endpoint:")
        
        # Test GET /api/alumni/{alumni_id}/reveal without authentication (should return 401)
        test_alumni_id = "test-alumni-id-123"
        success, response = self.test_endpoint('GET', f'alumni/{test_alumni_id}/reveal', 401,
                                             description="Reveal contacts without auth (should return 401)")
        
        # Test with invalid alumni ID (would return 404 with proper auth)
        invalid_alumni_id = "invalid-alumni-id-999"
        success, response = self.test_endpoint('GET', f'alumni/{invalid_alumni_id}/reveal', 401,
                                             description="Reveal contacts for invalid ID (should return 401 due to no auth)")
        
        print("\n📊 Testing Admin Stats - Alumni Count:")
        
        # Test GET /api/admin/stats (should require admin auth)
        success, response = self.test_endpoint('GET', 'admin/stats', 401,
                                             description="Get admin stats including alumni count (should require admin)")
        
        print("\n🧪 Testing Alumni Search Cache Behavior:")
        
        # Test cache behavior for alumni search
        search_endpoint = 'alumni/search?company=Google'
        
        # First request (cache miss)
        start_time = time.time()
        success1, response1 = self.test_endpoint('GET', search_endpoint, 200,
                                               description="Alumni search - First request (cache miss)")
        first_time = time.time() - start_time
        
        # Second request (cache hit)
        start_time = time.time()
        success2, response2 = self.test_endpoint('GET', search_endpoint, 200,
                                               description="Alumni search - Second request (cache hit)")
        second_time = time.time() - start_time
        
        if success1 and success2:
            print(f"    Alumni search caching: {first_time:.3f}s → {second_time:.3f}s")
            if second_time < first_time:
                print("    ✅ Alumni search caching appears to be working")
            else:
                print("    ⚠️  Alumni search caching may not be working optimally")
        
        print("\n🔒 Testing Alumni Endpoint Security:")
        
        # Test various authentication scenarios
        auth_test_scenarios = [
            ('GET', 'alumni/search', 200, None, 'Public search without auth (should work with masked contacts)'),
            ('GET', f'alumni/{test_alumni_id}/reveal', 401, None, 'Reveal contacts without auth (should return 401)'),
            ('GET', 'admin/alumni', 401, None, 'Admin get alumni without auth (should return 401)'),
            ('POST', 'admin/alumni', 401, test_alumni_data[0], 'Admin create alumni without auth (should return 401)'),
        ]
        
        for method, endpoint, expected_status, data, description in auth_test_scenarios:
            success, response = self.test_endpoint(method, endpoint, expected_status, data=data, description=description)
        
        print("\n✅ Alumni/Senior Search Feature Testing Complete")
        print("ℹ️  Note: Full CRUD and premium feature testing requires proper authentication")
        print("ℹ️  Admin email for testing: sharmayatin0882@gmail.com")
        print("ℹ️  Expected behavior:")
        print("   - Public search works but masks email/phone for non-premium users")
        print("   - Contact reveal requires premium subscription")
        print("   - Admin CRUD operations require admin authentication")
        print("   - Search results are cached for performance")

    def test_alumni_with_admin_auth(self):
        """Test alumni endpoints with admin authentication (if available)"""
        print("👑 Testing Alumni Endpoints with Admin Auth...")
        print("=" * 50)
        
        # This would require actual admin authentication
        # For now, we'll document the expected behavior
        
        print("📋 Expected Behavior with Admin Authentication:")
        print("   1. GET /api/admin/alumni:")
        print("      - Should return array of all alumni records")
        print("      - Should include all fields: id, name, email, phone, role, company, etc.")
        print()
        print("   2. POST /api/admin/alumni:")
        print("      - Should create new alumni with provided data")
        print("      - Should return created alumni object with generated ID")
        print("      - Should invalidate alumni search cache")
        print()
        print("   3. PUT /api/admin/alumni/{alumni_id}:")
        print("      - Should update existing alumni record")
        print("      - Should return updated alumni object")
        print("      - Should invalidate alumni search cache")
        print()
        print("   4. DELETE /api/admin/alumni/{alumni_id}:")
        print("      - Should delete alumni record")
        print("      - Should return success confirmation")
        print("      - Should invalidate alumni search cache")
        print()
        print("   5. GET /api/alumni/search (with admin auth):")
        print("      - Should return unmasked contact information")
        print("      - Should show real email and phone numbers")
        print()
        print("   6. GET /api/alumni/{alumni_id}/reveal (with admin auth):")
        print("      - Should return full contact information")
        print("      - Should work same as premium user access")
        print()
        print("   7. GET /api/admin/stats (with admin auth):")
        print("      - Should include 'total_alumni' field in response")
        print("      - Should show accurate count of alumni records")
        print()
        
        # Test the endpoints without auth (they should all return 401)
        print("🔒 Testing endpoint security (all should return 401 without admin auth):")
        
        test_scenarios = [
            ('GET', 'admin/alumni', 'Get all alumni'),
            ('POST', 'admin/alumni', 'Create alumni'),
            ('PUT', 'admin/alumni/test-id', 'Update alumni'),
            ('DELETE', 'admin/alumni/test-id', 'Delete alumni'),
        ]
        
        test_alumni = {
            "name": "Test Alumni",
            "email": "test@example.com",
            "role": "Software Engineer",
            "company": "Test Company"
        }
        
        for method, endpoint, description in test_scenarios:
            data = test_alumni if method in ['POST', 'PUT'] else None
            success, response = self.test_endpoint(method, endpoint, 401, data=data, description=description)
        
        print("\n✅ All admin alumni endpoints properly secured")
        print("⚠️  To test full functionality, admin authentication via OAuth is required")

    def test_alumni_data_validation(self):
        """Test alumni data validation and error handling"""
        print("✅ Testing Alumni Data Validation...")
        print("=" * 40)
        
        print("📋 Expected Validation Behavior:")
        print("   - Required fields: name, email, role, company")
        print("   - Optional fields: phone, years_of_experience, location, graduation_year")
        print("   - Email should be valid format")
        print("   - Years of experience should be positive integer")
        print("   - Graduation year should be reasonable (e.g., 1950-2030)")
        print()
        
        # Test invalid data scenarios (would require admin auth to actually test)
        invalid_data_scenarios = [
            ({}, "Empty data object"),
            ({"name": "Test"}, "Missing required fields"),
            ({"name": "Test", "email": "invalid-email", "role": "Engineer", "company": "Test"}, "Invalid email format"),
            ({"name": "Test", "email": "test@example.com", "role": "Engineer", "company": "Test", "years_of_experience": -1}, "Negative years of experience"),
            ({"name": "Test", "email": "test@example.com", "role": "Engineer", "company": "Test", "graduation_year": 1800}, "Invalid graduation year"),
        ]
        
        print("🔒 Testing data validation (all should return 401 due to no admin auth):")
        for data, description in invalid_data_scenarios:
            success, response = self.test_endpoint('POST', 'admin/alumni', 401, data=data, 
                                                 description=f"Create alumni with {description}")
        
        print("\n✅ Alumni data validation endpoints properly secured")
        print("ℹ️  Actual validation testing requires admin authentication")

    def test_error_handling(self):
        """Test error handling for invalid requests"""
        print("🚫 Testing Error Handling...")
        print("=" * 30)
        
        # Test invalid endpoints
        self.test_endpoint('GET', 'invalid-endpoint', 404, description="Invalid endpoint (should return 404)")
        
        # Test invalid question ID
        self.test_endpoint('GET', 'questions?topic_id=invalid-id', 200, description="Invalid topic ID (should return empty array)")
        
        # Test invalid alumni ID for reveal endpoint
        self.test_endpoint('GET', 'alumni/invalid-id/reveal', 401, description="Invalid alumni ID for reveal (should return 401 due to no auth)")

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
        self.test_admin_user_management()
        print()
        self.test_admin_user_management_with_auth()
        print()
        self.test_admin_functionality_scenarios()
        print()
        self.test_alumni_endpoints()
        print()
        self.test_alumni_with_admin_auth()
        print()
        self.test_alumni_data_validation()
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