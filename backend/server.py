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

# ============ Mock Data ============

MOCK_USER = {
    "email": "test@test.ru",
    "password": "test",
    "name": "Иван Семёнов",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Ivan"
}

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

# ============ Routes ============

@api_router.get("/")
async def root():
    return {"message": "Onboarding API"}

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    if request.email == MOCK_USER["email"] and request.password == MOCK_USER["password"]:
        return LoginResponse(
            success=True,
            message="Успешный вход",
            user={
                "email": MOCK_USER["email"],
                "name": MOCK_USER["name"],
                "avatar_url": MOCK_USER["avatar_url"]
            }
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
