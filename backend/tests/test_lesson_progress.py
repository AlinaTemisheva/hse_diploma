"""
Test file for Lesson Progress Tracking and Content Versioning
Testing:
- MongoDB: Teachers, Tasks, Documents, Modules, Lessons loaded from database
- Lesson Progress: Mark lesson as in_progress when opened
- Lesson Progress: Mark lesson as completed with 'Урок пройден' button
- Lesson Progress: Progress indicator in lessons list
- Content Versioning: Completed lesson shows saved snapshot
- Content Versioning: is_snapshot indicator
- Content Versioning: Incomplete lesson shows current content
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Generate unique user ID for testing to avoid conflicts
TEST_USER_ID = f"test_user_{uuid.uuid4().hex[:8]}"

# ============ MongoDB Data Loading Tests ============

class TestMongoDBCollections:
    """Test that all MongoDB collections are loaded correctly"""
    
    def test_teachers_loaded_from_mongodb(self):
        """GET /api/admin/teachers - teachers should be loaded from MongoDB"""
        response = requests.get(f"{BASE_URL}/api/admin/teachers")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # Validate teacher structure
        teacher = data[0]
        assert "id" in teacher
        assert "name" in teacher
        assert "email" in teacher
        assert "status" in teacher
        print(f"✓ Teachers loaded from MongoDB: {len(data)} teachers")
    
    def test_tasks_loaded_from_mongodb(self):
        """GET /api/tasks - tasks should be loaded from MongoDB"""
        response = requests.get(f"{BASE_URL}/api/tasks")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 5  # Seed data has 5 tasks
        
        # Validate task structure
        task = data[0]
        assert "id" in task
        assert "title" in task
        assert "description" in task
        assert "order" in task
        print(f"✓ Tasks loaded from MongoDB: {len(data)} tasks")
    
    def test_documents_loaded_from_mongodb(self):
        """GET /api/documents - documents should be loaded from MongoDB"""
        response = requests.get(f"{BASE_URL}/api/documents")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 10  # Seed data has 10 documents
        
        # Validate document structure
        doc = data[0]
        assert "id" in doc
        assert "title" in doc
        assert "description" in doc
        assert "file_type" in doc
        print(f"✓ Documents loaded from MongoDB: {len(data)} documents")
    
    def test_modules_loaded_from_mongodb(self):
        """GET /api/modules - modules should be loaded from MongoDB"""
        response = requests.get(f"{BASE_URL}/api/modules")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3  # Seed data has 3 modules
        
        # Validate module structure
        module = data[0]
        assert "id" in module
        assert "title" in module
        assert "description" in module
        assert "order" in module
        assert "lessons_count" in module
        print(f"✓ Modules loaded from MongoDB: {len(data)} modules")
    
    def test_lessons_loaded_from_mongodb(self):
        """GET /api/modules/1/lessons - lessons should be loaded from MongoDB"""
        response = requests.get(f"{BASE_URL}/api/modules/1/lessons")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2  # Module 1 has at least 2 lessons
        
        # Validate lesson structure
        lesson = data[0]
        assert "id" in lesson
        assert "module_id" in lesson
        assert "title" in lesson
        assert "description" in lesson
        assert "content" in lesson
        assert "duration_minutes" in lesson
        assert "order" in lesson
        print(f"✓ Lessons loaded from MongoDB: {len(data)} lessons")


# ============ Lesson Progress Tests ============

class TestLessonProgress:
    """Test lesson progress tracking"""
    
    def test_mark_lesson_in_progress(self):
        """PUT /api/lessons/{id}/progress - mark lesson as in_progress when opened"""
        response = requests.put(
            f"{BASE_URL}/api/lessons/1/progress?user_id={TEST_USER_ID}",
            json={"status": "in_progress"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert data["lesson_id"] == "1"
        assert data["status"] == "in_progress"
        assert data["content_snapshot_saved"] == False
        print(f"✓ Lesson marked as in_progress for user {TEST_USER_ID}")
    
    def test_lesson_shows_in_progress_status(self):
        """GET /api/lessons/{id} - should return in_progress status"""
        response = requests.get(f"{BASE_URL}/api/lessons/1?user_id={TEST_USER_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["progress_status"] == "in_progress"
        assert data["is_snapshot"] == False
        print(f"✓ Lesson shows in_progress status")
    
    def test_progress_indicator_in_lessons_list(self):
        """GET /api/modules/{id}/lessons - should show progress_status for each lesson"""
        # First mark a lesson as in_progress
        requests.put(
            f"{BASE_URL}/api/lessons/1/progress?user_id={TEST_USER_ID}",
            json={"status": "in_progress"}
        )
        
        response = requests.get(f"{BASE_URL}/api/modules/1/lessons?user_id={TEST_USER_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Find lesson 1 and check progress
        lesson_1 = next((l for l in data if l["id"] == "1"), None)
        assert lesson_1 is not None
        assert "progress_status" in lesson_1
        assert lesson_1["progress_status"] == "in_progress"
        
        # Other lessons should be not_started
        other_lessons = [l for l in data if l["id"] != "1"]
        for lesson in other_lessons:
            assert "progress_status" in lesson
        
        print(f"✓ Progress indicator present in lessons list")
    
    def test_mark_lesson_completed(self):
        """PUT /api/lessons/{id}/progress - mark lesson as completed (saves snapshot)"""
        completed_user = f"completed_user_{uuid.uuid4().hex[:8]}"
        
        response = requests.put(
            f"{BASE_URL}/api/lessons/2/progress?user_id={completed_user}",
            json={"status": "completed"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert data["lesson_id"] == "2"
        assert data["status"] == "completed"
        assert data["content_snapshot_saved"] == True
        
        # Store user for next test
        self.__class__.completed_user = completed_user
        print(f"✓ Lesson marked as completed with content snapshot saved")
    
    def test_completed_lesson_shows_completed_status(self):
        """GET /api/lessons/{id} - completed lesson should show completed status"""
        completed_user = getattr(self.__class__, 'completed_user', f"completed_user_{uuid.uuid4().hex[:8]}")
        
        # Mark as completed if not already
        requests.put(
            f"{BASE_URL}/api/lessons/2/progress?user_id={completed_user}",
            json={"status": "completed"}
        )
        
        response = requests.get(f"{BASE_URL}/api/lessons/2?user_id={completed_user}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["progress_status"] == "completed"
        assert data["is_snapshot"] == True
        assert "completed_at" in data
        assert data["completed_at"] is not None
        print(f"✓ Completed lesson shows completed status and is_snapshot=true")


# ============ Content Versioning Tests ============

class TestContentVersioning:
    """Test content versioning and snapshot functionality"""
    
    @classmethod
    def setup_class(cls):
        """Create a user and complete a lesson to test snapshot"""
        cls.versioning_user = f"versioning_user_{uuid.uuid4().hex[:8]}"
        
        # Mark lesson 3 as completed to save snapshot
        response = requests.put(
            f"{BASE_URL}/api/lessons/3/progress?user_id={cls.versioning_user}",
            json={"status": "completed"}
        )
        assert response.status_code == 200
        print(f"Setup: User {cls.versioning_user} completed lesson 3")
    
    def test_completed_lesson_shows_saved_snapshot(self):
        """GET /api/lessons/{id} - completed lesson should return saved content snapshot"""
        response = requests.get(f"{BASE_URL}/api/lessons/3?user_id={self.versioning_user}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["is_snapshot"] == True
        assert "content" in data
        assert data["content"] is not None
        assert len(data["content"]) > 0
        print(f"✓ Completed lesson returns saved content snapshot")
    
    def test_is_snapshot_indicator_shown(self):
        """GET /api/lessons/{id} - completed lesson should have is_snapshot=true"""
        response = requests.get(f"{BASE_URL}/api/lessons/3?user_id={self.versioning_user}")
        assert response.status_code == 200
        
        data = response.json()
        assert "is_snapshot" in data
        assert data["is_snapshot"] == True
        print(f"✓ is_snapshot indicator is present and true for completed lesson")
    
    def test_incomplete_lesson_shows_current_content(self):
        """GET /api/lessons/{id} - incomplete lesson should return current content (not snapshot)"""
        new_user = f"new_user_{uuid.uuid4().hex[:8]}"
        
        response = requests.get(f"{BASE_URL}/api/lessons/3?user_id={new_user}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["is_snapshot"] == False
        assert data["progress_status"] == "not_started"
        assert "content" in data
        print(f"✓ Incomplete lesson returns current content (is_snapshot=false)")
    
    def test_no_snapshot_warning_for_incomplete_lessons(self):
        """Incomplete lesson should have is_snapshot=false"""
        new_user = f"incomplete_user_{uuid.uuid4().hex[:8]}"
        
        # Don't complete the lesson, just mark as in_progress
        requests.put(
            f"{BASE_URL}/api/lessons/1/progress?user_id={new_user}",
            json={"status": "in_progress"}
        )
        
        response = requests.get(f"{BASE_URL}/api/lessons/1?user_id={new_user}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["is_snapshot"] == False
        assert data["progress_status"] == "in_progress"
        print(f"✓ Incomplete lesson has is_snapshot=false (no snapshot warning)")
    
    def test_different_users_get_different_snapshot_states(self):
        """Same lesson should return different is_snapshot for different users"""
        # User 1: completed
        completed_user = f"completed_{uuid.uuid4().hex[:8]}"
        requests.put(
            f"{BASE_URL}/api/lessons/2/progress?user_id={completed_user}",
            json={"status": "completed"}
        )
        
        # User 2: not completed
        new_user = f"newuser_{uuid.uuid4().hex[:8]}"
        
        # Check completed user
        resp1 = requests.get(f"{BASE_URL}/api/lessons/2?user_id={completed_user}")
        data1 = resp1.json()
        assert data1["is_snapshot"] == True
        assert data1["progress_status"] == "completed"
        
        # Check new user
        resp2 = requests.get(f"{BASE_URL}/api/lessons/2?user_id={new_user}")
        data2 = resp2.json()
        assert data2["is_snapshot"] == False
        assert data2["progress_status"] == "not_started"
        
        print(f"✓ Different users get different snapshot states for same lesson")


# ============ User Stats Tests ============

class TestUserStats:
    """Test user statistics for completed lessons"""
    
    def test_user_stats_include_lesson_progress(self):
        """GET /api/user/stats - should include lessons completed count"""
        stats_user = f"stats_user_{uuid.uuid4().hex[:8]}"
        
        # Complete a lesson
        requests.put(
            f"{BASE_URL}/api/lessons/1/progress?user_id={stats_user}",
            json={"status": "completed"}
        )
        
        response = requests.get(f"{BASE_URL}/api/user/stats?user_id={stats_user}")
        assert response.status_code == 200
        
        data = response.json()
        assert "courses_completed" in data
        assert "courses_total" in data
        assert data["courses_completed"] >= 1
        print(f"✓ User stats show lessons completed: {data['courses_completed']}/{data['courses_total']}")


# ============ Auth Tests ============

class TestAuthentication:
    """Test login with MongoDB credentials"""
    
    def test_admin_login(self):
        """POST /api/auth/login - admin login should work"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test_admin@test.ru",
            "password": "test_admin"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert data["role"] == "admin"
        assert data["user"]["email"] == "test_admin@test.ru"
        print(f"✓ Admin login successful")
    
    def test_teacher_login_from_mongodb(self):
        """POST /api/auth/login - teacher login from MongoDB should work"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@test.ru",
            "password": "test"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert data["role"] == "teacher"
        assert data["user"]["email"] == "test@test.ru"
        print(f"✓ Teacher login from MongoDB successful")
    
    def test_invalid_login(self):
        """POST /api/auth/login - invalid credentials should return 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@email.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print(f"✓ Invalid login returns 401")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
