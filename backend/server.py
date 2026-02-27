from fastapi import FastAPI, APIRouter, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import secrets
import string
import shutil

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Upload directory
UPLOAD_DIR = ROOT_DIR.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
ALLOWED_DOC_EXTENSIONS = {".doc", ".docx", ".xls", ".xlsx", ".pdf", ".zip", ".ppt", ".pptx"}

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============ Pydantic Models ============

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    success: bool
    message: str
    user: Optional[dict] = None
    role: Optional[str] = None
    user_id: Optional[str] = None

class Task(BaseModel):
    id: str
    title: str
    description: str
    order: int = 0
    completed: bool = False

class TaskCreate(BaseModel):
    title: str
    description: str
    order: int = 0

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None

class Document(BaseModel):
    id: str
    title: str
    description: str
    file_type: str
    download_url: Optional[str] = None
    order: int = 0

class DocumentCreate(BaseModel):
    title: str
    description: str
    file_type: str = "doc"
    download_url: Optional[str] = None
    order: int = 0

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    file_type: Optional[str] = None
    download_url: Optional[str] = None
    order: Optional[int] = None

class Service(BaseModel):
    id: str
    name: str
    url: str
    icon: str

class TaskToggleRequest(BaseModel):
    completed: bool

class Teacher(BaseModel):
    id: str
    name: str
    email: str
    status: str
    avatar_url: Optional[str] = None
    password: Optional[str] = None
    created_at: Optional[str] = None

class TeacherCreate(BaseModel):
    name: str
    email: str
    avatar_url: Optional[str] = None

class TeacherUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    status: Optional[str] = None
    avatar_url: Optional[str] = None

class Lesson(BaseModel):
    id: str
    module_id: str
    title: str
    description: str
    content: str
    duration_minutes: int = 30
    order: int = 1

class LessonCreate(BaseModel):
    module_id: str
    title: str
    description: str = ""
    content: str = ""
    duration_minutes: int = 30
    order: int = 1

class LessonUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    duration_minutes: Optional[int] = None
    order: Optional[int] = None

class Module(BaseModel):
    id: str
    title: str
    description: str
    order: int = 1
    lessons_count: int = 0

class ModuleCreate(BaseModel):
    title: str
    description: str = ""
    order: int = 1

class ModuleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None

class LessonProgress(BaseModel):
    id: str
    user_id: str
    lesson_id: str
    status: str  # not_started, in_progress, completed
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    content_snapshot: Optional[str] = None  # Saved content at completion time

class LessonProgressUpdate(BaseModel):
    status: str  # not_started, in_progress, completed

class LessonWithProgress(BaseModel):
    id: str
    module_id: str
    title: str
    description: str
    content: str
    duration_minutes: int
    order: int
    progress_status: str = "not_started"
    completed_at: Optional[str] = None

# ============ Static Data ============

MOCK_SERVICES = [
    Service(id="1", name="Сайт Вышки", url="https://hse.ru", icon="globe"),
    Service(id="2", name="Почта", url="https://mail.hse.ru", icon="mail"),
    Service(id="3", name="LMS", url="https://lms.hse.ru", icon="graduation-cap"),
    Service(id="4", name="Расписание", url="https://schedule.hse.ru", icon="calendar"),
    Service(id="5", name="Библиотека", url="https://library.hse.ru", icon="book-open"),
    Service(id="6", name="HR-портал", url="https://hr.hse.ru", icon="users"),
    Service(id="7", name="Справочник", url="https://contacts.hse.ru", icon="phone"),
    Service(id="8", name="Wiki", url="https://wiki.hse.ru", icon="file-text"),
]

# Admin credentials (hardcoded)
ADMIN_EMAIL = "test_admin@test.ru"
ADMIN_PASSWORD = "test_admin"
ADMIN_NAME = "admin"

# ============ Helper Functions ============

def generate_password(length=10):
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def serialize_doc(doc: dict) -> dict:
    """Remove MongoDB _id from document"""
    if doc and "_id" in doc:
        del doc["_id"]
    return doc

async def get_lessons_count(module_id: str) -> int:
    """Count lessons in a module"""
    return await db.lessons.count_documents({"module_id": module_id})

# ============ Database Initialization ============

async def init_db():
    """Initialize database with seed data if empty"""
    
    # Check if teachers collection is empty
    teachers_count = await db.teachers.count_documents({})
    if teachers_count == 0:
        logger.info("Initializing teachers collection...")
        await db.teachers.insert_many([
            {
                "id": "1",
                "name": "Тестов Тест Тестович",
                "email": "test@test.ru",
                "password": "test",
                "status": "registered",
                "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Test",
                "created_at": "2024-01-15"
            }
        ])
    
    # Check if tasks collection is empty
    tasks_count = await db.tasks.count_documents({})
    if tasks_count == 0:
        logger.info("Initializing tasks collection...")
        await db.tasks.insert_many([
            {"id": "1", "title": "Заведите страницу преподавателя", "description": "Что, зачем и где сделать", "order": 1},
            {"id": "2", "title": "Составьте структуру курса в ЛМС", "description": "Что, зачем и где сделать", "order": 2},
            {"id": "3", "title": "Составьте ведомость", "description": "Что, зачем и где сделать", "order": 3},
            {"id": "4", "title": "Загрузите материалы курса", "description": "Что, зачем и где сделать", "order": 4},
            {"id": "5", "title": "Настройте оценивание", "description": "Что, зачем и где сделать", "order": 5},
        ])
    
    # Check if documents collection is empty
    docs_count = await db.documents.count_documents({})
    if docs_count == 0:
        logger.info("Initializing documents collection...")
        await db.documents.insert_many([
            {"id": "1", "title": "Шаблон рабочей программы дисциплины (РПД)", "description": "Структура курса, результаты обучения, тематический план", "file_type": "doc", "order": 1, "download_url": "https://docs.google.com/document/d/example1"},
            {"id": "2", "title": "Шаблон фонда оценочных средств (ФОС)", "description": "Оценочные материалы, критерии, шкала перевода баллов", "file_type": "doc", "order": 2, "download_url": "https://docs.google.com/document/d/example2"},
            {"id": "3", "title": "Шаблон syllabus (краткая версия для студентов)", "description": "Описание курса простым языком: цели, формат, дедлайны", "file_type": "doc", "order": 3},
            {"id": "4", "title": "Шаблон экзаменационного билета", "description": "Формат итоговой аттестации", "file_type": "doc", "order": 4},
            {"id": "5", "title": "Шаблон задания для практической работы", "description": "Постановка задачи, требования к результату", "file_type": "doc", "order": 5},
            {"id": "6", "title": "Шаблон формы обратной связи студенту", "description": "Структурированный письменный фидбек", "file_type": "doc", "order": 6},
            {"id": "7", "title": "Шаблон календарно-тематического плана", "description": "Расписание занятий с темами", "file_type": "xls", "order": 7},
            {"id": "8", "title": "Шаблон rubric (матрица оценивания)", "description": "Критерии, уровни достижения, дескрипторы", "file_type": "xls", "order": 8},
            {"id": "9", "title": "Памятка по академической честности", "description": "Политика плагиата, цитирования, ИИ-инструментов", "file_type": "pdf", "order": 9},
            {"id": "10", "title": "Инструкция по работе в LMS", "description": "Создание курса, загрузка материалов", "file_type": "zip", "order": 10},
        ])
    
    # Check if modules collection is empty
    modules_count = await db.modules.count_documents({})
    if modules_count == 0:
        logger.info("Initializing modules collection...")
        await db.modules.insert_many([
            {"id": "1", "title": "Основы педагогики высшей школы", "description": "Узнайте, чем преподавание отличается от выступления на конференции", "order": 1},
            {"id": "2", "title": "Работа со студентами поколения Z", "description": "Как удерживать внимание и выстраивать рабочую динамику в группе", "order": 2},
            {"id": "3", "title": "Практико-ориентированное обучение", "description": "Как превращать реальный бизнес-опыт в сильный учебный инструмент", "order": 3},
        ])
    
    # Check if lessons collection is empty
    lessons_count = await db.lessons.count_documents({})
    if lessons_count == 0:
        logger.info("Initializing lessons collection...")
        await db.lessons.insert_many([
            {
                "id": "1",
                "module_id": "1",
                "title": "Введение в педагогику",
                "description": "Основные понятия и принципы педагогики высшей школы",
                "content": "<h2>Введение</h2><p>Педагогика высшей школы — это наука о воспитании, обучении и образовании студентов.</p><h3>Ключевые понятия</h3><ul><li>Дидактика — теория обучения</li><li>Методика — способы преподавания</li><li>Компетенции — результаты обучения</li></ul>",
                "duration_minutes": 30,
                "order": 1
            },
            {
                "id": "2",
                "module_id": "1",
                "title": "Методы активного обучения",
                "description": "Современные подходы к вовлечению студентов",
                "content": "<h2>Методы активного обучения</h2><p>Активное обучение предполагает вовлечение студентов в процесс познания.</p><h3>Примеры методов</h3><ol><li>Дискуссии и дебаты</li><li>Кейс-метод</li><li>Проектное обучение</li><li>Групповая работа</li></ol>",
                "duration_minutes": 45,
                "order": 2
            },
            {
                "id": "3",
                "module_id": "2",
                "title": "Особенности поколения Z",
                "description": "Понимание современных студентов",
                "content": "<h2>Поколение Z</h2><p>Студенты поколения Z родились после 1997 года.</p><h3>Особенности</h3><ul><li>Визуальное восприятие информации</li><li>Многозадачность</li><li>Короткий фокус внимания</li><li>Ценят практическую применимость</li></ul>",
                "duration_minutes": 25,
                "order": 1
            },
        ])
    
    logger.info("Database initialization complete")

# ============ Routes ============

@api_router.get("/")
async def root():
    return {"message": "Onboarding API"}

# ============ File Upload Routes ============

@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), file_type: str = "image"):
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Файл слишком большой. Максимальный размер: {MAX_FILE_SIZE // (1024*1024)} МБ"
        )
    
    original_filename = file.filename or "file"
    file_ext = Path(original_filename).suffix.lower()
    
    if file_type == "image":
        if file_ext not in ALLOWED_IMAGE_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Недопустимый формат изображения. Разрешены: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}"
            )
    elif file_type == "document":
        if file_ext not in ALLOWED_DOC_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Недопустимый формат документа. Разрешены: {', '.join(ALLOWED_DOC_EXTENSIONS)}"
            )
    
    unique_id = str(uuid.uuid4())[:8]
    safe_filename = f"{unique_id}{file_ext}"
    file_path = UPLOAD_DIR / safe_filename
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка сохранения файла: {str(e)}"
        )
    
    return {
        "url": f"/api/uploads/{safe_filename}",
        "filename": safe_filename,
        "original_name": original_filename,
        "size": file_size
    }

@api_router.get("/uploads/{filename}")
async def get_uploaded_file(filename: str):
    file_path = UPLOAD_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Файл не найден")
    
    if not file_path.resolve().parent == UPLOAD_DIR.resolve():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ запрещён")
    
    return FileResponse(file_path)

# ============ Auth Routes ============

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    # Check admin login
    if request.email == ADMIN_EMAIL and request.password == ADMIN_PASSWORD:
        return LoginResponse(
            success=True,
            message="Успешный вход",
            user={"email": ADMIN_EMAIL, "name": ADMIN_NAME, "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"},
            role="admin",
            user_id="admin"
        )
    
    # Check teacher login from database
    teacher = await db.teachers.find_one({"email": request.email, "password": request.password}, {"_id": 0})
    if teacher:
        return LoginResponse(
            success=True,
            message="Успешный вход",
            user={"email": teacher["email"], "name": teacher["name"], "avatar_url": teacher.get("avatar_url")},
            role="teacher",
            user_id=teacher["id"]
        )
    
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный email или пароль")

@api_router.get("/auth/me")
async def get_current_user():
    return {"email": "test@test.ru", "name": "Тестов Тест Тестович"}

# ============ Teacher Dashboard Routes ============

@api_router.get("/tasks")
async def get_tasks(user_id: str = "1"):
    tasks = await db.tasks.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    
    # Get task states for user
    task_states = await db.task_states.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    completed_tasks = {ts["task_id"]: ts["completed"] for ts in task_states}
    
    for task in tasks:
        task["completed"] = completed_tasks.get(task["id"], False)
    
    return tasks

@api_router.put("/tasks/{task_id}/toggle")
async def toggle_task(task_id: str, request: TaskToggleRequest, user_id: str = "1"):
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    
    # Update or insert task state for user
    await db.task_states.update_one(
        {"user_id": user_id, "task_id": task_id},
        {"$set": {"completed": request.completed}},
        upsert=True
    )
    
    task["completed"] = request.completed
    return task

@api_router.get("/documents")
async def get_documents():
    docs = await db.documents.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return docs

@api_router.get("/services")
async def get_services():
    return MOCK_SERVICES

@api_router.get("/courses")
async def get_courses():
    # Return modules as courses for backward compatibility
    modules = await db.modules.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    courses = []
    for m in modules:
        lessons_count = await get_lessons_count(m["id"])
        courses.append({
            "id": m["id"],
            "module_number": m["order"],
            "title": m["title"],
            "description": m["description"],
            "duration": f"{lessons_count * 30} мин",
            "completed": False
        })
    return courses

@api_router.get("/user/stats")
async def get_user_stats(user_id: str = "1"):
    # Get task stats
    total_tasks = await db.tasks.count_documents({})
    completed_tasks = await db.task_states.count_documents({"user_id": user_id, "completed": True})
    
    # Get lesson stats
    total_lessons = await db.lessons.count_documents({})
    completed_lessons = await db.lesson_progress.count_documents({"user_id": user_id, "status": "completed"})
    
    return {
        "tasks_completed": completed_tasks,
        "tasks_total": total_tasks,
        "courses_completed": completed_lessons,
        "courses_total": total_lessons
    }

# ============ Module Routes (Public) ============

@api_router.get("/modules")
async def get_modules():
    modules = await db.modules.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    result = []
    for m in modules:
        lessons_count = await get_lessons_count(m["id"])
        result.append({
            **m,
            "lessons_count": lessons_count
        })
    return result

@api_router.get("/modules/{module_id}/lessons")
async def get_module_lessons(module_id: str, user_id: str = "1"):
    module = await db.modules.find_one({"id": module_id}, {"_id": 0})
    if not module:
        raise HTTPException(status_code=404, detail="Модуль не найден")
    
    lessons = await db.lessons.find({"module_id": module_id}, {"_id": 0}).sort("order", 1).to_list(100)
    
    # Get progress for each lesson
    result = []
    for lesson in lessons:
        progress = await db.lesson_progress.find_one(
            {"user_id": user_id, "lesson_id": lesson["id"]},
            {"_id": 0}
        )
        
        result.append({
            **lesson,
            "progress_status": progress["status"] if progress else "not_started",
            "completed_at": progress.get("completed_at") if progress else None
        })
    
    return result

@api_router.get("/lessons/{lesson_id}")
async def get_lesson(lesson_id: str, user_id: str = "1"):
    """Get lesson content - returns saved snapshot if completed, otherwise current content"""
    lesson = await db.lessons.find_one({"id": lesson_id}, {"_id": 0})
    if not lesson:
        raise HTTPException(status_code=404, detail="Урок не найден")
    
    # Check if user has completed this lesson
    progress = await db.lesson_progress.find_one(
        {"user_id": user_id, "lesson_id": lesson_id},
        {"_id": 0}
    )
    
    if progress and progress.get("status") == "completed" and progress.get("content_snapshot"):
        # Return saved content snapshot for completed lessons
        lesson["content"] = progress["content_snapshot"]
        lesson["progress_status"] = "completed"
        lesson["completed_at"] = progress.get("completed_at")
        lesson["is_snapshot"] = True
    else:
        # Return current content for incomplete lessons
        lesson["progress_status"] = progress["status"] if progress else "not_started"
        lesson["is_snapshot"] = False
    
    return lesson

@api_router.put("/lessons/{lesson_id}/progress")
async def update_lesson_progress(lesson_id: str, request: LessonProgressUpdate, user_id: str = "1"):
    """Update lesson progress. When completing, save content snapshot."""
    lesson = await db.lessons.find_one({"id": lesson_id}, {"_id": 0})
    if not lesson:
        raise HTTPException(status_code=404, detail="Урок не найден")
    
    now = datetime.now(timezone.utc).isoformat()
    
    update_data = {
        "user_id": user_id,
        "lesson_id": lesson_id,
        "status": request.status
    }
    
    if request.status == "in_progress":
        # Check if already started
        existing = await db.lesson_progress.find_one({"user_id": user_id, "lesson_id": lesson_id})
        if not existing:
            update_data["started_at"] = now
    
    elif request.status == "completed":
        # Save content snapshot when completing
        update_data["completed_at"] = now
        update_data["content_snapshot"] = lesson["content"]
    
    await db.lesson_progress.update_one(
        {"user_id": user_id, "lesson_id": lesson_id},
        {"$set": update_data},
        upsert=True
    )
    
    return {
        "success": True,
        "lesson_id": lesson_id,
        "status": request.status,
        "content_snapshot_saved": request.status == "completed"
    }

# ============ Admin Routes ============

@api_router.get("/admin/stats")
async def get_admin_stats():
    return {
        "teachers_count": await db.teachers.count_documents({}),
        "tasks_count": await db.tasks.count_documents({}),
        "documents_count": await db.documents.count_documents({}),
        "modules_count": await db.modules.count_documents({}),
        "lessons_count": await db.lessons.count_documents({})
    }

# Teachers CRUD
@api_router.get("/admin/teachers")
async def get_teachers():
    teachers = await db.teachers.find({}, {"_id": 0, "password": 0}).to_list(100)
    return teachers

@api_router.post("/admin/teachers")
async def create_teacher(teacher_data: TeacherCreate):
    # Check email uniqueness
    existing = await db.teachers.find_one({"email": teacher_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Пользователь с таким email уже существует")
    
    new_id = str(uuid.uuid4())
    password = generate_password()
    
    teacher = {
        "id": new_id,
        "name": teacher_data.name,
        "email": teacher_data.email,
        "password": password,
        "status": "registered",
        "avatar_url": teacher_data.avatar_url or f"https://api.dicebear.com/7.x/avataaars/svg?seed={new_id}",
        "created_at": datetime.now(timezone.utc).strftime("%Y-%m-%d")
    }
    
    await db.teachers.insert_one(teacher)
    del teacher["_id"]
    
    return {**teacher, "generated_password": password}

@api_router.put("/admin/teachers/{teacher_id}")
async def update_teacher(teacher_id: str, teacher_data: TeacherUpdate):
    teacher = await db.teachers.find_one({"id": teacher_id})
    if not teacher:
        raise HTTPException(status_code=404, detail="Преподаватель не найден")
    
    update = {}
    if teacher_data.name is not None:
        update["name"] = teacher_data.name
    if teacher_data.email is not None:
        update["email"] = teacher_data.email
    if teacher_data.status is not None:
        update["status"] = teacher_data.status
    if teacher_data.avatar_url is not None:
        update["avatar_url"] = teacher_data.avatar_url
    
    if update:
        await db.teachers.update_one({"id": teacher_id}, {"$set": update})
    
    updated = await db.teachers.find_one({"id": teacher_id}, {"_id": 0, "password": 0})
    return updated

# Tasks CRUD
@api_router.get("/admin/tasks")
async def get_admin_tasks():
    tasks = await db.tasks.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return tasks

@api_router.post("/admin/tasks")
async def create_task(task_data: TaskCreate):
    new_id = str(uuid.uuid4())
    count = await db.tasks.count_documents({})
    
    task = {
        "id": new_id,
        "title": task_data.title,
        "description": task_data.description,
        "order": task_data.order if task_data.order > 0 else count + 1
    }
    
    await db.tasks.insert_one(task)
    del task["_id"]
    return task

@api_router.put("/admin/tasks/{task_id}")
async def update_task(task_id: str, task_data: TaskUpdate):
    task = await db.tasks.find_one({"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    
    update = {}
    if task_data.title is not None:
        update["title"] = task_data.title
    if task_data.description is not None:
        update["description"] = task_data.description
    if task_data.order is not None:
        update["order"] = task_data.order
    
    if update:
        await db.tasks.update_one({"id": task_id}, {"$set": update})
    
    updated = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    return updated

@api_router.delete("/admin/tasks/{task_id}")
async def delete_task(task_id: str):
    result = await db.tasks.delete_one({"id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    
    # Also delete task states
    await db.task_states.delete_many({"task_id": task_id})
    
    return {"success": True, "message": "Задача удалена"}

# Documents CRUD
@api_router.get("/admin/documents")
async def get_admin_documents():
    docs = await db.documents.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return docs

@api_router.post("/admin/documents")
async def create_document(doc_data: DocumentCreate):
    new_id = str(uuid.uuid4())
    count = await db.documents.count_documents({})
    
    doc = {
        "id": new_id,
        "title": doc_data.title,
        "description": doc_data.description,
        "file_type": doc_data.file_type,
        "download_url": doc_data.download_url,
        "order": doc_data.order if doc_data.order > 0 else count + 1
    }
    
    await db.documents.insert_one(doc)
    del doc["_id"]
    return doc

@api_router.put("/admin/documents/{doc_id}")
async def update_document(doc_id: str, doc_data: DocumentUpdate):
    doc = await db.documents.find_one({"id": doc_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Документ не найден")
    
    update = {}
    if doc_data.title is not None:
        update["title"] = doc_data.title
    if doc_data.description is not None:
        update["description"] = doc_data.description
    if doc_data.file_type is not None:
        update["file_type"] = doc_data.file_type
    if doc_data.download_url is not None:
        update["download_url"] = doc_data.download_url
    if doc_data.order is not None:
        update["order"] = doc_data.order
    
    if update:
        await db.documents.update_one({"id": doc_id}, {"$set": update})
    
    updated = await db.documents.find_one({"id": doc_id}, {"_id": 0})
    return updated

@api_router.delete("/admin/documents/{doc_id}")
async def delete_document(doc_id: str):
    result = await db.documents.delete_one({"id": doc_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Документ не найден")
    return {"success": True, "message": "Документ удалён"}

# Courses (for backward compatibility)
@api_router.get("/admin/courses")
async def get_admin_courses():
    modules = await db.modules.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    courses = []
    for m in modules:
        lessons_count = await get_lessons_count(m["id"])
        courses.append({
            "id": m["id"],
            "module_number": m["order"],
            "title": m["title"],
            "description": m["description"],
            "duration": f"{lessons_count * 30} мин"
        })
    return courses

# Modules CRUD
@api_router.get("/admin/modules")
async def get_admin_modules():
    modules = await db.modules.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    result = []
    for m in modules:
        lessons_count = await get_lessons_count(m["id"])
        result.append({**m, "lessons_count": lessons_count})
    return result

@api_router.post("/admin/modules")
async def create_module(module_data: ModuleCreate):
    new_id = str(uuid.uuid4())
    count = await db.modules.count_documents({})
    
    module = {
        "id": new_id,
        "title": module_data.title,
        "description": module_data.description,
        "order": module_data.order if module_data.order > 0 else count + 1
    }
    
    await db.modules.insert_one(module)
    del module["_id"]
    module["lessons_count"] = 0
    return module

@api_router.put("/admin/modules/{module_id}")
async def update_module(module_id: str, module_data: ModuleUpdate):
    module = await db.modules.find_one({"id": module_id})
    if not module:
        raise HTTPException(status_code=404, detail="Модуль не найден")
    
    update = {}
    if module_data.title is not None:
        update["title"] = module_data.title
    if module_data.description is not None:
        update["description"] = module_data.description
    if module_data.order is not None:
        update["order"] = module_data.order
    
    if update:
        await db.modules.update_one({"id": module_id}, {"$set": update})
    
    updated = await db.modules.find_one({"id": module_id}, {"_id": 0})
    lessons_count = await get_lessons_count(module_id)
    return {**updated, "lessons_count": lessons_count}

@api_router.delete("/admin/modules/{module_id}")
async def delete_module(module_id: str):
    result = await db.modules.delete_one({"id": module_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Модуль не найден")
    
    # Delete all lessons in module
    await db.lessons.delete_many({"module_id": module_id})
    # Delete progress for lessons in this module
    lessons = await db.lessons.find({"module_id": module_id}, {"id": 1}).to_list(100)
    lesson_ids = [l["id"] for l in lessons]
    if lesson_ids:
        await db.lesson_progress.delete_many({"lesson_id": {"$in": lesson_ids}})
    
    return {"success": True, "message": "Модуль и все его уроки удалены"}

# Lessons CRUD
@api_router.get("/admin/modules/{module_id}/lessons")
async def get_admin_module_lessons(module_id: str):
    module = await db.modules.find_one({"id": module_id})
    if not module:
        raise HTTPException(status_code=404, detail="Модуль не найден")
    
    lessons = await db.lessons.find({"module_id": module_id}, {"_id": 0}).sort("order", 1).to_list(100)
    return lessons

@api_router.get("/admin/lessons/{lesson_id}")
async def get_admin_lesson(lesson_id: str):
    lesson = await db.lessons.find_one({"id": lesson_id}, {"_id": 0})
    if not lesson:
        raise HTTPException(status_code=404, detail="Урок не найден")
    return lesson

@api_router.post("/admin/lessons")
async def create_lesson(lesson_data: LessonCreate):
    module = await db.modules.find_one({"id": lesson_data.module_id})
    if not module:
        raise HTTPException(status_code=404, detail="Модуль не найден")
    
    new_id = str(uuid.uuid4())
    count = await db.lessons.count_documents({"module_id": lesson_data.module_id})
    
    lesson = {
        "id": new_id,
        "module_id": lesson_data.module_id,
        "title": lesson_data.title,
        "description": lesson_data.description,
        "content": lesson_data.content,
        "duration_minutes": lesson_data.duration_minutes,
        "order": lesson_data.order if lesson_data.order > 0 else count + 1
    }
    
    await db.lessons.insert_one(lesson)
    del lesson["_id"]
    return lesson

@api_router.put("/admin/lessons/{lesson_id}")
async def update_lesson(lesson_id: str, lesson_data: LessonUpdate):
    lesson = await db.lessons.find_one({"id": lesson_id})
    if not lesson:
        raise HTTPException(status_code=404, detail="Урок не найден")
    
    update = {}
    if lesson_data.title is not None:
        update["title"] = lesson_data.title
    if lesson_data.description is not None:
        update["description"] = lesson_data.description
    if lesson_data.content is not None:
        update["content"] = lesson_data.content
    if lesson_data.duration_minutes is not None:
        update["duration_minutes"] = lesson_data.duration_minutes
    if lesson_data.order is not None:
        update["order"] = lesson_data.order
    
    if update:
        await db.lessons.update_one({"id": lesson_id}, {"$set": update})
    
    updated = await db.lessons.find_one({"id": lesson_id}, {"_id": 0})
    return updated

@api_router.delete("/admin/lessons/{lesson_id}")
async def delete_lesson(lesson_id: str):
    result = await db.lessons.delete_one({"id": lesson_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Урок не найден")
    
    # Delete progress
    await db.lesson_progress.delete_many({"lesson_id": lesson_id})
    
    return {"success": True, "message": "Урок удалён"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    await init_db()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
