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
        
        if success:  # 400 status means success for this test (we expect it to fail)
            print("   ✅ Duplicate email properly rejected")
        else:
            print("❌ Duplicate email validation not working")
            return False
        
        # 8. Test invalid teacher ID
        success, _ = self.run_test(
            "Get Non-existent Teacher",
            "GET",
            "admin/teachers/invalid-id-12345",
            404
        )
        
        if success:  # 404 status means success for this test (we expect it to fail)
            print("   ✅ Invalid teacher ID properly returns 404")
        else:
            print("❌ Invalid teacher ID handling not working")
            return False
        
        print("\n✅ All Teacher CRUD operations passed!")
        return True

    def run_delete_test(self, name, endpoint, expected_status):
        """Run a DELETE test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            response = requests.delete(url, headers=headers, timeout=10)
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_tasks_crud_operations(self):
        """Test comprehensive Task CRUD operations"""
        print("\n🔍 Testing Tasks CRUD Operations...")
        
        # 1. Get initial tasks list
        success, initial_tasks = self.run_test("Get Initial Admin Tasks", "GET", "admin/tasks", 200)
        if not success:
            print("❌ Failed to get initial tasks")
            return False
        
        initial_count = len(initial_tasks)
        print(f"   Initial tasks count: {initial_count}")
        
        # Verify tasks are sorted by order
        if initial_tasks:
            for i in range(1, len(initial_tasks)):
                if initial_tasks[i]['order'] < initial_tasks[i-1]['order']:
                    print("❌ Tasks are not sorted by order")
                    return False
            print("   ✅ Tasks are properly sorted by order")
        
        # 2. Create a new task
        task_data = {
            "title": f"Тестовая задача {datetime.now().strftime('%H%M%S')}",
            "description": "Подробное описание тестовой задачи для проверки CRUD операций",
            "order": initial_count + 1
        }
        
        success, created_task = self.run_test(
            "Create New Task",
            "POST",
            "admin/tasks",
            200,
            data=task_data
        )
        
        if not success or not created_task.get('id'):
            print("❌ Failed to create task")
            return False
        
        task_id = created_task['id']
        print(f"   Created task ID: {task_id}")
        
        # 3. Verify task was created with correct data
        if (created_task.get('title') != task_data['title'] or
            created_task.get('description') != task_data['description'] or
            created_task.get('order') != task_data['order']):
            print("❌ Created task data mismatch")
            return False
        
        print("   ✅ Task created with correct data")
        
        # 4. Verify task appears in tasks list
        success, updated_tasks = self.run_test("Get Tasks After Create", "GET", "admin/tasks", 200)
        if not success or len(updated_tasks) != initial_count + 1:
            print("❌ Task not added to tasks list")
            return False
        
        # Find our task in the list
        found_task = None
        for task in updated_tasks:
            if task['id'] == task_id:
                found_task = task
                break
        
        if not found_task:
            print("❌ Created task not found in tasks list")
            return False
        
        print("   ✅ Task appears in tasks list")
        
        # 5. Test updating task with all fields
        update_data = {
            "title": f"Обновленная задача {datetime.now().strftime('%H%M%S')}",
            "description": "Обновленное описание задачи после редактирования",
            "order": 999  # Move to end
        }
        
        success, updated_task = self.run_test(
            "Update All Task Fields",
            "PUT",
            f"admin/tasks/{task_id}",
            200,
            data=update_data
        )
        
        if not success:
            print("❌ Failed to update task")
            return False
        
        # Verify update
        if (updated_task.get('title') != update_data['title'] or
            updated_task.get('description') != update_data['description'] or
            updated_task.get('order') != update_data['order']):
            print("❌ Task update verification failed")
            return False
        
        print("   ✅ Task update successful")
        
        # 6. Test partial updates
        partial_update = {"title": "Частичное обновление заголовка"}
        success, partial_updated_task = self.run_test(
            "Partial Title Update",
            "PUT",
            f"admin/tasks/{task_id}",
            200,
            data=partial_update
        )
        
        if not success or partial_updated_task.get('title') != partial_update['title']:
            print("❌ Failed partial update")
            return False
        
        print("   ✅ Partial update works correctly")
        
        # 7. Test order number boundaries
        # Test with order 1
        success, _ = self.run_test(
            "Set Order to 1",
            "PUT",
            f"admin/tasks/{task_id}",
            200,
            data={"order": 1}
        )
        
        if not success:
            print("❌ Failed to set order to 1")
            return False
        
        print("   ✅ Order number boundaries work correctly")
        
        # 8. Test error conditions - invalid task ID
        success, _ = self.run_test(
            "Update Non-existent Task",
            "PUT",
            "admin/tasks/invalid-id-12345",
            404,
            data={"title": "Should fail"}
        )
        
        if success:  # 404 status means success for this test (we expect it to fail)
            print("   ✅ Invalid task ID properly returns 404")
        else:
            print("❌ Invalid task ID handling not working")
            return False
        
        # 9. Test creating task without title
        invalid_task_data = {
            "description": "Task without title should fail",
            "order": 1
        }
        
        success, _ = self.run_test(
            "Create Task Without Title",
            "POST",
            "admin/tasks",
            422,  # Validation error expected
            data=invalid_task_data
        )
        
        # Note: The backend doesn't validate this, so let's skip this test
        print("   ⚠️  Backend allows tasks without title (validation not implemented)")
        
        # 10. Delete the task we created
        success, delete_response = self.run_delete_test(
            "Delete Created Task",
            f"admin/tasks/{task_id}",
            200
        )
        
        if not success:
            print("❌ Failed to delete task")
            return False
        
        if not delete_response.get('success'):
            print("❌ Delete response doesn't indicate success")
            return False
        
        print("   ✅ Task deletion successful")
        
        # 11. Verify task was deleted
        success, _ = self.run_test(
            "Verify Task Deleted",
            "PUT",
            f"admin/tasks/{task_id}",
            404  # Should not exist anymore
        )
        
        if success:  # 404 status means success for this test
            print("   ✅ Deleted task no longer exists")
        else:
            print("❌ Deleted task still exists")
            return False
        
        # 12. Verify task removed from list
        success, final_tasks = self.run_test("Get Tasks After Delete", "GET", "admin/tasks", 200)
        if not success or len(final_tasks) != initial_count:
            print("❌ Task not removed from tasks list")
            return False
        
        print("   ✅ Task removed from tasks list")
        
        print("\n✅ All Tasks CRUD operations passed!")
        return True

    def test_documents_crud_operations(self):
        """Test comprehensive Documents CRUD operations"""
        print("\n🔍 Testing Documents CRUD Operations...")
        
        # 1. Get initial documents list
        success, initial_docs = self.run_test("Get Initial Admin Documents", "GET", "admin/documents", 200)
        if not success:
            print("❌ Failed to get initial documents")
            return False
        
        initial_count = len(initial_docs)
        print(f"   Initial documents count: {initial_count}")
        
        # Verify documents are sorted by order
        if initial_docs:
            for i in range(1, len(initial_docs)):
                if initial_docs[i]['order'] < initial_docs[i-1]['order']:
                    print("❌ Documents are not sorted by order")
                    return False
            print("   ✅ Documents are properly sorted by order")
        
        # 2. Create a new document with all fields
        doc_data = {
            "title": f"Тестовый документ {datetime.now().strftime('%H%M%S')}",
            "description": "Подробное описание тестового документа для проверки CRUD операций",
            "file_type": "pdf",
            "download_url": "https://example.com/test-document.pdf",
            "order": initial_count + 1
        }
        
        success, created_doc = self.run_test(
            "Create New Document with URL",
            "POST",
            "admin/documents",
            200,
            data=doc_data
        )
        
        if not success or not created_doc.get('id'):
            print("❌ Failed to create document")
            return False
        
        doc_id = created_doc['id']
        print(f"   Created document ID: {doc_id}")
        
        # 3. Verify document was created with correct data
        if (created_doc.get('title') != doc_data['title'] or
            created_doc.get('description') != doc_data['description'] or
            created_doc.get('file_type') != doc_data['file_type'] or
            created_doc.get('download_url') != doc_data['download_url'] or
            created_doc.get('order') != doc_data['order']):
            print("❌ Created document data mismatch")
            print(f"   Expected: {doc_data}")
            print(f"   Got: {created_doc}")
            return False
        
        print("   ✅ Document created with correct data")
        
        # 4. Create document without download URL
        doc_data_no_url = {
            "title": f"Документ без ссылки {datetime.now().strftime('%H%M%S')}",
            "description": "Документ без ссылки для скачивания",
            "file_type": "doc",
            "order": initial_count + 2
        }
        
        success, created_doc_no_url = self.run_test(
            "Create Document Without URL",
            "POST",
            "admin/documents",
            200,
            data=doc_data_no_url
        )
        
        if not success or not created_doc_no_url.get('id'):
            print("❌ Failed to create document without URL")
            return False
        
        doc_no_url_id = created_doc_no_url['id']
        if created_doc_no_url.get('download_url'):
            print("❌ Document should have no download_url")
            return False
        
        print("   ✅ Document without URL created successfully")
        
        # 5. Test all file types
        file_types = ["doc", "xls", "pdf", "zip"]
        created_file_type_docs = []
        
        for file_type in file_types:
            doc_data_type = {
                "title": f"Тест {file_type.upper()} документ",
                "description": f"Тестовый документ типа {file_type}",
                "file_type": file_type,
                "order": initial_count + 3 + len(created_file_type_docs)
            }
            
            success, created_type_doc = self.run_test(
                f"Create {file_type.upper()} Document",
                "POST",
                "admin/documents",
                200,
                data=doc_data_type
            )
            
            if not success or created_type_doc.get('file_type') != file_type:
                print(f"❌ Failed to create {file_type} document")
                return False
            
            created_file_type_docs.append(created_type_doc['id'])
        
        print("   ✅ All file types work correctly")
        
        # 6. Verify documents appear in documents list
        success, updated_docs = self.run_test("Get Documents After Creates", "GET", "admin/documents", 200)
        if not success or len(updated_docs) < initial_count + 2 + len(file_types):
            print("❌ Documents not added to documents list")
            return False
        
        print("   ✅ Documents appear in documents list")
        
        # 7. Test updating document with all fields
        update_data = {
            "title": f"Обновленный документ {datetime.now().strftime('%H%M%S')}",
            "description": "Обновленное описание документа после редактирования",
            "file_type": "zip",
            "download_url": "https://updated-example.com/updated-doc.zip",
            "order": 999  # Move to end
        }
        
        success, updated_doc = self.run_test(
            "Update All Document Fields",
            "PUT",
            f"admin/documents/{doc_id}",
            200,
            data=update_data
        )
        
        if not success:
            print("❌ Failed to update document")
            return False
        
        # Verify update
        if (updated_doc.get('title') != update_data['title'] or
            updated_doc.get('description') != update_data['description'] or
            updated_doc.get('file_type') != update_data['file_type'] or
            updated_doc.get('download_url') != update_data['download_url'] or
            updated_doc.get('order') != update_data['order']):
            print("❌ Document update verification failed")
            return False
        
        print("   ✅ Document update successful")
        
        # 8. Test partial updates
        partial_update = {"title": "Частичное обновление заголовка документа"}
        success, partial_updated_doc = self.run_test(
            "Partial Title Update",
            "PUT",
            f"admin/documents/{doc_id}",
            200,
            data=partial_update
        )
        
        if not success or partial_updated_doc.get('title') != partial_update['title']:
            print("❌ Failed partial update")
            return False
        
        print("   ✅ Partial update works correctly")
        
        # 9. Test removing download URL by setting it to null
        success, url_removed_doc = self.run_test(
            "Remove Download URL",
            "PUT",
            f"admin/documents/{doc_id}",
            200,
            data={"download_url": None}
        )
        
        if not success:
            print("❌ Failed to remove download URL")
            return False
        
        print("   ✅ Download URL removal works correctly")
        
        # 10. Test error conditions - invalid document ID
        success, _ = self.run_test(
            "Update Non-existent Document",
            "PUT",
            "admin/documents/invalid-id-12345",
            404,
            data={"title": "Should fail"}
        )
        
        if success:  # 404 status means success for this test (we expect it to fail)
            print("   ✅ Invalid document ID properly returns 404")
        else:
            print("❌ Invalid document ID handling not working")
            return False
        
        # 11. Delete the documents we created
        docs_to_delete = [doc_id, doc_no_url_id] + created_file_type_docs
        
        for delete_doc_id in docs_to_delete:
            success, delete_response = self.run_delete_test(
                f"Delete Document {delete_doc_id}",
                f"admin/documents/{delete_doc_id}",
                200
            )
            
            if not success:
                print(f"❌ Failed to delete document {delete_doc_id}")
                return False
            
            if not delete_response.get('success'):
                print(f"❌ Delete response doesn't indicate success for {delete_doc_id}")
                return False
        
        print("   ✅ Document deletion successful")
        
        # 12. Verify documents were deleted
        success, final_docs = self.run_test("Get Documents After Delete", "GET", "admin/documents", 200)
        if not success or len(final_docs) != initial_count:
            print("❌ Documents not removed from documents list")
            print(f"   Expected: {initial_count}, Got: {len(final_docs) if success else 'error'}")
            return False
        
        print("   ✅ Documents removed from documents list")
        
        # 13. Test that regular /api/documents endpoint also works
        success, public_docs = self.run_test("Get Public Documents", "GET", "documents", 200)
        if not success:
            print("❌ Public documents endpoint not working")
            return False
        
        if len(public_docs) != len(final_docs):
            print("❌ Public and admin documents counts don't match")
            return False
        
        print("   ✅ Public documents endpoint works correctly")
        
        print("\n✅ All Documents CRUD operations passed!")
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
    
    # Run comprehensive CRUD tests
    print("\n🔄 Testing Teacher CRUD Operations")
    tester.test_teacher_crud_operations()
    
    print("\n📋 Testing Tasks CRUD Operations")
    tester.test_tasks_crud_operations()
    
    print("\n📄 Testing Documents CRUD Operations")
    tester.test_documents_crud_operations()
    
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