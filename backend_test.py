import requests
import sys
import json
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

    def test_teacher_crud_operations(self):
        """Test comprehensive teacher CRUD operations"""
        print("\n🔍 Testing Teacher CRUD Operations...")
        
        # 1. Get initial teachers list
        success, initial_teachers = self.run_test("Get Initial Teachers", "GET", "admin/teachers", 200)
        if not success:
            print("❌ Failed to get initial teachers")
            return False
        
        initial_count = len(initial_teachers)
        print(f"   Initial teacher count: {initial_count}")
        
        # 2. Create a new teacher with avatar
        teacher_data = {
            "name": "Новый Тестовый Преподаватель",
            "email": f"test_new_teacher_{datetime.now().strftime('%H%M%S')}@test.ru",
            "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=NewTest"
        }
        
        success, created_teacher = self.run_test(
            "Create Teacher with Avatar",
            "POST",
            "admin/teachers",
            200,
            data=teacher_data
        )
        
        if not success or not created_teacher.get('id'):
            print("❌ Failed to create teacher")
            return False
        
        teacher_id = created_teacher['id']
        print(f"   Created teacher ID: {teacher_id}")
        
        # 3. Verify teacher was created with correct data
        success, fetched_teacher = self.run_test(
            f"Get Created Teacher by ID",
            "GET", 
            f"admin/teachers/{teacher_id}",
            200
        )
        
        if not success:
            print("❌ Failed to fetch created teacher")
            return False
        
        if (fetched_teacher.get('name') != teacher_data['name'] or
            fetched_teacher.get('email') != teacher_data['email'] or
            fetched_teacher.get('avatar_url') != teacher_data['avatar_url']):
            print("❌ Created teacher data mismatch")
            return False
        
        print("   ✅ Teacher created with correct data")
        
        # 4. Test updating teacher with all fields
        update_data = {
            "name": "Обновленное Имя Преподавателя",
            "email": f"updated_{datetime.now().strftime('%H%M%S')}@test.ru",
            "status": "completed",
            "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Updated"
        }
        
        success, updated_teacher = self.run_test(
            "Update All Teacher Fields",
            "PUT",
            f"admin/teachers/{teacher_id}",
            200,
            data=update_data
        )
        
        if not success:
            print("❌ Failed to update teacher")
            return False
        
        # Verify update
        success, verify_teacher = self.run_test(
            "Verify Teacher Update",
            "GET",
            f"admin/teachers/{teacher_id}",
            200
        )
        
        if (verify_teacher.get('name') != update_data['name'] or
            verify_teacher.get('email') != update_data['email'] or
            verify_teacher.get('status') != update_data['status'] or
            verify_teacher.get('avatar_url') != update_data['avatar_url']):
            print("❌ Teacher update verification failed")
            return False
        
        print("   ✅ Teacher update successful")
        
        # 5. Test all status options
        status_options = ["registered", "in_progress", "completed", "blocked"]
        for status in status_options:
            success, _ = self.run_test(
                f"Set Status to '{status}'",
                "PUT",
                f"admin/teachers/{teacher_id}",
                200,
                data={"status": status}
            )
            
            if not success:
                print(f"❌ Failed to set status to {status}")
                return False
        
        print("   ✅ All status options work correctly")
        
        # 6. Test partial updates
        partial_update = {"name": "Частичное Обновление Имени"}
        success, _ = self.run_test(
            "Partial Name Update",
            "PUT",
            f"admin/teachers/{teacher_id}",
            200,
            data=partial_update
        )
        
        if not success:
            print("❌ Failed partial update")
            return False
        
        print("   ✅ Partial update works correctly")
        
        # 7. Test error conditions
        # Test duplicate email
        duplicate_data = {
            "name": "Дублированный Email",
            "email": "test@test.ru",  # Should already exist
            "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Duplicate"
        }
        
        success, _ = self.run_test(
            "Create Teacher with Duplicate Email",
            "POST",
            "admin/teachers",
            400,  # Should fail
            data=duplicate_data
        )
        
        if success:  # Should fail, so success means error
            print("❌ Duplicate email was allowed (should be rejected)")
            return False
        
        print("   ✅ Duplicate email properly rejected")
        
        # 8. Test invalid teacher ID
        success, _ = self.run_test(
            "Get Non-existent Teacher",
            "GET",
            "admin/teachers/invalid-id-12345",
            404
        )
        
        if success:  # Should fail with 404
            print("❌ Invalid teacher ID should return 404")
            return False
        
        print("   ✅ Invalid teacher ID properly returns 404")
        
        print("\n✅ All Teacher CRUD operations passed!")
        return True

def main():
    print("🚀 Starting Onboarding API Tests (including Admin Panel)")
    print("=" * 60)
    
    tester = OnboardingAPITester()
    
    # Test regular endpoints first
    print("\n📱 Testing Regular User Endpoints")
    regular_tests = [
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
    
    for test in regular_tests:
        test()
    
    print("\n👨‍💼 Testing Admin Endpoints")
    admin_tests = [
        tester.test_admin_login_success,
        tester.test_get_admin_teachers,
        tester.test_get_admin_tasks,
        tester.test_get_admin_courses,
        tester.test_get_admin_documents,
        tester.test_get_admin_stats
    ]
    
    for test in admin_tests:
        test()
    
    # Run comprehensive teacher CRUD tests
    print("\n🔄 Testing Teacher CRUD Operations")
    tester.test_teacher_crud_operations()
    
    print(f"\n📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    print("=" * 60)
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All API tests passed!")
        return 0
    else:
        print("⚠️  Some API tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())