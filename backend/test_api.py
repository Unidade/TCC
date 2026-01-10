#!/usr/bin/env python3
"""
Simple API Test Script for TCC Interview Simulator Backend

Usage:
    python test_api.py [--base-url URL]

By default, connects to http://localhost:8000
"""

import requests
import argparse
import sys
from typing import Optional

# ANSI color codes for pretty output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'


def print_header(text: str):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")


def print_success(text: str):
    print(f"{Colors.GREEN}✓ {text}{Colors.END}")


def print_error(text: str):
    print(f"{Colors.RED}✗ {text}{Colors.END}")


def print_info(text: str):
    print(f"{Colors.YELLOW}→ {text}{Colors.END}")


class APITester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.tests_passed = 0
        self.tests_failed = 0

    def test_endpoint(self, method: str, endpoint: str, 
                       expected_status: int = 200,
                       json_data: Optional[dict] = None,
                       headers: Optional[dict] = None,
                       description: str = "") -> Optional[dict]:
        """Test a single endpoint and return response data if successful"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers, timeout=30)
            elif method.upper() == "POST":
                response = self.session.post(url, json=json_data, headers=headers, timeout=30)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=json_data, headers=headers, timeout=30)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers, timeout=30)
            else:
                print_error(f"Unknown method: {method}")
                return None

            if response.status_code == expected_status:
                print_success(f"{method} {endpoint} - {description}")
                self.tests_passed += 1
                try:
                    return response.json() if response.text else {}
                except:
                    return {"raw": response.text}
            else:
                print_error(f"{method} {endpoint} - Expected {expected_status}, got {response.status_code}")
                print_info(f"Response: {response.text[:200]}")
                self.tests_failed += 1
                return None
                
        except requests.exceptions.ConnectionError:
            print_error(f"{method} {endpoint} - Connection refused. Is the server running?")
            self.tests_failed += 1
            return None
        except requests.exceptions.Timeout:
            print_error(f"{method} {endpoint} - Request timed out")
            self.tests_failed += 1
            return None
        except Exception as e:
            print_error(f"{method} {endpoint} - Error: {str(e)}")
            self.tests_failed += 1
            return None

    def run_all_tests(self):
        """Run all API tests"""
        
        # ==========================================
        print_header("1. Basic Health Checks")
        # ==========================================
        
        self.test_endpoint("GET", "/", description="Root endpoint")
        self.test_endpoint("GET", "/health", description="Health check")
        
        # ==========================================
        print_header("2. Personas CRUD API")
        # ==========================================
        
        # List all personas
        personas_response = self.test_endpoint("GET", "/api/personas/", description="List all personas")
        
        # Create a new test persona
        test_persona = {
            "name": "Test Persona",
            "description": "A test persona for API testing",
            "system_prompt": "You are a helpful test assistant.",
            "initial_message": "Olá! Sou uma persona de teste."
        }
        created_persona = self.test_endpoint(
            "POST", "/api/personas/",
            json_data=test_persona,
            expected_status=201,
            description="Create test persona"
        )
        
        if created_persona:
            persona_id = created_persona.get("id")
            print_info(f"Created persona with ID: {persona_id}")
            
            # Get the created persona
            self.test_endpoint(
                "GET", f"/api/personas/{persona_id}",
                description=f"Get persona {persona_id}"
            )
            
            # Update the persona
            update_data = {"name": "Updated Test Persona"}
            self.test_endpoint(
                "PUT", f"/api/personas/{persona_id}",
                json_data=update_data,
                description=f"Update persona {persona_id}"
            )
            
            # Delete the test persona
            self.test_endpoint(
                "DELETE", f"/api/personas/{persona_id}",
                expected_status=204,
                description=f"Delete persona {persona_id}"
            )
        
        # Test 404 for non-existent persona
        self.test_endpoint(
            "GET", "/api/personas/99999",
            expected_status=404,
            description="Get non-existent persona (expect 404)"
        )
        
        # ==========================================
        print_header("3. Initial Message API")
        # ==========================================
        
        initial_response = self.test_endpoint(
            "GET", "/api/initial",
            description="Get initial message"
        )
        if initial_response:
            print_info(f"Initial message text: {initial_response.get('text', '')[:100]}...")
            print_info(f"Has audio: {'audio' in initial_response and initial_response['audio'] is not None}")
            print_info(f"Duration: {initial_response.get('duration', 0)} seconds")
        
        # ==========================================
        print_header("4. Chat API (Simple)")
        # ==========================================
        
        chat_message = {
            "messages": [
                {"role": "user", "content": "Olá, me fale sobre você em uma frase curta."}
            ]
        }
        chat_response = self.test_endpoint(
            "POST", "/api/chat/simple",
            json_data=chat_message,
            headers={"x-session-id": "test-session"},
            description="Simple chat request"
        )
        if chat_response:
            print_info(f"Chat response: {chat_response.get('text', '')[:150]}...")
            print_info(f"Has audio: {'audio' in chat_response and chat_response['audio'] is not None}")
        
        # ==========================================
        print_header("5. Session Management")
        # ==========================================
        
        self.test_endpoint(
            "DELETE", "/api/session/test-session",
            description="Clear test session"
        )
        
        # ==========================================
        print_header("Test Results Summary")
        # ==========================================
        
        total = self.tests_passed + self.tests_failed
        print(f"\n{Colors.BOLD}Total Tests: {total}{Colors.END}")
        print(f"{Colors.GREEN}Passed: {self.tests_passed}{Colors.END}")
        print(f"{Colors.RED}Failed: {self.tests_failed}{Colors.END}")
        
        if self.tests_failed == 0:
            print(f"\n{Colors.GREEN}{Colors.BOLD}All tests passed! 🎉{Colors.END}")
            return 0
        else:
            print(f"\n{Colors.RED}{Colors.BOLD}Some tests failed.{Colors.END}")
            return 1


def main():
    parser = argparse.ArgumentParser(description="Test the TCC Interview Simulator Backend API")
    parser.add_argument(
        "--base-url",
        default="http://localhost:8000",
        help="Base URL of the API (default: http://localhost:8000)"
    )
    args = parser.parse_args()
    
    print(f"\n{Colors.BOLD}TCC Interview Simulator - API Test Script{Colors.END}")
    print(f"Testing API at: {args.base_url}")
    
    tester = APITester(base_url=args.base_url)
    exit_code = tester.run_all_tests()
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
