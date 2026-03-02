"""
Tests for Teacher Password Feature (Admin can set login/password for teachers)
Features tested:
- Create teacher with custom password
- Create teacher with auto-generated password
- Edit teacher and change password
- Login with password set by admin
- New user sees tasks, modules, documents
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestTeacherPasswordFeature:
    """Tests for admin setting login/password for teachers"""
    
    @pytest.fixture(autouse=True)
    def cleanup(self):
        """Cleanup test data after each test"""
        yield
        # Cleanup any test teachers we created
        try:
            response = requests.get(f"{BASE_URL}/api/admin/teachers")
            if response.status_code == 200:
                teachers = response.json()
                for teacher in teachers:
                    if teacher.get('email', '').startswith('TEST_'):
                        requests.delete(f"{BASE_URL}/api/admin/teachers/{teacher['id']}")
        except Exception:
            pass
    
    def test_api_health(self):
        """Test that API is accessible"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200, f"API not accessible: {response.text}"
        print("API health check passed")
    
    def test_admin_login(self):
        """Test admin can login with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test_admin@test.ru",
            "password": "test_admin"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["role"] == "admin"
        print("Admin login successful")
    
    def test_create_teacher_with_custom_password(self):
        """Test creating a teacher with custom password"""
        custom_password = "mySecurePassword123"
        response = requests.post(f"{BASE_URL}/api/admin/teachers", json={
            "name": "TEST_CustomPass User",
            "email": "TEST_custompass@test.ru",
            "password": custom_password
        })
        
        assert response.status_code == 200, f"Failed to create teacher: {response.text}"
        data = response.json()
        
        # Verify teacher was created
        assert data["name"] == "TEST_CustomPass User"
        assert data["email"] == "TEST_custompass@test.ru"
        assert data["password"] == custom_password, "Password returned should match custom password"
        assert data["status"] == "registered"
        assert "id" in data
        
        # Verify password is saved by attempting login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "TEST_custompass@test.ru",
            "password": custom_password
        })
        assert login_response.status_code == 200, f"Login with custom password failed: {login_response.text}"
        login_data = login_response.json()
        assert login_data["success"] is True
        assert login_data["role"] == "teacher"
        assert login_data["user"]["name"] == "TEST_CustomPass User"
        
        print("Create teacher with custom password: PASSED")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/teachers/{data['id']}")
    
    def test_create_teacher_with_auto_generated_password(self):
        """Test creating a teacher without password (should auto-generate)"""
        response = requests.post(f"{BASE_URL}/api/admin/teachers", json={
            "name": "TEST_AutoPass User",
            "email": "TEST_autopass@test.ru"
            # No password provided - should be auto-generated
        })
        
        assert response.status_code == 200, f"Failed to create teacher: {response.text}"
        data = response.json()
        
        # Verify teacher was created with auto-generated password
        assert data["name"] == "TEST_AutoPass User"
        assert data["email"] == "TEST_autopass@test.ru"
        assert "password" in data, "Auto-generated password should be returned on creation"
        assert len(data["password"]) >= 8, "Auto-generated password should be at least 8 chars"
        assert data["status"] == "registered"
        
        auto_password = data["password"]
        
        # Verify auto-generated password works for login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "TEST_autopass@test.ru",
            "password": auto_password
        })
        assert login_response.status_code == 200, f"Login with auto-generated password failed"
        login_data = login_response.json()
        assert login_data["success"] is True
        assert login_data["role"] == "teacher"
        
        print(f"Create teacher with auto-generated password: PASSED (password length: {len(auto_password)})")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/teachers/{data['id']}")
    
    def test_edit_teacher_change_password(self):
        """Test editing a teacher to change their password"""
        # First create a teacher
        create_response = requests.post(f"{BASE_URL}/api/admin/teachers", json={
            "name": "TEST_ChangePass User",
            "email": "TEST_changepass@test.ru",
            "password": "oldPassword123"
        })
        assert create_response.status_code == 200
        teacher_data = create_response.json()
        teacher_id = teacher_data["id"]
        
        # Verify old password works
        login_old = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "TEST_changepass@test.ru",
            "password": "oldPassword123"
        })
        assert login_old.status_code == 200, "Old password should work initially"
        
        # Now update the password
        new_password = "newSecurePassword456"
        update_response = requests.put(f"{BASE_URL}/api/admin/teachers/{teacher_id}", json={
            "password": new_password
        })
        assert update_response.status_code == 200, f"Failed to update teacher: {update_response.text}"
        
        # Verify old password no longer works
        login_old_again = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "TEST_changepass@test.ru",
            "password": "oldPassword123"
        })
        assert login_old_again.status_code == 401, "Old password should not work after change"
        
        # Verify new password works
        login_new = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "TEST_changepass@test.ru",
            "password": new_password
        })
        assert login_new.status_code == 200, "New password should work after change"
        login_data = login_new.json()
        assert login_data["success"] is True
        
        print("Edit teacher change password: PASSED")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/teachers/{teacher_id}")
    
    def test_edit_teacher_empty_password_no_change(self):
        """Test that empty password on edit doesn't change the password"""
        # Create a teacher with known password
        create_response = requests.post(f"{BASE_URL}/api/admin/teachers", json={
            "name": "TEST_KeepPass User",
            "email": "TEST_keeppass@test.ru",
            "password": "keepThisPassword"
        })
        assert create_response.status_code == 200
        teacher_data = create_response.json()
        teacher_id = teacher_data["id"]
        
        # Update with empty password (should not change password)
        update_response = requests.put(f"{BASE_URL}/api/admin/teachers/{teacher_id}", json={
            "name": "TEST_KeepPass User Updated",
            "password": ""  # Empty password
        })
        assert update_response.status_code == 200
        
        # Verify original password still works
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "TEST_keeppass@test.ru",
            "password": "keepThisPassword"
        })
        assert login_response.status_code == 200, "Original password should still work when empty password sent on edit"
        
        print("Edit teacher with empty password (no change): PASSED")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/teachers/{teacher_id}")
    
    def test_new_user_sees_content(self):
        """Test that new user can access tasks, modules, documents after login"""
        # Create a new teacher
        create_response = requests.post(f"{BASE_URL}/api/admin/teachers", json={
            "name": "TEST_NewUser Content",
            "email": "TEST_newuser_content@test.ru",
            "password": "contentTest123"
        })
        assert create_response.status_code == 200
        teacher_data = create_response.json()
        teacher_id = teacher_data["id"]
        user_id = teacher_id  # For the new teacher, the teacher id is used
        
        # Login as new user
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "TEST_newuser_content@test.ru",
            "password": "contentTest123"
        })
        assert login_response.status_code == 200
        login_data = login_response.json()
        assert login_data["success"] is True
        user_id = login_data.get("user_id")
        
        # Test tasks endpoint
        tasks_response = requests.get(f"{BASE_URL}/api/tasks?user_id={user_id}")
        assert tasks_response.status_code == 200, f"Tasks endpoint failed: {tasks_response.text}"
        tasks = tasks_response.json()
        assert isinstance(tasks, list), "Tasks should be a list"
        print(f"New user can see {len(tasks)} tasks")
        
        # Test modules endpoint
        modules_response = requests.get(f"{BASE_URL}/api/modules")
        assert modules_response.status_code == 200, f"Modules endpoint failed: {modules_response.text}"
        modules = modules_response.json()
        assert isinstance(modules, list), "Modules should be a list"
        print(f"New user can see {len(modules)} modules")
        
        # Test documents endpoint
        docs_response = requests.get(f"{BASE_URL}/api/documents")
        assert docs_response.status_code == 200, f"Documents endpoint failed: {docs_response.text}"
        docs = docs_response.json()
        assert isinstance(docs, list), "Documents should be a list"
        print(f"New user can see {len(docs)} documents")
        
        # Test user stats endpoint
        stats_response = requests.get(f"{BASE_URL}/api/user/stats?user_id={user_id}")
        assert stats_response.status_code == 200, f"Stats endpoint failed: {stats_response.text}"
        stats = stats_response.json()
        assert "tasks_completed" in stats
        assert "courses_completed" in stats
        print(f"New user stats: tasks_completed={stats['tasks_completed']}, courses_completed={stats['courses_completed']}")
        
        print("New user sees content: PASSED")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/teachers/{teacher_id}")
    
    def test_password_not_returned_in_teachers_list(self):
        """Test that password is NOT included in the teachers list for security"""
        # Create a teacher
        create_response = requests.post(f"{BASE_URL}/api/admin/teachers", json={
            "name": "TEST_NoPassInList User",
            "email": "TEST_nopassinlist@test.ru",
            "password": "secretPassword123"
        })
        assert create_response.status_code == 200
        teacher_data = create_response.json()
        teacher_id = teacher_data["id"]
        
        # Get teachers list
        list_response = requests.get(f"{BASE_URL}/api/admin/teachers")
        assert list_response.status_code == 200
        teachers = list_response.json()
        
        # Find our test teacher
        test_teacher = next((t for t in teachers if t.get("id") == teacher_id), None)
        assert test_teacher is not None, "Test teacher not found in list"
        
        # Verify password is NOT in the response
        assert "password" not in test_teacher, "Password should NOT be returned in teachers list"
        
        print("Password not returned in teachers list: PASSED")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/teachers/{teacher_id}")
    
    def test_duplicate_email_rejected(self):
        """Test that duplicate email is rejected when creating teacher"""
        # Create first teacher
        create_response1 = requests.post(f"{BASE_URL}/api/admin/teachers", json={
            "name": "TEST_Duplicate1 User",
            "email": "TEST_duplicate@test.ru",
            "password": "password123"
        })
        assert create_response1.status_code == 200
        teacher_id = create_response1.json()["id"]
        
        # Try to create second teacher with same email
        create_response2 = requests.post(f"{BASE_URL}/api/admin/teachers", json={
            "name": "TEST_Duplicate2 User",
            "email": "TEST_duplicate@test.ru",
            "password": "password456"
        })
        assert create_response2.status_code == 400, "Duplicate email should be rejected"
        
        print("Duplicate email rejected: PASSED")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/teachers/{teacher_id}")
    
    def test_login_with_wrong_password_fails(self):
        """Test that login with wrong password fails"""
        # Create a teacher
        create_response = requests.post(f"{BASE_URL}/api/admin/teachers", json={
            "name": "TEST_WrongPass User",
            "email": "TEST_wrongpass@test.ru",
            "password": "correctPassword123"
        })
        assert create_response.status_code == 200
        teacher_id = create_response.json()["id"]
        
        # Try to login with wrong password
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "TEST_wrongpass@test.ru",
            "password": "wrongPassword456"
        })
        assert login_response.status_code == 401, "Login with wrong password should fail"
        
        print("Login with wrong password fails: PASSED")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/teachers/{teacher_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
