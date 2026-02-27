import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Users, 
  CheckSquare, 
  BookOpen, 
  FileText,
  Plus,
  LogOut,
  X,
  Upload,
  Check
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

// Status options
const STATUS_OPTIONS = [
  { value: "registered", label: "Зарегистрирован" },
  { value: "in_progress", label: "В процессе" },
  { value: "completed", label: "Завершено обучение" },
  { value: "blocked", label: "Заблокирован" },
];

// Status labels and styles
const STATUS_LABELS = {
  registered: "Зарегистрирован",
  in_progress: "В процессе",
  completed: "Завершено обучение",
  blocked: "Заблокирован"
};

const STATUS_STYLES = {
  registered: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-50 text-blue-700",
  completed: "bg-green-50 text-green-700",
  blocked: "bg-red-50 text-red-700"
};

// Avatar options for selection
const AVATAR_OPTIONS = [
  { id: 1, url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" },
  { id: 2, url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" },
  { id: 3, url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Max" },
  { id: 4, url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna" },
  { id: 5, url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Leo" },
  { id: 6, url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie" },
  { id: 7, url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver" },
  { id: 8, url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma" },
  { id: 9, url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jack" },
  { id: 10, url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mia" },
  { id: 11, url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Noah" },
  { id: 12, url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ava" },
];

export default function AdminDashboardPage({ user, onLogout }) {
  const [activeMenu, setActiveMenu] = useState("teachers");
  const [teachers, setTeachers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Sheet states
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    status: "in_progress",
    avatar_url: "" 
  });
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
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

  const openCreateSheet = () => {
    setIsEditMode(false);
    setEditingTeacher(null);
    setFormData({ name: "", email: "", status: "in_progress", avatar_url: "" });
    setSelectedAvatar(null);
    setCustomAvatarUrl("");
    setIsSheetOpen(true);
  };

  const openEditSheet = (teacher) => {
    setIsEditMode(true);
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name,
      email: teacher.email,
      status: teacher.status,
      avatar_url: teacher.avatar_url
    });
    // Check if current avatar is in options
    const existingAvatar = AVATAR_OPTIONS.find(a => a.url === teacher.avatar_url);
    if (existingAvatar) {
      setSelectedAvatar(existingAvatar.id);
      setCustomAvatarUrl("");
    } else {
      setSelectedAvatar(null);
      setCustomAvatarUrl(teacher.avatar_url || "");
    }
    setIsSheetOpen(true);
  };

  const closeSheet = () => {
    setIsSheetOpen(false);
    setIsEditMode(false);
    setEditingTeacher(null);
    setFormData({ name: "", email: "", status: "in_progress", avatar_url: "" });
    setSelectedAvatar(null);
    setCustomAvatarUrl("");
  };

  const getAvatarUrl = () => {
    if (selectedAvatar) {
      return AVATAR_OPTIONS.find(a => a.id === selectedAvatar)?.url || "";
    }
    if (customAvatarUrl) {
      return customAvatarUrl;
    }
    return "";
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Заполните все обязательные поля");
      return;
    }

    setIsSubmitting(true);
    const avatarUrl = getAvatarUrl();

    try {
      if (isEditMode && editingTeacher) {
        // Update existing teacher
        const response = await axios.put(`${API}/admin/teachers/${editingTeacher.id}`, {
          name: formData.name,
          email: formData.email,
          status: formData.status,
          avatar_url: avatarUrl || undefined
        });
        
        setTeachers(teachers.map(t => 
          t.id === editingTeacher.id ? response.data : t
        ));
        toast.success("Преподаватель обновлён");
      } else {
        // Create new teacher
        const response = await axios.post(`${API}/admin/teachers`, {
          name: formData.name,
          email: formData.email,
          avatar_url: avatarUrl || undefined
        });
        setTeachers([...teachers, response.data]);
        toast.success("Преподаватель добавлен");
      }
      closeSheet();
    } catch (error) {
      const message = error.response?.data?.detail || "Ошибка сохранения";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // For demo, we'll create a data URL. In production, you'd upload to server
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomAvatarUrl(event.target?.result);
        setSelectedAvatar(null);
      };
      reader.readAsDataURL(file);
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
                onClick={openCreateSheet}
                className="bg-[#1B318E] hover:bg-[#152570] text-white px-6"
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
                    <tr 
                      key={teacher.id} 
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors" 
                      onClick={() => openEditSheet(teacher)}
                      data-testid={`teacher-row-${teacher.id}`}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {teacher.avatar_url ? (
                            <img 
                              src={teacher.avatar_url} 
                              alt={teacher.name}
                              className="w-10 h-10 rounded-full bg-gray-200 object-cover"
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

      {/* Add/Edit Teacher Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col overflow-y-auto">
          <SheetHeader className="flex-row items-center justify-between space-y-0 pb-6">
            <SheetTitle className="text-xl font-semibold">
              {isEditMode ? "Редактирование преподавателя" : "Добавление преподавателя"}
            </SheetTitle>
            <button 
              onClick={closeSheet}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </SheetHeader>
          
          <div className="flex-1 space-y-6">
            {/* Avatar Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Аватар</Label>
              
              {/* Current/Selected Avatar Preview */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden border-2 border-gray-200">
                  {(selectedAvatar || customAvatarUrl) ? (
                    <img 
                      src={getAvatarUrl()} 
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : formData.name ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600 text-xl font-medium">
                      {getInitials(formData.name)}
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                      <Users className="w-8 h-8" />
                    </div>
                  )}
                </div>
                
                {/* Upload Button */}
                <div>
                  <label className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">Загрузить фото</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      data-testid="avatar-upload"
                    />
                  </label>
                </div>
              </div>
              
              {/* Avatar Options Grid */}
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_OPTIONS.map((avatar) => (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => {
                      setSelectedAvatar(avatar.id);
                      setCustomAvatarUrl("");
                    }}
                    className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
                      selectedAvatar === avatar.id 
                        ? "border-[#1B318E] ring-2 ring-[#1B318E]/20" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    data-testid={`avatar-option-${avatar.id}`}
                  >
                    <img src={avatar.url} alt={`Avatar ${avatar.id}`} className="w-full h-full" />
                    {selectedAvatar === avatar.id && (
                      <div className="absolute inset-0 bg-[#1B318E]/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-[#1B318E]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="teacher-name" className="text-base font-medium">ФИО *</Label>
              <Input
                id="teacher-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-12 rounded-lg border-gray-200"
                placeholder="Иванов Иван Иванович"
                data-testid="teacher-name-input"
              />
            </div>
            
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="teacher-email" className="text-base font-medium">Email *</Label>
              <Input
                id="teacher-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-12 rounded-lg border-gray-200"
                placeholder="email@hse.ru"
                data-testid="teacher-email-input"
              />
              {!isEditMode && (
                <p className="text-sm text-gray-500 leading-relaxed">
                  Пароль от личного кабинета будет сформирован автоматически и отправлен на почту в приглашении
                </p>
              )}
            </div>

            {/* Status Field (only in edit mode) */}
            {isEditMode && (
              <div className="space-y-2">
                <Label className="text-base font-medium">Статус</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="h-12 rounded-lg border-gray-200" data-testid="status-select">
                    <SelectValue placeholder="Выберите статус" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <SheetFooter className="flex-col gap-3 mt-auto pt-6">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full h-12 bg-[#1B318E] hover:bg-[#152570] text-white rounded-lg"
              data-testid="save-teacher-btn"
            >
              {isSubmitting ? "Сохранение..." : "Сохранить"}
            </Button>
            <Button
              variant="outline"
              onClick={closeSheet}
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
