"""
Test file for Modules and Lessons CRUD API
Testing:
- Admin: Create/Read/Update/Delete modules
- Admin: Create/Read/Update/Delete lessons
- Public: Read modules and lessons (for teachers)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# ============ Module CRUD Tests ============

class TestModulesCRUD:
    """Admin modules CRUD tests"""
    
    def test_get_all_modules(self):
        """GET /api/admin/modules - should return list of modules"""
        response = requests.get(f"{BASE_URL}/api/admin/modules")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3  # Initial mock data has 3 modules
        
        # Validate module structure
        module = data[0]
        assert "id" in module
        assert "title" in module
        assert "description" in module
        assert "order" in module
        assert "lessons_count" in module
        print(f"✓ GET modules: {len(data)} modules found")
    
    def test_create_module(self):
        """POST /api/admin/modules - should create new module"""
        unique_title = f"TEST_Module_{uuid.uuid4().hex[:8]}"
        payload = {
            "title": unique_title,
            "description": "Test module description",
            "order": 99
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/modules", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["title"] == unique_title
        assert data["description"] == "Test module description"
        assert data["order"] == 99
        assert data["lessons_count"] == 0
        assert "id" in data
        
        # Store for cleanup
        self.__class__.created_module_id = data["id"]
        print(f"✓ CREATE module: {data['id']}")
        return data["id"]
    
    def test_update_module(self):
        """PUT /api/admin/modules/{id} - should update module"""
        # First create a module to update
        module_id = getattr(self.__class__, 'created_module_id', None)
        if not module_id:
            module_id = self.test_create_module()
        
        update_payload = {
            "title": "Updated Module Title",
            "description": "Updated description",
            "order": 50
        }
        
        response = requests.put(f"{BASE_URL}/api/admin/modules/{module_id}", json=update_payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["title"] == "Updated Module Title"
        assert data["description"] == "Updated description"
        assert data["order"] == 50
        print(f"✓ UPDATE module: {module_id}")
    
    def test_delete_module(self):
        """DELETE /api/admin/modules/{id} - should delete module"""
        # Create a module to delete
        unique_title = f"TEST_ToDelete_{uuid.uuid4().hex[:8]}"
        create_response = requests.post(f"{BASE_URL}/api/admin/modules", json={
            "title": unique_title,
            "description": "Will be deleted"
        })
        module_id = create_response.json()["id"]
        
        response = requests.delete(f"{BASE_URL}/api/admin/modules/{module_id}")
        assert response.status_code == 200
        assert response.json()["success"] == True
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/admin/modules")
        modules = get_response.json()
        module_ids = [m["id"] for m in modules]
        assert module_id not in module_ids
        print(f"✓ DELETE module: {module_id}")
    
    def test_delete_module_not_found(self):
        """DELETE non-existent module should return 404"""
        response = requests.delete(f"{BASE_URL}/api/admin/modules/nonexistent-id")
        assert response.status_code == 404
        print("✓ DELETE non-existent module returns 404")


# ============ Lesson CRUD Tests ============

class TestLessonsCRUD:
    """Admin lessons CRUD tests"""
    
    @classmethod
    def setup_class(cls):
        """Create test module for lessons"""
        unique_title = f"TEST_LessonModule_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/admin/modules", json={
            "title": unique_title,
            "description": "Module for lesson tests"
        })
        cls.test_module_id = response.json()["id"]
        print(f"Setup: Created test module {cls.test_module_id}")
    
    def test_get_module_lessons_empty(self):
        """GET /api/admin/modules/{id}/lessons - should return empty list for new module"""
        response = requests.get(f"{BASE_URL}/api/admin/modules/{self.test_module_id}/lessons")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0
        print(f"✓ GET lessons for new module: 0 lessons")
    
    def test_get_existing_module_lessons(self):
        """GET /api/admin/modules/1/lessons - should return lessons for existing module"""
        response = requests.get(f"{BASE_URL}/api/admin/modules/1/lessons")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2  # Module 1 has 2 lessons
        
        # Validate lesson structure
        lesson = data[0]
        assert "id" in lesson
        assert "module_id" in lesson
        assert "title" in lesson
        assert "description" in lesson
        assert "content" in lesson
        assert "duration_minutes" in lesson
        assert "order" in lesson
        print(f"✓ GET lessons for module 1: {len(data)} lessons")
    
    def test_create_lesson(self):
        """POST /api/admin/lessons - should create new lesson"""
        unique_title = f"TEST_Lesson_{uuid.uuid4().hex[:8]}"
        payload = {
            "module_id": self.test_module_id,
            "title": unique_title,
            "description": "Test lesson description",
            "content": "<h2>Test Content</h2><p>This is test content with <strong>HTML</strong>.</p>",
            "duration_minutes": 45,
            "order": 1
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/lessons", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["title"] == unique_title
        assert data["description"] == "Test lesson description"
        assert data["content"] == payload["content"]
        assert data["duration_minutes"] == 45
        assert data["module_id"] == self.test_module_id
        assert "id" in data
        
        self.__class__.created_lesson_id = data["id"]
        print(f"✓ CREATE lesson: {data['id']}")
        return data["id"]
    
    def test_get_lesson_by_id(self):
        """GET /api/admin/lessons/{id} - should return lesson by ID"""
        lesson_id = getattr(self.__class__, 'created_lesson_id', None)
        if not lesson_id:
            lesson_id = self.test_create_lesson()
        
        response = requests.get(f"{BASE_URL}/api/admin/lessons/{lesson_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == lesson_id
        assert "title" in data
        assert "content" in data
        print(f"✓ GET lesson by ID: {lesson_id}")
    
    def test_update_lesson(self):
        """PUT /api/admin/lessons/{id} - should update lesson"""
        lesson_id = getattr(self.__class__, 'created_lesson_id', None)
        if not lesson_id:
            lesson_id = self.test_create_lesson()
        
        update_payload = {
            "title": "Updated Lesson Title",
            "description": "Updated lesson description",
            "content": "<h2>Updated Content</h2><p>New <em>HTML</em> content.</p>",
            "duration_minutes": 60,
            "order": 5
        }
        
        response = requests.put(f"{BASE_URL}/api/admin/lessons/{lesson_id}", json=update_payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["title"] == "Updated Lesson Title"
        assert data["description"] == "Updated lesson description"
        assert data["content"] == update_payload["content"]
        assert data["duration_minutes"] == 60
        assert data["order"] == 5
        print(f"✓ UPDATE lesson: {lesson_id}")
    
    def test_partial_update_lesson(self):
        """PUT with partial data - should only update specified fields"""
        lesson_id = getattr(self.__class__, 'created_lesson_id', None)
        if not lesson_id:
            lesson_id = self.test_create_lesson()
        
        # Only update title
        response = requests.put(f"{BASE_URL}/api/admin/lessons/{lesson_id}", json={
            "title": "Only Title Updated"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data["title"] == "Only Title Updated"
        # Other fields should remain
        assert data["duration_minutes"] is not None
        print(f"✓ PARTIAL UPDATE lesson: {lesson_id}")
    
    def test_delete_lesson(self):
        """DELETE /api/admin/lessons/{id} - should delete lesson"""
        # Create a lesson to delete
        create_response = requests.post(f"{BASE_URL}/api/admin/lessons", json={
            "module_id": self.test_module_id,
            "title": "TEST_ToDelete_Lesson",
            "content": "Will be deleted"
        })
        lesson_id = create_response.json()["id"]
        
        response = requests.delete(f"{BASE_URL}/api/admin/lessons/{lesson_id}")
        assert response.status_code == 200
        assert response.json()["success"] == True
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/admin/lessons/{lesson_id}")
        assert get_response.status_code == 404
        print(f"✓ DELETE lesson: {lesson_id}")
    
    def test_create_lesson_nonexistent_module(self):
        """POST lesson with non-existent module_id should return 404"""
        response = requests.post(f"{BASE_URL}/api/admin/lessons", json={
            "module_id": "nonexistent-module-id",
            "title": "Should fail",
            "content": "Test"
        })
        assert response.status_code == 404
        print("✓ CREATE lesson with invalid module_id returns 404")
    
    def test_delete_lesson_not_found(self):
        """DELETE non-existent lesson should return 404"""
        response = requests.delete(f"{BASE_URL}/api/admin/lessons/nonexistent-id")
        assert response.status_code == 404
        print("✓ DELETE non-existent lesson returns 404")


# ============ Public API Tests (Teacher) ============

class TestPublicModulesLessons:
    """Public API tests for teacher view"""
    
    def test_get_public_modules(self):
        """GET /api/modules - should return all modules"""
        response = requests.get(f"{BASE_URL}/api/modules")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3
        
        module = data[0]
        assert "id" in module
        assert "title" in module
        assert "lessons_count" in module
        print(f"✓ PUBLIC GET modules: {len(data)} modules")
    
    def test_get_public_module_lessons(self):
        """GET /api/modules/{id}/lessons - should return lessons for module"""
        response = requests.get(f"{BASE_URL}/api/modules/1/lessons")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2
        
        lesson = data[0]
        assert "id" in lesson
        assert "title" in lesson
        assert "content" in lesson
        print(f"✓ PUBLIC GET module 1 lessons: {len(data)} lessons")
    
    def test_get_public_lesson_by_id(self):
        """GET /api/lessons/{id} - should return single lesson"""
        response = requests.get(f"{BASE_URL}/api/lessons/1")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "1"
        assert "title" in data
        assert "content" in data
        assert "duration_minutes" in data
        print(f"✓ PUBLIC GET lesson by ID: {data['title'][:30]}...")
    
    def test_get_public_lesson_not_found(self):
        """GET /api/lessons/{id} for non-existent lesson returns 404"""
        response = requests.get(f"{BASE_URL}/api/lessons/nonexistent-id")
        assert response.status_code == 404
        print("✓ PUBLIC GET non-existent lesson returns 404")
    
    def test_get_public_module_lessons_not_found(self):
        """GET /api/modules/{id}/lessons for non-existent module returns 404"""
        response = requests.get(f"{BASE_URL}/api/modules/nonexistent-module/lessons")
        assert response.status_code == 404
        print("✓ PUBLIC GET lessons for non-existent module returns 404")


# ============ Module Lessons Count Tests ============

class TestModuleLessonsCount:
    """Test that lessons_count is correctly updated"""
    
    def test_lessons_count_after_create(self):
        """Lessons count should increase after adding a lesson"""
        # Create a module
        mod_response = requests.post(f"{BASE_URL}/api/admin/modules", json={
            "title": f"TEST_CountModule_{uuid.uuid4().hex[:8]}",
            "description": "Test count"
        })
        module_id = mod_response.json()["id"]
        initial_count = mod_response.json()["lessons_count"]
        assert initial_count == 0
        
        # Add a lesson
        requests.post(f"{BASE_URL}/api/admin/lessons", json={
            "module_id": module_id,
            "title": "Count Test Lesson",
            "content": "Test"
        })
        
        # Check updated count
        modules_response = requests.get(f"{BASE_URL}/api/admin/modules")
        module = next((m for m in modules_response.json() if m["id"] == module_id), None)
        assert module is not None
        assert module["lessons_count"] == 1
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/modules/{module_id}")
        print("✓ Lessons count updates correctly")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
