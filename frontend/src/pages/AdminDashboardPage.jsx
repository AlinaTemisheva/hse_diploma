import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Check,
  Minus,
  Trash2,
  ChevronLeft,
  ChevronRight
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

// Status options for teachers
const STATUS_OPTIONS = [
  { value: "registered", label: "Зарегистрирован" },
  { value: "in_progress", label: "В процессе" },
  { value: "completed", label: "Завершено обучение" },
  { value: "blocked", label: "Заблокирован" },
];

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

// Avatar options
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
  const [sheetType, setSheetType] = useState(null); // 'teacher' | 'task' | 'document'
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Teacher form states
  const [teacherForm, setTeacherForm] = useState({ 
    name: "", 
    email: "", 
    status: "in_progress",
    avatar_url: "" 
  });
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
  
  // Task form states
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    order: 1
  });

  // Document form states
  const [docForm, setDocForm] = useState({
    title: "",
    description: "",
    file_type: "doc",
    download_url: "",
    order: 1
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination
  const [taskPage, setTaskPage] = useState(1);
  const [docPage, setDocPage] = useState(1);
  const itemsPerPage = 10;

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

  // ============ Teacher Functions ============
  const openTeacherCreate = () => {
    setSheetType('teacher');
    setIsEditMode(false);
    setEditingItem(null);
    setTeacherForm({ name: "", email: "", status: "in_progress", avatar_url: "" });
    setSelectedAvatar(null);
    setCustomAvatarUrl("");
    setIsSheetOpen(true);
  };

  const openTeacherEdit = (teacher) => {
    setSheetType('teacher');
    setIsEditMode(true);
    setEditingItem(teacher);
    setTeacherForm({
      name: teacher.name,
      email: teacher.email,
      status: teacher.status,
      avatar_url: teacher.avatar_url
    });
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

  const getAvatarUrl = () => {
    if (selectedAvatar) {
      return AVATAR_OPTIONS.find(a => a.id === selectedAvatar)?.url || "";
    }
    if (customAvatarUrl) {
      return customAvatarUrl;
    }
    return "";
  };

  const handleTeacherSubmit = async () => {
    if (!teacherForm.name.trim() || !teacherForm.email.trim()) {
      toast.error("Заполните все обязательные поля");
      return;
    }

    setIsSubmitting(true);
    const avatarUrl = getAvatarUrl();

    try {
      if (isEditMode && editingItem) {
        const response = await axios.put(`${API}/admin/teachers/${editingItem.id}`, {
          name: teacherForm.name,
          email: teacherForm.email,
          status: teacherForm.status,
          avatar_url: avatarUrl || undefined
        });
        setTeachers(teachers.map(t => t.id === editingItem.id ? response.data : t));
        toast.success("Преподаватель обновлён");
      } else {
        const response = await axios.post(`${API}/admin/teachers`, {
          name: teacherForm.name,
          email: teacherForm.email,
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
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomAvatarUrl(event.target?.result);
        setSelectedAvatar(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // ============ Task Functions ============
  const openTaskCreate = () => {
    setSheetType('task');
    setIsEditMode(false);
    setEditingItem(null);
    setTaskForm({ title: "", description: "", order: tasks.length + 1 });
    setIsSheetOpen(true);
  };

  const openTaskEdit = (task) => {
    setSheetType('task');
    setIsEditMode(true);
    setEditingItem(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      order: task.order
    });
    setIsSheetOpen(true);
  };

  const handleTaskSubmit = async () => {
    if (!taskForm.title.trim()) {
      toast.error("Введите название задачи");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode && editingItem) {
        const response = await axios.put(`${API}/admin/tasks/${editingItem.id}`, {
          title: taskForm.title,
          description: taskForm.description,
          order: taskForm.order
        });
        setTasks(tasks.map(t => t.id === editingItem.id ? response.data : t));
        toast.success("Задача обновлена");
      } else {
        const response = await axios.post(`${API}/admin/tasks`, {
          title: taskForm.title,
          description: taskForm.description,
          order: taskForm.order
        });
        setTasks([...tasks, response.data]);
        toast.success("Задача добавлена");
      }
      closeSheet();
    } catch (error) {
      const message = error.response?.data?.detail || "Ошибка сохранения";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTaskDelete = async () => {
    if (!editingItem) return;
    
    if (!window.confirm("Удалить эту задачу?")) return;

    setIsSubmitting(true);
    try {
      await axios.delete(`${API}/admin/tasks/${editingItem.id}`);
      setTasks(tasks.filter(t => t.id !== editingItem.id));
      toast.success("Задача удалена");
      closeSheet();
    } catch (error) {
      toast.error("Ошибка удаления");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============ Document Functions ============
  const openDocCreate = () => {
    setSheetType('document');
    setIsEditMode(false);
    setEditingItem(null);
    setDocForm({ title: "", description: "", file_type: "doc", download_url: "", order: documents.length + 1 });
    setIsSheetOpen(true);
  };

  const openDocEdit = (doc) => {
    setSheetType('document');
    setIsEditMode(true);
    setEditingItem(doc);
    setDocForm({
      title: doc.title,
      description: doc.description,
      file_type: doc.file_type,
      download_url: doc.download_url || "",
      order: doc.order
    });
    setIsSheetOpen(true);
  };

  const handleDocSubmit = async () => {
    if (!docForm.title.trim()) {
      toast.error("Введите название документа");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode && editingItem) {
        const response = await axios.put(`${API}/admin/documents/${editingItem.id}`, {
          title: docForm.title,
          description: docForm.description,
          file_type: docForm.file_type,
          download_url: docForm.download_url || null,
          order: docForm.order
        });
        setDocuments(documents.map(d => d.id === editingItem.id ? response.data : d));
        toast.success("Документ обновлён");
      } else {
        const response = await axios.post(`${API}/admin/documents`, {
          title: docForm.title,
          description: docForm.description,
          file_type: docForm.file_type,
          download_url: docForm.download_url || null,
          order: docForm.order
        });
        setDocuments([...documents, response.data]);
        toast.success("Документ добавлен");
      }
      closeSheet();
    } catch (error) {
      const message = error.response?.data?.detail || "Ошибка сохранения";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDocDelete = async () => {
    if (!editingItem) return;
    
    if (!window.confirm("Удалить этот документ?")) return;

    setIsSubmitting(true);
    try {
      await axios.delete(`${API}/admin/documents/${editingItem.id}`);
      setDocuments(documents.filter(d => d.id !== editingItem.id));
      toast.success("Документ удалён");
      closeSheet();
    } catch (error) {
      toast.error("Ошибка удаления");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============ Common Functions ============
  const closeSheet = () => {
    setIsSheetOpen(false);
    setSheetType(null);
    setIsEditMode(false);
    setEditingItem(null);
  };

  const getInitials = (name) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Paginated items
  const paginatedTasks = tasks.slice((taskPage - 1) * itemsPerPage, taskPage * itemsPerPage);
  const totalTaskPages = Math.ceil(tasks.length / itemsPerPage);
  
  const paginatedDocs = documents.slice((docPage - 1) * itemsPerPage, docPage * itemsPerPage);
  const totalDocPages = Math.ceil(documents.length / itemsPerPage);

  // ============ Render Content ============
  const renderContent = () => {
    switch (activeMenu) {
      case "teachers":
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900 font-heading">Преподаватели</h1>
              <Button 
                onClick={openTeacherCreate}
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
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Email</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((teacher) => (
                    <tr 
                      key={teacher.id} 
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors" 
                      onClick={() => openTeacherEdit(teacher)}
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
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900 font-heading">Задачи</h1>
              <Button 
                onClick={openTaskCreate}
                className="bg-[#1B318E] hover:bg-[#152570] text-white px-6"
                data-testid="add-task-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить задачу
              </Button>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 w-20">№</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Задача</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTasks.map((task) => (
                    <tr 
                      key={task.id} 
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => openTaskEdit(task)}
                      data-testid={`task-row-${task.id}`}
                    >
                      <td className="py-4 px-6 text-gray-500">{task.order}</td>
                      <td className="py-4 px-6 font-medium text-gray-900">{task.title}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalTaskPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setTaskPage(p => Math.max(1, p - 1))}
                  disabled={taskPage === 1}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Назад
                </button>
                
                {[...Array(totalTaskPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setTaskPage(i + 1)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium ${
                      taskPage === i + 1 
                        ? "bg-[#1B318E] text-white" 
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => setTaskPage(p => Math.min(totalTaskPages, p + 1))}
                  disabled={taskPage === totalTaskPages}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Вперед
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
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
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900 font-heading">Документы</h1>
              <Button 
                onClick={openDocCreate}
                className="bg-[#1B318E] hover:bg-[#152570] text-white px-6"
                data-testid="add-doc-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить документ
              </Button>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 w-20">№</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Документ</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDocs.map((doc) => (
                    <tr 
                      key={doc.id} 
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => openDocEdit(doc)}
                      data-testid={`doc-row-${doc.id}`}
                    >
                      <td className="py-4 px-6 text-gray-500">{doc.order}</td>
                      <td className="py-4 px-6 font-medium text-gray-900">{doc.title}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalDocPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setDocPage(p => Math.max(1, p - 1))}
                  disabled={docPage === 1}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Назад
                </button>
                
                {[...Array(totalDocPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setDocPage(i + 1)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium ${
                      docPage === i + 1 
                        ? "bg-[#1B318E] text-white" 
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => setDocPage(p => Math.min(totalDocPages, p + 1))}
                  disabled={docPage === totalDocPages}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Вперед
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  // ============ Render Sheet Content ============
  const renderSheetContent = () => {
    if (sheetType === 'teacher') {
      return (
        <>
          <SheetHeader className="flex-row items-center justify-between space-y-0 pb-6">
            <SheetTitle className="text-xl font-semibold">
              {isEditMode ? "Редактирование преподавателя" : "Добавление преподавателя"}
            </SheetTitle>
            <button onClick={closeSheet} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </SheetHeader>
          
          <div className="flex-1 space-y-6 overflow-y-auto">
            {/* Avatar Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Аватар</Label>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden border-2 border-gray-200">
                  {(selectedAvatar || customAvatarUrl) ? (
                    <img src={getAvatarUrl()} alt="Avatar" className="w-full h-full object-cover" />
                  ) : teacherForm.name ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600 text-xl font-medium">
                      {getInitials(teacherForm.name)}
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                      <Users className="w-8 h-8" />
                    </div>
                  )}
                </div>
                
                <label className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">Загрузить фото</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
              
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_OPTIONS.map((avatar) => (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => { setSelectedAvatar(avatar.id); setCustomAvatarUrl(""); }}
                    className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
                      selectedAvatar === avatar.id 
                        ? "border-[#1B318E] ring-2 ring-[#1B318E]/20" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}
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
              <Label className="text-base font-medium">ФИО *</Label>
              <Input
                value={teacherForm.name}
                onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                className="h-12 rounded-lg border-gray-200"
                placeholder="Иванов Иван Иванович"
                data-testid="teacher-name-input"
              />
            </div>
            
            {/* Email Field */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Email *</Label>
              <Input
                type="email"
                value={teacherForm.email}
                onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                className="h-12 rounded-lg border-gray-200"
                placeholder="email@hse.ru"
                data-testid="teacher-email-input"
              />
              {!isEditMode && (
                <p className="text-sm text-gray-500">
                  Пароль от личного кабинета будет сформирован автоматически
                </p>
              )}
            </div>

            {/* Status Field (only in edit mode) */}
            {isEditMode && (
              <div className="space-y-2">
                <Label className="text-base font-medium">Статус</Label>
                <Select 
                  value={teacherForm.status} 
                  onValueChange={(value) => setTeacherForm({ ...teacherForm, status: value })}
                >
                  <SelectTrigger className="h-12 rounded-lg border-gray-200" data-testid="status-select">
                    <SelectValue />
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
              onClick={handleTeacherSubmit}
              disabled={isSubmitting}
              className="w-full h-12 bg-[#1B318E] hover:bg-[#152570] text-white rounded-lg"
              data-testid="save-teacher-btn"
            >
              {isSubmitting ? "Сохранение..." : "Сохранить"}
            </Button>
            <Button variant="outline" onClick={closeSheet} className="w-full h-12 rounded-lg border-gray-200">
              Закрыть
            </Button>
          </SheetFooter>
        </>
      );
    }

    if (sheetType === 'task') {
      return (
        <>
          <SheetHeader className="flex-row items-center justify-between space-y-0 pb-6">
            <SheetTitle className="text-xl font-semibold">
              {isEditMode ? "Редактирование задачи" : "Добавление задачи"}
            </SheetTitle>
            <button onClick={closeSheet} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </SheetHeader>
          
          <div className="flex-1 space-y-6 overflow-y-auto">
            {/* Task Title */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Название задачи *</Label>
              <Input
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                className="h-12 rounded-lg border-gray-200"
                placeholder="Введите название задачи"
                data-testid="task-title-input"
              />
            </div>

            {/* Task Description */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Описание</Label>
              <Textarea
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                className="min-h-[120px] rounded-lg border-gray-200 resize-none"
                placeholder="Подробное описание задачи"
                data-testid="task-description-input"
              />
            </div>

            {/* Order Number */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Порядковый номер</Label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTaskForm({ ...taskForm, order: Math.max(1, taskForm.order - 1) })}
                  className="w-12 h-12 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  data-testid="order-minus-btn"
                >
                  <Minus className="w-5 h-5 text-gray-600" />
                </button>
                <Input
                  type="number"
                  value={taskForm.order}
                  onChange={(e) => setTaskForm({ ...taskForm, order: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="h-12 w-24 text-center rounded-lg border-gray-200"
                  min="1"
                  data-testid="task-order-input"
                />
                <button
                  type="button"
                  onClick={() => setTaskForm({ ...taskForm, order: taskForm.order + 1 })}
                  className="w-12 h-12 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  data-testid="order-plus-btn"
                >
                  <Plus className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          <SheetFooter className="flex-col gap-3 mt-auto pt-6">
            <Button
              onClick={handleTaskSubmit}
              disabled={isSubmitting}
              className="w-full h-12 bg-[#1B318E] hover:bg-[#152570] text-white rounded-lg"
              data-testid="save-task-btn"
            >
              {isSubmitting ? "Сохранение..." : "Сохранить"}
            </Button>
            
            {isEditMode && (
              <Button 
                variant="outline" 
                onClick={handleTaskDelete}
                disabled={isSubmitting}
                className="w-full h-12 rounded-lg border-red-200 text-red-600 hover:bg-red-50"
                data-testid="delete-task-btn"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Удалить задачу
              </Button>
            )}
            
            <Button variant="outline" onClick={closeSheet} className="w-full h-12 rounded-lg border-gray-200">
              Закрыть
            </Button>
          </SheetFooter>
        </>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-white flex" data-testid="admin-dashboard">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 flex flex-col">
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

      {/* Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col">
          {renderSheetContent()}
        </SheetContent>
      </Sheet>
    </div>
  );
}
