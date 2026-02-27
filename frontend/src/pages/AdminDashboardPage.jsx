import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
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
  ChevronRight,
  Clock,
  Edit,
  GraduationCap
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
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Sheet states
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetType, setSheetType] = useState(null); // 'teacher' | 'task' | 'document' | 'module'
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Lesson modal states
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [isLessonEditMode, setIsLessonEditMode] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [selectedModuleForLesson, setSelectedModuleForLesson] = useState(null);
  const [lessonModalTab, setLessonModalTab] = useState("description");
  
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

  // Module form states
  const [moduleForm, setModuleForm] = useState({
    title: "",
    description: "",
    order: 1
  });

  // Lesson form states
  const [lessonForm, setLessonForm] = useState({
    title: "",
    description: "",
    content: "",
    duration_minutes: 30,
    order: 1
  });
  
  // Editor mode: 'visual' or 'html'
  const [editorMode, setEditorMode] = useState('visual');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination
  const [taskPage, setTaskPage] = useState(1);
  const [docPage, setDocPage] = useState(1);
  const itemsPerPage = 10;

  // Quill editor config
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'blockquote', 'code-block',
    'link', 'image'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [teachersRes, tasksRes, coursesRes, docsRes, modulesRes] = await Promise.all([
        axios.get(`${API}/admin/teachers`),
        axios.get(`${API}/admin/tasks`),
        axios.get(`${API}/admin/courses`),
        axios.get(`${API}/admin/documents`),
        axios.get(`${API}/admin/modules`)
      ]);
      
      setTeachers(teachersRes.data);
      setTasks(tasksRes.data);
      setCourses(coursesRes.data);
      setDocuments(docsRes.data);
      setModules(modulesRes.data);
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

  // ============ Module Functions ============
  const openModuleCreate = () => {
    setSheetType('module');
    setIsEditMode(false);
    setEditingItem(null);
    setModuleForm({ title: "", description: "", order: modules.length + 1 });
    setIsSheetOpen(true);
  };

  const openModuleEdit = (module) => {
    setSheetType('module');
    setIsEditMode(true);
    setEditingItem(module);
    setModuleForm({
      title: module.title,
      description: module.description,
      order: module.order
    });
    setIsSheetOpen(true);
  };

  const handleModuleSubmit = async () => {
    if (!moduleForm.title.trim()) {
      toast.error("Введите название модуля");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode && editingItem) {
        const response = await axios.put(`${API}/admin/modules/${editingItem.id}`, {
          title: moduleForm.title,
          description: moduleForm.description,
          order: moduleForm.order
        });
        setModules(modules.map(m => m.id === editingItem.id ? response.data : m));
        toast.success("Модуль обновлён");
      } else {
        const response = await axios.post(`${API}/admin/modules`, {
          title: moduleForm.title,
          description: moduleForm.description,
          order: moduleForm.order
        });
        setModules([...modules, response.data]);
        toast.success("Модуль добавлен");
      }
      closeSheet();
    } catch (error) {
      const message = error.response?.data?.detail || "Ошибка сохранения";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModuleDelete = async () => {
    if (!editingItem) return;
    
    if (!window.confirm("Удалить этот модуль и все его уроки?")) return;

    setIsSubmitting(true);
    try {
      await axios.delete(`${API}/admin/modules/${editingItem.id}`);
      setModules(modules.filter(m => m.id !== editingItem.id));
      setLessons(lessons.filter(l => l.module_id !== editingItem.id));
      toast.success("Модуль удалён");
      closeSheet();
    } catch (error) {
      toast.error("Ошибка удаления");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============ Lesson Functions ============
  const fetchModuleLessons = async (moduleId) => {
    try {
      const response = await axios.get(`${API}/admin/modules/${moduleId}/lessons`);
      setLessons(response.data);
    } catch (error) {
      toast.error("Ошибка загрузки уроков");
    }
  };

  const openLessonCreate = (module) => {
    setSelectedModuleForLesson(module);
    setIsLessonEditMode(false);
    setEditingLesson(null);
    const moduleLessons = lessons.filter(l => l.module_id === module.id);
    setLessonForm({ 
      title: "", 
      description: "", 
      content: "", 
      duration_minutes: 30, 
      order: moduleLessons.length + 1 
    });
    setLessonModalTab("description");
    setEditorMode('visual');
    setIsLessonModalOpen(true);
  };

  const openLessonEdit = async (lesson, module) => {
    setSelectedModuleForLesson(module);
    setIsLessonEditMode(true);
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title,
      description: lesson.description,
      content: lesson.content,
      duration_minutes: lesson.duration_minutes,
      order: lesson.order
    });
    setLessonModalTab("description");
    setEditorMode('visual');
    setIsLessonModalOpen(true);
  };

  const handleLessonSubmit = async () => {
    if (!lessonForm.title.trim()) {
      toast.error("Введите название урока");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isLessonEditMode && editingLesson) {
        const response = await axios.put(`${API}/admin/lessons/${editingLesson.id}`, {
          title: lessonForm.title,
          description: lessonForm.description,
          content: lessonForm.content,
          duration_minutes: lessonForm.duration_minutes,
          order: lessonForm.order
        });
        setLessons(lessons.map(l => l.id === editingLesson.id ? response.data : l));
        // Update module lessons count
        const modulesRes = await axios.get(`${API}/admin/modules`);
        setModules(modulesRes.data);
        toast.success("Урок обновлён");
      } else {
        const response = await axios.post(`${API}/admin/lessons`, {
          module_id: selectedModuleForLesson.id,
          title: lessonForm.title,
          description: lessonForm.description,
          content: lessonForm.content,
          duration_minutes: lessonForm.duration_minutes,
          order: lessonForm.order
        });
        setLessons([...lessons, response.data]);
        // Update module lessons count
        const modulesRes = await axios.get(`${API}/admin/modules`);
        setModules(modulesRes.data);
        toast.success("Урок добавлен");
      }
      setIsLessonModalOpen(false);
    } catch (error) {
      const message = error.response?.data?.detail || "Ошибка сохранения";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLessonDelete = async () => {
    if (!editingLesson) return;
    
    if (!window.confirm("Удалить этот урок?")) return;

    setIsSubmitting(true);
    try {
      await axios.delete(`${API}/admin/lessons/${editingLesson.id}`);
      setLessons(lessons.filter(l => l.id !== editingLesson.id));
      // Update module lessons count
      const modulesRes = await axios.get(`${API}/admin/modules`);
      setModules(modulesRes.data);
      toast.success("Урок удалён");
      setIsLessonModalOpen(false);
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
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900 font-heading">Модули и уроки</h1>
              <Button 
                onClick={openModuleCreate}
                className="bg-[#1B318E] hover:bg-[#152570] text-white px-6"
                data-testid="add-module-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить модуль
              </Button>
            </div>
            
            <div className="space-y-4">
              {modules.map((module) => {
                const moduleLessons = lessons.filter(l => l.module_id === module.id);
                return (
                  <div key={module.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden" data-testid={`module-${module.id}`}>
                    {/* Module Header */}
                    <div 
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        // Expand/collapse lessons
                        if (moduleLessons.length === 0) {
                          fetchModuleLessons(module.id);
                        }
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                          <GraduationCap className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Модуль {module.order}. {module.title}</h3>
                          <p className="text-sm text-gray-500">{module.lessons_count} уроков</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); openLessonCreate(module); }}
                          className="text-[#1B318E] border-[#1B318E]/20 hover:bg-[#1B318E]/5"
                          data-testid={`add-lesson-btn-${module.id}`}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Урок
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); openModuleEdit(module); }}
                          data-testid={`edit-module-btn-${module.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Lessons List */}
                    {moduleLessons.length > 0 && (
                      <div className="border-t border-gray-100">
                        {moduleLessons.map((lesson) => (
                          <div 
                            key={lesson.id}
                            className="px-4 py-3 pl-20 flex items-center justify-between hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                            onClick={() => openLessonEdit(lesson, module)}
                            data-testid={`lesson-${lesson.id}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                                {lesson.order}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{lesson.title}</p>
                                <p className="text-sm text-gray-500">{lesson.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Clock className="w-4 h-4" />
                              {lesson.duration_minutes} мин
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Load lessons button if not loaded */}
                    {module.lessons_count > 0 && moduleLessons.length === 0 && (
                      <div className="border-t border-gray-100 p-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fetchModuleLessons(module.id)}
                          className="text-gray-500"
                        >
                          Загрузить уроки ({module.lessons_count})
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {modules.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                  <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Модули пока не добавлены</p>
                </div>
              )}
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
          <SheetHeader className="pb-6">
            <SheetTitle className="text-xl font-semibold">
              {isEditMode ? "Редактирование преподавателя" : "Добавление преподавателя"}
            </SheetTitle>
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
          <SheetHeader className="pb-6">
            <SheetTitle className="text-xl font-semibold">
              {isEditMode ? "Редактирование задачи" : "Добавление задачи"}
            </SheetTitle>
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

    if (sheetType === 'document') {
      return (
        <>
          <SheetHeader className="pb-6">
            <SheetTitle className="text-xl font-semibold">
              {isEditMode ? "Редактирование документа" : "Добавление документа"}
            </SheetTitle>
          </SheetHeader>
          
          <div className="flex-1 space-y-6 overflow-y-auto">
            {/* Document Title */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Название документа *</Label>
              <Input
                value={docForm.title}
                onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                className="h-12 rounded-lg border-gray-200"
                placeholder="Введите название документа"
                data-testid="doc-title-input"
              />
            </div>

            {/* File Type */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Тип файла</Label>
              <Select 
                value={docForm.file_type} 
                onValueChange={(value) => setDocForm({ ...docForm, file_type: value })}
              >
                <SelectTrigger className="h-12 rounded-lg border-gray-200" data-testid="doc-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doc">DOC</SelectItem>
                  <SelectItem value="xls">XLS</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="zip">ZIP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* File Upload or URL */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Файл</Label>
              
              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-gray-300 transition-colors">
                <label className="cursor-pointer block">
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600 block">Нажмите для загрузки файла</span>
                  <span className="text-xs text-gray-400">или перетащите файл сюда</span>
                  <input 
                    type="file" 
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // For demo: create data URL. In production: upload to server
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setDocForm({ 
                            ...docForm, 
                            download_url: event.target?.result,
                            file_type: file.name.split('.').pop()?.toLowerCase() || docForm.file_type
                          });
                        };
                        reader.readAsDataURL(file);
                        toast.success(`Файл "${file.name}" загружен`);
                      }
                    }}
                    data-testid="doc-file-upload"
                  />
                </label>
              </div>
              
              {/* Or divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-sm text-gray-400">или</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
              
              {/* URL Input */}
              <Input
                value={docForm.download_url}
                onChange={(e) => setDocForm({ ...docForm, download_url: e.target.value })}
                className="h-12 rounded-lg border-gray-200"
                placeholder="Вставьте ссылку на файл"
                data-testid="doc-url-input"
              />
              <p className="text-sm text-gray-500">
                Ссылка на Google Docs, Dropbox или другой файловый сервис
              </p>
            </div>

            {/* Document Description */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Описание</Label>
              <Textarea
                value={docForm.description}
                onChange={(e) => setDocForm({ ...docForm, description: e.target.value })}
                className="min-h-[100px] rounded-lg border-gray-200 resize-none"
                placeholder="Описание документа"
                data-testid="doc-description-input"
              />
            </div>

            {/* Order Number */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Порядковый номер</Label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDocForm({ ...docForm, order: Math.max(1, docForm.order - 1) })}
                  className="w-12 h-12 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  data-testid="doc-order-minus-btn"
                >
                  <Minus className="w-5 h-5 text-gray-600" />
                </button>
                <Input
                  type="number"
                  value={docForm.order}
                  onChange={(e) => setDocForm({ ...docForm, order: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="h-12 w-24 text-center rounded-lg border-gray-200"
                  min="1"
                  data-testid="doc-order-input"
                />
                <button
                  type="button"
                  onClick={() => setDocForm({ ...docForm, order: docForm.order + 1 })}
                  className="w-12 h-12 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  data-testid="doc-order-plus-btn"
                >
                  <Plus className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          <SheetFooter className="flex-col gap-3 mt-auto pt-6">
            <Button
              onClick={handleDocSubmit}
              disabled={isSubmitting}
              className="w-full h-12 bg-[#1B318E] hover:bg-[#152570] text-white rounded-lg"
              data-testid="save-doc-btn"
            >
              {isSubmitting ? "Сохранение..." : "Сохранить"}
            </Button>
            
            {isEditMode && (
              <Button 
                variant="outline" 
                onClick={handleDocDelete}
                disabled={isSubmitting}
                className="w-full h-12 rounded-lg border-red-200 text-red-600 hover:bg-red-50"
                data-testid="delete-doc-btn"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Удалить документ
              </Button>
            )}
            
            <Button variant="outline" onClick={closeSheet} className="w-full h-12 rounded-lg border-gray-200">
              Закрыть
            </Button>
          </SheetFooter>
        </>
      );
    }

    if (sheetType === 'module') {
      return (
        <>
          <SheetHeader className="pb-6">
            <SheetTitle className="text-xl font-semibold">
              {isEditMode ? "Редактирование модуля" : "Добавление модуля"}
            </SheetTitle>
          </SheetHeader>
          
          <div className="flex-1 space-y-6 overflow-y-auto">
            {/* Module Title */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Название модуля *</Label>
              <Input
                value={moduleForm.title}
                onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                className="h-12 rounded-lg border-gray-200"
                placeholder="Введите название модуля"
                data-testid="module-title-input"
              />
            </div>

            {/* Module Description */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Описание</Label>
              <Textarea
                value={moduleForm.description}
                onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                className="min-h-[120px] rounded-lg border-gray-200 resize-none"
                placeholder="Краткое описание модуля"
                data-testid="module-description-input"
              />
            </div>

            {/* Order Number */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Порядковый номер</Label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setModuleForm({ ...moduleForm, order: Math.max(1, moduleForm.order - 1) })}
                  className="w-12 h-12 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  data-testid="module-order-minus-btn"
                >
                  <Minus className="w-5 h-5 text-gray-600" />
                </button>
                <Input
                  type="number"
                  value={moduleForm.order}
                  onChange={(e) => setModuleForm({ ...moduleForm, order: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="h-12 w-24 text-center rounded-lg border-gray-200"
                  min="1"
                  data-testid="module-order-input"
                />
                <button
                  type="button"
                  onClick={() => setModuleForm({ ...moduleForm, order: moduleForm.order + 1 })}
                  className="w-12 h-12 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  data-testid="module-order-plus-btn"
                >
                  <Plus className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          <SheetFooter className="flex-col gap-3 mt-auto pt-6">
            <Button
              onClick={handleModuleSubmit}
              disabled={isSubmitting}
              className="w-full h-12 bg-[#1B318E] hover:bg-[#152570] text-white rounded-lg"
              data-testid="save-module-btn"
            >
              {isSubmitting ? "Сохранение..." : "Сохранить"}
            </Button>
            
            {isEditMode && (
              <Button 
                variant="outline" 
                onClick={handleModuleDelete}
                disabled={isSubmitting}
                className="w-full h-12 rounded-lg border-red-200 text-red-600 hover:bg-red-50"
                data-testid="delete-module-btn"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Удалить модуль
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

      {/* Lesson Modal */}
      <Dialog open={isLessonModalOpen} onOpenChange={setIsLessonModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {isLessonEditMode ? "Редактирование урока" : "Добавление урока"}
              {selectedModuleForLesson && (
                <span className="text-gray-500 font-normal text-base ml-2">
                  — {selectedModuleForLesson.title}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden flex flex-col">
            <Tabs value={lessonModalTab} onValueChange={setLessonModalTab} className="flex-1 flex flex-col">
              <TabsList className="w-full grid grid-cols-2 mb-4">
                <TabsTrigger value="description" data-testid="lesson-tab-description">Описание</TabsTrigger>
                <TabsTrigger value="content" data-testid="lesson-tab-content">Содержание</TabsTrigger>
              </TabsList>
              
              <TabsContent value="description" className="flex-1 space-y-4 overflow-y-auto">
                {/* Lesson Title */}
                <div className="space-y-2">
                  <Label className="text-base font-medium">Название урока *</Label>
                  <Input
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    className="h-12 rounded-lg border-gray-200"
                    placeholder="Введите название урока"
                    data-testid="lesson-title-input"
                  />
                </div>

                {/* Lesson Description */}
                <div className="space-y-2">
                  <Label className="text-base font-medium">Краткое описание</Label>
                  <Textarea
                    value={lessonForm.description}
                    onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                    className="min-h-[100px] rounded-lg border-gray-200 resize-none"
                    placeholder="Краткое описание урока"
                    data-testid="lesson-description-input"
                  />
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <Label className="text-base font-medium">Длительность (минут)</Label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setLessonForm({ ...lessonForm, duration_minutes: Math.max(5, lessonForm.duration_minutes - 5) })}
                      className="w-12 h-12 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                      data-testid="lesson-duration-minus-btn"
                    >
                      <Minus className="w-5 h-5 text-gray-600" />
                    </button>
                    <Input
                      type="number"
                      value={lessonForm.duration_minutes}
                      onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: Math.max(5, parseInt(e.target.value) || 5) })}
                      className="h-12 w-24 text-center rounded-lg border-gray-200"
                      min="5"
                      data-testid="lesson-duration-input"
                    />
                    <button
                      type="button"
                      onClick={() => setLessonForm({ ...lessonForm, duration_minutes: lessonForm.duration_minutes + 5 })}
                      className="w-12 h-12 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                      data-testid="lesson-duration-plus-btn"
                    >
                      <Plus className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Order Number */}
                <div className="space-y-2">
                  <Label className="text-base font-medium">Порядковый номер</Label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setLessonForm({ ...lessonForm, order: Math.max(1, lessonForm.order - 1) })}
                      className="w-12 h-12 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                      data-testid="lesson-order-minus-btn"
                    >
                      <Minus className="w-5 h-5 text-gray-600" />
                    </button>
                    <Input
                      type="number"
                      value={lessonForm.order}
                      onChange={(e) => setLessonForm({ ...lessonForm, order: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="h-12 w-24 text-center rounded-lg border-gray-200"
                      min="1"
                      data-testid="lesson-order-input"
                    />
                    <button
                      type="button"
                      onClick={() => setLessonForm({ ...lessonForm, order: lessonForm.order + 1 })}
                      className="w-12 h-12 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                      data-testid="lesson-order-plus-btn"
                    >
                      <Plus className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="content" className="flex-1 overflow-hidden">
                {/* Editor Mode Toggle */}
                <div className="flex items-center gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setEditorMode('visual')}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      editorMode === 'visual' 
                        ? 'bg-[#1B318E] text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    data-testid="editor-mode-visual"
                  >
                    Визуальный редактор
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorMode('html')}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      editorMode === 'html' 
                        ? 'bg-[#1B318E] text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    data-testid="editor-mode-html"
                  >
                    HTML код
                  </button>
                </div>
                
                {editorMode === 'visual' ? (
                  <div className="h-[350px]">
                    <ReactQuill
                      theme="snow"
                      value={lessonForm.content}
                      onChange={(content) => setLessonForm({ ...lessonForm, content })}
                      modules={quillModules}
                      formats={quillFormats}
                      className="h-[300px]"
                      placeholder="Введите содержание урока..."
                      data-testid="lesson-content-editor"
                    />
                  </div>
                ) : (
                  <Textarea
                    value={lessonForm.content}
                    onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                    className="h-[350px] font-mono text-sm rounded-lg border-gray-200 resize-none"
                    placeholder="<h2>Заголовок</h2>&#10;<p>Текст параграфа</p>&#10;<ul>&#10;  <li>Пункт списка</li>&#10;</ul>"
                    data-testid="lesson-content-html"
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3 mt-4">
            {isLessonEditMode && (
              <Button 
                variant="outline" 
                onClick={handleLessonDelete}
                disabled={isSubmitting}
                className="w-full sm:w-auto rounded-lg border-red-200 text-red-600 hover:bg-red-50"
                data-testid="delete-lesson-btn"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Удалить
              </Button>
            )}
            <div className="flex-1" />
            <Button 
              variant="outline" 
              onClick={() => setIsLessonModalOpen(false)} 
              className="w-full sm:w-auto rounded-lg border-gray-200"
            >
              Отмена
            </Button>
            <Button
              onClick={handleLessonSubmit}
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-[#1B318E] hover:bg-[#152570] text-white rounded-lg"
              data-testid="save-lesson-btn"
            >
              {isSubmitting ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
