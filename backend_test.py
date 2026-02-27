import requests
import sys
from datetime import datetime

class OnboardingAPITester:
    def __init__(self, base_url="https://figma-to-web-31.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.content:
                    try:
                        return success, response.json()
                    except:
                        return success, {}
                return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API Endpoint", "GET", "", 200)

    def test_login_success(self):
        """Test successful login with correct credentials"""
        success, response = self.run_test(
            "Login Success",
            "POST", 
            "auth/login",
            200,
            data={"email": "test@test.ru", "password": "test"}
        )
        if success and 'user' in response:
            print(f"   User: {response['user']['name']}")
            return True
        return False

    def test_login_failure(self):
        """Test login failure with incorrect credentials"""
        return self.run_test(
            "Login Failure",
            "POST",
            "auth/login", 
            401,
            data={"email": "wrong@test.ru", "password": "wrong"}
        )[0]

    def test_get_tasks(self):
        """Test fetching tasks"""
        success, response = self.run_test("Get Tasks", "GET", "tasks", 200)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} tasks")
            return True
        return False

    def test_get_courses(self):
        """Test fetching courses"""
        success, response = self.run_test("Get Courses", "GET", "courses", 200)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} courses")
            return True
        return False

    def test_get_documents(self):
        """Test fetching documents"""
        success, response = self.run_test("Get Documents", "GET", "documents", 200)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} documents")
            return True
        return False

    def test_get_services(self):
        """Test fetching services"""
        success, response = self.run_test("Get Services", "GET", "services", 200)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} services")
            return True
        return False

    def test_get_user_stats(self):
        """Test fetching user stats"""
        success, response = self.run_test("Get User Stats", "GET", "user/stats", 200)
        if success and 'tasks_completed' in response and 'courses_completed' in response:
            print(f"   Tasks: {response['tasks_completed']}/{response['tasks_total']}")
            print(f"   Courses: {response['courses_completed']}/{response['courses_total']}")
            return True
        return False

    def test_task_toggle(self):
        """Test toggling task completion"""
        # First get a task to toggle
        success, tasks = self.run_test("Get Tasks for Toggle", "GET", "tasks", 200)
        if not success or not tasks:
            return False
        
        task_id = tasks[0]['id']
        original_state = tasks[0]['completed']
        new_state = not original_state
        
        success, response = self.run_test(
            f"Toggle Task {task_id}",
            "PUT",
            f"tasks/{task_id}/toggle",
            200,
            data={"completed": new_state}
        )
        
        if success and response.get('success') and response.get('completed') == new_state:
            print(f"   Task {task_id}: {original_state} -> {new_state}")
            return True
        return False

    def test_admin_login_success(self):
        """Test successful admin login"""
        success, response = self.run_test(
            "Admin Login Success",
            "POST", 
            "auth/login",
            200,
            data={"email": "test_admin@test.ru", "password": "test_admin"}
        )
        if success and response.get('role') == 'admin':
            print(f"   Admin User: {response['user']['name']}")
            return True
        return False

    def test_get_admin_teachers(self):
        """Test fetching teachers (admin endpoint)"""
        success, response = self.run_test("Get Admin Teachers", "GET", "admin/teachers", 200)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} teachers")
            if len(response) > 0:
                first_teacher = response[0]
                print(f"   First teacher: {first_teacher.get('name')} ({first_teacher.get('email')}) - {first_teacher.get('status')}")
            return True
        return False

    def test_create_teacher(self):
        """Test creating a new teacher"""
        test_teacher = {
            "name": "Новый Преподаватель", 
            "email": "new@test.ru"
        }
        
        success, response = self.run_test(
            "Create Teacher",
            "POST",
            "admin/teachers",
            200,
            data=test_teacher
        )
        
        if success and response.get('name') == test_teacher['name']:
            print(f"   Created teacher: {response['name']} ({response['email']}) - Status: {response['status']}")
            return True, response.get('id')
        return False, None

    def test_get_admin_tasks(self):
        """Test fetching admin tasks"""
        success, response = self.run_test("Get Admin Tasks", "GET", "admin/tasks", 200)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} admin tasks")
            return True
        return False

    def test_get_admin_courses(self):
        """Test fetching admin courses"""
        success, response = self.run_test("Get Admin Courses", "GET", "admin/courses", 200)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} admin courses")
            return True
        return False

    def test_get_admin_documents(self):
        """Test fetching admin documents"""
        success, response = self.run_test("Get Admin Documents", "GET", "admin/documents", 200)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} admin documents")
            return True
        return False

    def test_get_admin_stats(self):
        """Test fetching admin stats"""
        success, response = self.run_test("Get Admin Stats", "GET", "admin/stats", 200)
        if success and 'teachers_count' in response:
            print(f"   Teachers: {response['teachers_count']}, Tasks: {response['tasks_count']}")
            print(f"   Courses: {response['courses_count']}, Documents: {response['documents_count']}")
            return True
        return False

def main():
    print("🚀 Starting Onboarding API Tests")
    print("=" * 50)
    
    tester = OnboardingAPITester()
    
    # Test all endpoints
    tests = [
        tester.test_root_endpoint,
        tester.test_login_success,
        tester.test_login_failure,
        tester.test_get_tasks,
        tester.test_get_courses,
        tester.test_get_documents,
        tester.test_get_services,
        tester.test_get_user_stats,
        tester.test_task_toggle
    ]
    
    for test in tests:
        test()
    
    print(f"\n📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    print("=" * 50)
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All API tests passed!")
        return 0
    else:
        print("⚠️  Some API tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())