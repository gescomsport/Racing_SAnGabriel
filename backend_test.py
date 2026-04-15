#!/usr/bin/env python3
"""
Comprehensive backend API testing for Racing San Gabriel ADC website
Tests all CRUD operations, authentication, and data persistence
"""

import requests
import sys
import json
from datetime import datetime

class RacingSanGabrielAPITester:
    def __init__(self, base_url="https://sg-racing-portal.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.session = requests.Session()

    def log_result(self, test_name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name}")
        else:
            print(f"❌ {test_name} - {details}")
            self.failed_tests.append({"test": test_name, "error": details})

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            details = f"Expected {expected_status}, got {response.status_code}"
            if not success and response.text:
                try:
                    error_data = response.json()
                    details += f" - {error_data.get('detail', response.text[:100])}"
                except:
                    details += f" - {response.text[:100]}"

            self.log_result(name, success, details if not success else "")
            
            if success:
                try:
                    return True, response.json()
                except:
                    return True, {}
            return False, {}

        except Exception as e:
            self.log_result(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health endpoint"""
        print("\n🔍 Testing Health Check...")
        success, _ = self.run_test("Health Check", "GET", "health", 200)
        return success

    def test_public_endpoints(self):
        """Test all public endpoints that don't require auth"""
        print("\n🔍 Testing Public Endpoints...")
        
        # Test settings
        success, settings = self.run_test("GET Settings", "GET", "settings", 200)
        if success and settings:
            expected_fields = ['club_name', 'description', 'instagram_url', 'facebook_url', 
                             'facebook_embed_enabled', 'facebook_page_url', 'instagram_embed_code', 'custom_embed_code']
            for field in expected_fields:
                if field in settings:
                    self.log_result(f"Settings has {field}", True)
                else:
                    self.log_result(f"Settings missing {field}", False, f"Field {field} not found")

        # Test news
        success, news = self.run_test("GET News", "GET", "news", 200)
        if success:
            self.log_result(f"News count: {len(news)}", len(news) >= 3, f"Expected ≥3, got {len(news)}")

        # Test teams
        success, teams = self.run_test("GET Teams", "GET", "teams", 200)
        if success:
            self.log_result(f"Teams count: {len(teams)}", len(teams) >= 3, f"Expected ≥3, got {len(teams)}")

        # Test matches
        success, matches = self.run_test("GET Matches", "GET", "matches", 200)
        if success:
            self.log_result(f"Matches count: {len(matches)}", len(matches) >= 3, f"Expected ≥3, got {len(matches)}")

        # Test gallery
        success, gallery = self.run_test("GET Gallery", "GET", "gallery", 200)
        if success:
            self.log_result(f"Gallery count: {len(gallery)}", len(gallery) >= 3, f"Expected ≥3, got {len(gallery)}")

        # Test contact submission (public)
        contact_data = {
            "name": "Test User",
            "email": "test@example.com",
            "phone": "+34 600 000 000",
            "message": "Test message from automated testing",
            "subject": "testing"
        }
        success, _ = self.run_test("POST Contact", "POST", "contact", 200, contact_data)

    def test_social_posts_endpoints(self):
        """Test social posts endpoints"""
        print("\n🔍 Testing Social Posts Endpoints...")
        
        # Test GET all social posts
        success, posts = self.run_test("GET Social Posts", "GET", "social-posts", 200)
        if success:
            self.log_result(f"Social posts count: {len(posts)}", len(posts) >= 0, f"Got {len(posts)} posts")
            
            # Check if posts have required fields
            if posts:
                post = posts[0]
                required_fields = ['id', 'source', 'content', 'posted_at', 'received_at']
                for field in required_fields:
                    if field in post:
                        self.log_result(f"Social post has {field}", True)
                    else:
                        self.log_result(f"Social post missing {field}", False, f"Field {field} not found")

        # Test GET Instagram posts with limit
        success, ig_posts = self.run_test("GET Instagram Posts", "GET", "social-posts?source=instagram&limit=4", 200)
        if success:
            self.log_result(f"Instagram posts limit works", len(ig_posts) <= 4, f"Expected ≤4, got {len(ig_posts)}")
            # Check all posts are Instagram
            if ig_posts:
                all_instagram = all(post.get('source') == 'instagram' for post in ig_posts)
                self.log_result("All posts are Instagram", all_instagram, "Some posts are not Instagram")

        # Test GET Facebook posts with limit
        success, fb_posts = self.run_test("GET Facebook Posts", "GET", "social-posts?source=facebook&limit=4", 200)
        if success:
            self.log_result(f"Facebook posts limit works", len(fb_posts) <= 4, f"Expected ≤4, got {len(fb_posts)}")
            # Check all posts are Facebook
            if fb_posts:
                all_facebook = all(post.get('source') == 'facebook' for post in fb_posts)
                self.log_result("All posts are Facebook", all_facebook, "Some posts are not Facebook")

    def test_webhook_endpoint(self):
        """Test webhook endpoint for social posts"""
        print("\n🔍 Testing Webhook Endpoint...")
        
        # Test webhook with correct API key
        webhook_data = {
            "source": "instagram",
            "content": "Test post from automated testing",
            "image_url": "https://example.com/test.jpg",
            "post_url": "https://www.instagram.com/p/test123/",
            "author": "@racingsangabrieladc",
            "timestamp": datetime.now().isoformat(),
            "api_key": "rsg-webhook-2025-secret"
        }
        success, response = self.run_test("Webhook with correct API key", "POST", "webhook/social-post", 200, webhook_data)
        if success:
            self.log_result("Webhook returns post ID", 'id' in response, "No ID in response")
            webhook_post_id = response.get('id')
        
        # Test webhook with wrong API key
        wrong_webhook_data = webhook_data.copy()
        wrong_webhook_data["api_key"] = "wrong-key"
        success, _ = self.run_test("Webhook with wrong API key", "POST", "webhook/social-post", 403, wrong_webhook_data)
        
        # Test webhook without API key
        no_key_webhook_data = webhook_data.copy()
        del no_key_webhook_data["api_key"]
        success, _ = self.run_test("Webhook without API key", "POST", "webhook/social-post", 403, no_key_webhook_data)
        
        # Test webhook with Facebook source
        fb_webhook_data = {
            "source": "facebook",
            "content": "Test Facebook post from automated testing",
            "image_url": "https://example.com/fb-test.jpg",
            "post_url": "https://www.facebook.com/RacingSanGabrielADC/posts/test123",
            "author": "Racing San Gabriel ADC",
            "timestamp": datetime.now().isoformat(),
            "api_key": "rsg-webhook-2025-secret"
        }
        success, fb_response = self.run_test("Facebook webhook", "POST", "webhook/social-post", 200, fb_webhook_data)
        if success:
            fb_post_id = fb_response.get('id')
        
        # Verify posts were created by fetching them
        success, all_posts = self.run_test("Verify webhook posts created", "GET", "social-posts", 200)
        if success and webhook_post_id:
            created_post = next((p for p in all_posts if p.get('id') == webhook_post_id), None)
            if created_post:
                self.log_result("Webhook post found in database", True)
                # Verify post data
                if created_post.get('content') == webhook_data['content']:
                    self.log_result("Webhook post content correct", True)
                else:
                    self.log_result("Webhook post content incorrect", False, 
                                  f"Expected '{webhook_data['content']}', got '{created_post.get('content')}'")
            else:
                self.log_result("Webhook post found in database", False, "Post not found")
        
        return True

    def test_authentication(self):
        """Test authentication endpoints"""
        print("\n🔍 Testing Authentication...")
        
        # Test login with correct credentials
        login_data = {
            "email": "admin@racingsangabriel.es",
            "password": "Racing2025!"
        }
        success, response = self.run_test("Admin Login", "POST", "auth/login", 200, login_data)
        
        if success and 'token' in response:
            self.token = response['token']
            self.log_result("Token received", True)
            
            # Verify token fields
            expected_fields = ['id', 'email', 'name', 'role', 'token']
            for field in expected_fields:
                if field in response:
                    self.log_result(f"Login response has {field}", True)
                else:
                    self.log_result(f"Login response missing {field}", False)
        else:
            self.log_result("Token received", False, "No token in response")
            return False

        # Test /auth/me with token
        success, user_data = self.run_test("GET Auth Me", "GET", "auth/me", 200)
        if success:
            self.log_result("Auth me works with token", True)
        
        # Test login with wrong credentials
        wrong_login = {
            "email": "admin@racingsangabriel.es", 
            "password": "wrongpassword"
        }
        success, _ = self.run_test("Wrong Password Login", "POST", "auth/login", 401, wrong_login)
        
        return True

    def test_protected_endpoints(self):
        """Test endpoints that require authentication"""
        if not self.token:
            print("❌ Skipping protected endpoint tests - no auth token")
            return False
            
        print("\n🔍 Testing Protected Endpoints...")
        
        # Test creating news
        news_data = {
            "title": "Test News Article",
            "content": "This is a test news article created by automated testing.",
            "image_url": "https://example.com/test.jpg",
            "source": "web",
            "category": "general"
        }
        success, created_news = self.run_test("Create News", "POST", "news", 200, news_data)
        news_id = created_news.get('id') if success else None
        
        # Test creating team
        team_data = {
            "name": "Test Team",
            "category": "Test Category",
            "coach": "Test Coach",
            "image_url": "https://example.com/team.jpg",
            "description": "Test team description"
        }
        success, created_team = self.run_test("Create Team", "POST", "teams", 200, team_data)
        team_id = created_team.get('id') if success else None
        
        # Test creating match
        match_data = {
            "home_team": "Racing San Gabriel",
            "away_team": "Test Opponent",
            "date": "2025-03-15",
            "time": "15:00",
            "location": "Test Stadium",
            "category": "Test",
            "result": "",
            "status": "upcoming"
        }
        success, created_match = self.run_test("Create Match", "POST", "matches", 200, match_data)
        match_id = created_match.get('id') if success else None
        
        # Test creating gallery item
        gallery_data = {
            "title": "Test Gallery Item",
            "image_url": "https://example.com/gallery.jpg",
            "description": "Test gallery description",
            "category": "test"
        }
        success, created_gallery = self.run_test("Create Gallery", "POST", "gallery", 200, gallery_data)
        gallery_id = created_gallery.get('id') if success else None
        
        # Test getting contacts (admin only)
        success, contacts = self.run_test("GET Contacts", "GET", "contact", 200)
        if success:
            self.log_result(f"Contacts retrieved: {len(contacts)}", True)
        
        # Test updating settings (including social media fields)
        settings_data = {
            "club_name": "Racing San Gabriel ADC - Updated",
            "description": "Updated description for testing",
            "facebook_embed_enabled": True,
            "facebook_page_url": "https://www.facebook.com/TestPage/",
            "instagram_embed_code": "<div>Test Instagram Embed</div>",
            "custom_embed_code": "<div>Test Custom Embed</div>"
        }
        success, updated_settings = self.run_test("Update Settings", "PUT", "settings", 200, settings_data)
        
        # Verify social media fields were saved
        if success and updated_settings:
            social_fields = ['facebook_embed_enabled', 'facebook_page_url', 'instagram_embed_code', 'custom_embed_code']
            for field in social_fields:
                if field in updated_settings and updated_settings[field] == settings_data[field]:
                    self.log_result(f"Social media field {field} saved correctly", True)
                else:
                    self.log_result(f"Social media field {field} not saved correctly", False, 
                                  f"Expected {settings_data[field]}, got {updated_settings.get(field)}")
        
        # Test deletion endpoints
        if news_id:
            success, _ = self.run_test("Delete News", "DELETE", f"news/{news_id}", 200)
        if team_id:
            success, _ = self.run_test("Delete Team", "DELETE", f"teams/{team_id}", 200)
        if match_id:
            success, _ = self.run_test("Delete Match", "DELETE", f"matches/{match_id}", 200)
        if gallery_id:
            success, _ = self.run_test("Delete Gallery", "DELETE", f"gallery/{gallery_id}", 200)
        
        # Test logout
        success, _ = self.run_test("Logout", "POST", "auth/logout", 200)
        
        return True

    def test_unauthorized_access(self):
        """Test that protected endpoints reject unauthorized requests"""
        print("\n🔍 Testing Unauthorized Access...")
        
        # Clear token
        old_token = self.token
        self.token = None
        
        # These should all return 401
        protected_endpoints = [
            ("POST", "news", {"title": "test", "content": "test"}),
            ("POST", "teams", {"name": "test", "category": "test"}),
            ("POST", "matches", {"home_team": "test", "away_team": "test", "date": "2025-01-01", "time": "10:00", "location": "test"}),
            ("POST", "gallery", {"title": "test", "image_url": "test"}),
            ("GET", "contact", None),
            ("PUT", "settings", {"club_name": "test"}),
        ]
        
        for method, endpoint, data in protected_endpoints:
            success, _ = self.run_test(f"Unauthorized {method} {endpoint}", method, endpoint, 401, data)
        
        # Restore token
        self.token = old_token

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Racing San Gabriel ADC API Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        # Run test suites
        self.test_health_check()
        self.test_public_endpoints()
        self.test_social_posts_endpoints()
        self.test_webhook_endpoint()
        
        if self.test_authentication():
            self.test_protected_endpoints()
            self.test_unauthorized_access()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for failure in self.failed_tests:
                print(f"  - {failure['test']}: {failure['error']}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = RacingSanGabrielAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())