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
            expected_fields = ['club_name', 'description', 'instagram_url', 'facebook_url']
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
        
        # Test updating settings
        settings_data = {
            "club_name": "Racing San Gabriel ADC - Updated",
            "description": "Updated description for testing"
        }
        success, _ = self.run_test("Update Settings", "PUT", "settings", 200, settings_data)
        
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