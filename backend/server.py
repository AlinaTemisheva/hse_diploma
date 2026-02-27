from fastapi import FastAPI, APIRouter, HTTPException, status
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import secrets
import string

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============ Models ============

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    success: bool
    message: str
    user: Optional[dict] = None
    role: Optional[str] = None

class Task(BaseModel):
    id: str
    title: str
    description: str
    completed: bool = False

class Course(BaseModel):
    id: str
    module_number: int
    title: str
    description: str
    duration: str
    completed: bool = False
    image_url: Optional[str] = None

class Document(BaseModel):
    id: str
    title: str
    description: str
    file_type: str  # doc, xls, pdf, zip
    download_url: Optional[str] = None

class Service(BaseModel):
    id: str
    name: str
    url: str
    icon: str

class TaskToggleRequest(BaseModel):
    completed: bool

# ============ Admin Models ============

class Teacher(BaseModel):
    id: str
    name: str
    email: str
    status: str  # registered, in_progress, completed, blocked
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

class AdminTask(BaseModel):
    id: str
    title: str
    description: str
    order: int

class AdminCourse(BaseModel):
    id: str
    module_number: int
    title: str
    description: str
    duration: str

class AdminDocument(BaseModel):
    id: str
    title: str
    description: str
    file_type: str

# ============ Mock Data ============

# Regular user
MOCK_USER = {
    "email": "test@test.ru",
    "password": "test",
    "name": "Тестов Тест Тестович",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Test",
    "role": "teacher"
}

# Admin user
MOCK_ADMIN = {
    "email": "test_admin@test.ru",
    "password": "test_admin",
    "name": "admin",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
    "role": "admin"
}

# Teachers list (including the regular user as first teacher)
teachers_db = [
    Teacher(
        id="1",
        name="Тестов Тест Тестович",
        email="test@test.ru",
        status="registered",
        avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=Test",
        created_at="2024-01-15"
    )
]

MOCK_TASKS = [
    Task(id="1", title="Заведите страницу преподавателя", description="Что, зачем и где сделать", completed=False),
    Task(id="2", title="Составьте структуру курса в ЛМС", description="Что, зачем и где сделать", completed=False),
    Task(id="3", title="Составьте ведомость", description="Что, зачем и где сделать", completed=False),
    Task(id="4", title="Загрузите материалы курса", description="Что, зачем и где сделать", completed=True),
    Task(id="5", title="Настройте оценивание", description="Что, зачем и где сделать", completed=True),
]

MOCK_COURSES = [
    Course(id="1", module_number=1, title="Основы педагогики высшей школы", 
           description="Узнайте, чем преподавание отличается от выступления на конференции", 
           duration="30 мин", completed=True),
    Course(id="2", module_number=2, title="Работа со студентами поколения Z", 
           description="Как удерживать внимание и выстраивать рабочую динамику в группе", 
           duration="30 мин", completed=True),
    Course(id="3", module_number=3, title="Практико-ориентированное обучение", 
           description="Как превращать реальный бизнес-опыт в сильный учебный инструмент", 
           duration="30 мин", completed=False),
    Course(id="4", module_number=4, title="Оценивание и обратная связь", 
           description="Как оценивать справедливо и профессионально", 
           duration="30 мин", completed=False),
    Course(id="5", module_number=5, title="Выступление в академической среде", 
           description="Как читать лекцию, а не проводить бизнес-презентацию", 
           duration="30 мин", completed=False),
    Course(id="6", module_number=6, title="Цифровая дидактика и работа в LMS", 
           description="Как эффективно выстроить цифровой курс без перегрузки студентов", 
           duration="30 мин", completed=False),
]

MOCK_DOCUMENTS = [
    Document(id="1", title="Шаблон рабочей программы дисциплины (РПД)", 
             description="Структура курса, результаты обучения, тематический план, формы контроля, литература", 
             file_type="doc"),
    Document(id="2", title="Шаблон фонда оценочных средств (ФОС)", 
             description="Оценочные материалы, критерии, шкала перевода баллов в оценку", 
             file_type="doc"),
    Document(id="3", title="Шаблон syllabus (краткая версия для студентов)", 
             description="Описание курса простым языком: цели, формат, дедлайны, правила", 
             file_type="doc"),
    Document(id="4", title="Шаблон экзаменационного билета / итогового задания", 
             description="Формат итоговой аттестации", 
             file_type="doc"),
    Document(id="5", title="Шаблон задания для практической работы", 
             description="Постановка задачи, требования к результату, критерии оценки", 
             file_type="doc"),
    Document(id="6", title="Шаблон формы обратной связи студенту", 
             description="Структурированный письменный фидбек", 
             file_type="doc"),
    Document(id="7", title="Шаблон календарно-тематического плана", 
             description="Расписание занятий с темами, форматами активности и контрольными точками", 
             file_type="xls"),
    Document(id="8", title="Шаблон rubric (матрица оценивания проекта/кейса)", 
             description="Критерии, уровни достижения, дескрипторы", 
             file_type="xls"),
    Document(id="9", title="Памятка по академической честности", 
             description="Политика плагиата, цитирования, ИИ-инструментов", 
             file_type="pdf"),
    Document(id="10", title="Инструкция по работе в LMS", 
             description="Создание курса, загрузка материалов, настройка оценивания, ведомости", 
             file_type="zip"),
]

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

# ============ In-memory state for tasks ============
task_states = {task.id: task.completed for task in MOCK_TASKS}

# ============ Helper Functions ============

def generate_password(length=10):
    """Generate a random password"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

# ============ Routes ============

@api_router.get("/")
async def root():
    return {"message": "Onboarding API"}

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    # Check admin login
    if request.email == MOCK_ADMIN["email"] and request.password == MOCK_ADMIN["password"]:
        return LoginResponse(
            success=True,
            message="Успешный вход",
            user={
                "email": MOCK_ADMIN["email"],
                "name": MOCK_ADMIN["name"],
                "avatar_url": MOCK_ADMIN["avatar_url"]
            },
            role="admin"
        )
    
    # Check regular user login
    if request.email == MOCK_USER["email"] and request.password == MOCK_USER["password"]:
        return LoginResponse(
            success=True,
            message="Успешный вход",
            user={
                "email": MOCK_USER["email"],
                "name": MOCK_USER["name"],
                "avatar_url": MOCK_USER["avatar_url"]
            },
            role="teacher"
        )
    
    # Check if teacher exists in teachers_db
    for teacher in teachers_db:
        if teacher.email == request.email and teacher.password == request.password:
            return LoginResponse(
                success=True,
                message="Успешный вход",
                user={
                    "email": teacher.email,
                    "name": teacher.name,
                    "avatar_url": teacher.avatar_url
                },
                role="teacher"
            )
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Неверный email или пароль"
    )

@api_router.get("/tasks", response_model=List[Task])
async def get_tasks():
    tasks = []
    for task in MOCK_TASKS:
        tasks.append(Task(
            id=task.id,
            title=task.title,
            description=task.description,
            completed=task_states.get(task.id, task.completed)
        ))
    return tasks

@api_router.put("/tasks/{task_id}/toggle")
async def toggle_task(task_id: str, request: TaskToggleRequest):
    if task_id not in task_states:
        raise HTTPException(status_code=404, detail="Task not found")
    task_states[task_id] = request.completed
    return {"success": True, "task_id": task_id, "completed": request.completed}

@api_router.get("/courses", response_model=List[Course])
async def get_courses():
    return MOCK_COURSES

@api_router.get("/documents", response_model=List[Document])
async def get_documents():
    return MOCK_DOCUMENTS

@api_router.get("/services", response_model=List[Service])
async def get_services():
    return MOCK_SERVICES

@api_router.get("/user/stats")
async def get_user_stats():
    completed_tasks = sum(1 for completed in task_states.values() if completed)
    total_tasks = len(MOCK_TASKS)
    completed_courses = sum(1 for course in MOCK_COURSES if course.completed)
    total_courses = len(MOCK_COURSES)
    return {
        "tasks_completed": completed_tasks,
        "tasks_total": total_tasks,
        "courses_completed": completed_courses,
        "courses_total": total_courses
    }

# ============ Admin Routes ============

@api_router.get("/admin/teachers", response_model=List[Teacher])
async def get_teachers():
    return teachers_db

@api_router.post("/admin/teachers", response_model=Teacher)
async def create_teacher(teacher_data: TeacherCreate):
    # Check if email already exists
    for teacher in teachers_db:
        if teacher.email == teacher_data.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Преподаватель с таким email уже существует"
            )
    
    # Generate password
    password = generate_password()
    
    # Create new teacher
    new_teacher = Teacher(
        id=str(uuid.uuid4()),
        name=teacher_data.name,
        email=teacher_data.email,
        status="in_progress",
        avatar_url=f"https://api.dicebear.com/7.x/avataaars/svg?seed={teacher_data.name.replace(' ', '')}",
        password=password,
        created_at=datetime.now(timezone.utc).strftime("%Y-%m-%d")
    )
    
    teachers_db.append(new_teacher)
    
    # Return teacher without password in response (but store it)
    return Teacher(
        id=new_teacher.id,
        name=new_teacher.name,
        email=new_teacher.email,
        status=new_teacher.status,
        avatar_url=new_teacher.avatar_url,
        created_at=new_teacher.created_at
    )

@api_router.delete("/admin/teachers/{teacher_id}")
async def delete_teacher(teacher_id: str):
    global teachers_db
    for i, teacher in enumerate(teachers_db):
        if teacher.id == teacher_id:
            teachers_db.pop(i)
            return {"success": True, "message": "Преподаватель удален"}
    raise HTTPException(status_code=404, detail="Преподаватель не найден")

@api_router.put("/admin/teachers/{teacher_id}/status")
async def update_teacher_status(teacher_id: str, status: str):
    for teacher in teachers_db:
        if teacher.id == teacher_id:
            teacher.status = status
            return {"success": True, "teacher_id": teacher_id, "status": status}
    raise HTTPException(status_code=404, detail="Преподаватель не найден")

@api_router.get("/admin/tasks", response_model=List[Task])
async def get_admin_tasks():
    return MOCK_TASKS

@api_router.get("/admin/courses", response_model=List[Course])
async def get_admin_courses():
    return MOCK_COURSES

@api_router.get("/admin/documents", response_model=List[Document])
async def get_admin_documents():
    return MOCK_DOCUMENTS

@api_router.get("/admin/stats")
async def get_admin_stats():
    return {
        "teachers_count": len(teachers_db),
        "tasks_count": len(MOCK_TASKS),
        "courses_count": len(MOCK_COURSES),
        "documents_count": len(MOCK_DOCUMENTS)
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
