import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { toast } from "sonner";
import { 
  Users, 
  CheckSquare, 
  BookOpen, 
  FileText,
  Plus,
  LogOut,
  X
} from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Menu items
const MENU_ITEMS = [
  { id: "teachers", label: "Преподаватели", icon: Users },
  { id: "tasks", label: "Задачи", icon: CheckSquare },
  { id: "courses", label: "Уроки", icon: BookOpen },
  { id: "documents", label: "Документы", icon: FileText },
];

// Status labels
const STATUS_LABELS = {
  registered: "Зарегистрирован",
  in_progress: "В процессе",
  completed: "Завершено"
};

const STATUS_STYLES = {
  registered: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-50 text-blue-700",
  completed: "bg-gray-900 text-white"
};

export default function AdminDashboardPage({ user, onLogout }) {
  const [activeMenu, setActiveMenu] = useState("teachers");
  const [teachers, setTeachers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ name: "", email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [teachersRes, tasksRes, coursesRes, docsRes] = await Promise.all([
        axios.get(`${API}/admin/teachers`),
        axios.get(`${API}/admin/tasks`),
        axios.get(`${API}/admin/courses`),
        axios.get(`${API}/admin/documents`)
      ]);
      
      setTeachers(teachersRes.data);
      setTasks(tasksRes.data);
      setCourses(coursesRes.data);
      setDocuments(docsRes.data);
    } catch (error) {
      toast.error("Ошибка загрузки данных");
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTeacher = async () => {
    if (!newTeacher.name.trim() || !newTeacher.email.trim()) {
      toast.error("Заполните все поля");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(`${API}/admin/teachers`, newTeacher);
      setTeachers([...teachers, response.data]);
      setNewTeacher({ name: "", email: "" });
      setIsSheetOpen(false);
      toast.success("Преподаватель добавлен");
    } catch (error) {
      const message = error.response?.data?.detail || "Ошибка добавления";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name.substring(0, 2).toUpperCase();
  };

  const renderContent = () => {
    switch (activeMenu) {
      case "teachers":
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900 font-heading">Преподаватели</h1>
              <Button 
                onClick={() => setIsSheetOpen(true)}
                className="bg-[#1B318E] hover:bg-[#152570] text-white"
                data-testid="add-teacher-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить преподавателя
              </Button>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">ФИО</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">
                      Email <span className="text-gray-400">↑↓</span>
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((teacher) => (
                    <tr key={teacher.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50" data-testid={`teacher-row-${teacher.id}`}>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {teacher.avatar_url ? (
                            <img 
                              src={teacher.avatar_url} 
                              alt={teacher.name}
                              className="w-10 h-10 rounded-full bg-gray-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                              {getInitials(teacher.name)}
                            </div>
                          )}
                          <span className="font-medium text-gray-900">{teacher.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-600">{teacher.email}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${STATUS_STYLES[teacher.status] || STATUS_STYLES.in_progress}`}>
                          {STATUS_LABELS[teacher.status] || teacher.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      
      case "tasks":
        return (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6 font-heading">Задачи</h1>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">№</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Название</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Описание</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task, index) => (
                    <tr key={task.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <td className="py-4 px-6 text-gray-500">{index + 1}</td>
                      <td className="py-4 px-6 font-medium text-gray-900">{task.title}</td>
                      <td className="py-4 px-6 text-gray-600">{task.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      
      case "courses":
        return (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6 font-heading">Уроки</h1>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Модуль</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Название</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Длительность</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <td className="py-4 px-6 text-gray-500">{course.module_number}</td>
                      <td className="py-4 px-6 font-medium text-gray-900">{course.title}</td>
                      <td className="py-4 px-6 text-gray-600">{course.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      
      case "documents":
        return (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6 font-heading">Документы</h1>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Тип</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Название</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Описание</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <span className="uppercase text-xs font-semibold px-2 py-1 rounded bg-gray-100 text-gray-600">
                          {doc.file_type}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-900">{doc.title}</td>
                      <td className="py-4 px-6 text-gray-600 text-sm">{doc.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white flex" data-testid="admin-dashboard">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 flex flex-col">
        {/* Logo & User */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1B318E] flex items-center justify-center">
              <span className="text-white text-lg font-bold">В</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>
        
        {/* Menu */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveMenu(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      isActive 
                        ? "bg-gray-100 text-gray-900 font-medium" 
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                    data-testid={`menu-${item.id}`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            data-testid="admin-logout-btn"
          >
            <LogOut className="w-5 h-5" />
            Выйти
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 bg-[#FAFAFA]">
        {renderContent()}
      </main>

      {/* Add Teacher Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-md flex flex-col">
          <SheetHeader className="flex-row items-center justify-between space-y-0 pb-6">
            <SheetTitle className="text-xl font-semibold">Добавление преподавателя</SheetTitle>
            <button 
              onClick={() => setIsSheetOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </SheetHeader>
          
          <div className="flex-1 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="teacher-name" className="text-base font-medium">ФИО</Label>
              <Input
                id="teacher-name"
                value={newTeacher.name}
                onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                className="h-12 rounded-lg border-gray-200"
                placeholder="Иванов Иван Иванович"
                data-testid="teacher-name-input"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="teacher-email" className="text-base font-medium">Email</Label>
              <Input
                id="teacher-email"
                type="email"
                value={newTeacher.email}
                onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                className="h-12 rounded-lg border-gray-200"
                placeholder="email@hse.ru"
                data-testid="teacher-email-input"
              />
              <p className="text-sm text-gray-500 leading-relaxed">
                Пароль от личного кабинета будет сформирован автоматически и отправлен на почту в приглашении
              </p>
            </div>
          </div>

          <SheetFooter className="flex-col gap-3 mt-auto pt-6">
            <Button
              onClick={handleAddTeacher}
              disabled={isSubmitting}
              className="w-full h-12 bg-[#1B318E] hover:bg-[#152570] text-white rounded-lg"
              data-testid="save-teacher-btn"
            >
              {isSubmitting ? "Сохранение..." : "Сохранить"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsSheetOpen(false)}
              className="w-full h-12 rounded-lg border-gray-200"
              data-testid="close-sheet-btn"
            >
              Закрыть
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
