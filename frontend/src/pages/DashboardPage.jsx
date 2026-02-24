import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  Globe, 
  Mail, 
  GraduationCap, 
  Calendar, 
  BookOpen, 
  Users, 
  Phone, 
  FileText,
  Check,
  Clock,
  LogOut
} from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Service icons mapping
const SERVICE_ICONS = {
  'globe': Globe,
  'mail': Mail,
  'graduation-cap': GraduationCap,
  'calendar': Calendar,
  'book-open': BookOpen,
  'users': Users,
  'phone': Phone,
  'file-text': FileText
};

// Document type colors
const DOC_TYPE_COLORS = {
  doc: { bg: 'bg-blue-100', text: 'text-blue-700' },
  xls: { bg: 'bg-green-100', text: 'text-green-700' },
  pdf: { bg: 'bg-red-100', text: 'text-red-700' },
  zip: { bg: 'bg-amber-100', text: 'text-amber-700' }
};

export default function DashboardPage({ user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState({ tasks_completed: 2, tasks_total: 5, courses_completed: 2, courses_total: 6 });
  const [activeTab, setActiveTab] = useState("tasks");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tasksRes, coursesRes, docsRes, servicesRes, statsRes] = await Promise.all([
        axios.get(`${API}/tasks`),
        axios.get(`${API}/courses`),
        axios.get(`${API}/documents`),
        axios.get(`${API}/services`),
        axios.get(`${API}/user/stats`)
      ]);
      
      setTasks(tasksRes.data);
      setCourses(coursesRes.data);
      setDocuments(docsRes.data);
      setServices(servicesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error("Ошибка загрузки данных");
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskToggle = async (taskId, currentState) => {
    const newState = !currentState;
    
    // Optimistic update
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, completed: newState } : task
    ));

    try {
      await axios.put(`${API}/tasks/${taskId}/toggle`, { completed: newState });
      
      // Update stats
      setStats(prev => ({
        ...prev,
        tasks_completed: newState ? prev.tasks_completed + 1 : prev.tasks_completed - 1
      }));
    } catch (error) {
      // Revert on error
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, completed: currentState } : task
      ));
      toast.error("Ошибка обновления задачи");
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F0F5]" data-testid="dashboard-page">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 h-16">
        <div className="max-w-[1000px] mx-auto w-full px-4 md:px-8 flex items-center justify-between h-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1B318E] flex items-center justify-center">
              <span className="text-white text-lg font-bold">В</span>
            </div>
            <h1 className="text-xl font-bold text-[#1B318E] font-heading">
              Онбординг
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-medium hidden sm:block" data-testid="user-name">
              {user?.name}
            </span>
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200">
              <img 
                src={user?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Default"} 
                alt={user?.name}
                className="w-full h-full object-cover"
                data-testid="user-avatar"
              />
            </div>
            <button
              onClick={onLogout}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Выйти"
              data-testid="logout-button"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - White Paper */}
      <main className="max-w-[1000px] mx-auto px-4 md:px-8 py-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
          {/* Hero Card */}
          <div className="bg-[#FAFAFB] rounded-xl p-5 mb-8" data-testid="hero-card">
            <h2 className="text-xl font-bold text-gray-900 mb-2 font-heading">
              Все для быстрого старта
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Здесь — все, что нужно для первых недель работы: документы, шаблоны, доступы, методические рекомендации и короткие курсы по основам преподавания. Сфокусируйтесь на содержании — мы поможем с процессами
            </p>
          </div>

          {/* Services Section */}
          <section className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 font-heading">Сервисы</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2" data-testid="services-list">
              {services.map((service) => {
                const IconComponent = SERVICE_ICONS[service.icon] || Globe;
                return (
                  <a
                    key={service.id}
                    href={service.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 p-3 min-w-[90px] rounded-xl hover:bg-gray-50 transition-colors"
                    data-testid={`service-${service.id}`}
                  >
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-gray-600" />
                    </div>
                    <span className="text-xs text-gray-700 text-center whitespace-nowrap">
                      {service.name}
                    </span>
                  </a>
                );
              })}
            </div>
          </section>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full h-auto p-1 bg-[#EBEEF2] rounded-xl flex" data-testid="tabs-list">
            <TabsTrigger 
              value="tasks" 
              className="flex-1 py-3 px-2 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-[#1B318E] data-[state=active]:shadow-md data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-500"
              data-testid="tasks-tab"
            >
              <span className="hidden sm:inline">Задачи {stats.tasks_completed} из {stats.tasks_total}</span>
              <span className="sm:hidden">Задачи {stats.tasks_completed}/{stats.tasks_total}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="learning" 
              className="flex-1 py-3 px-2 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-[#1B318E] data-[state=active]:shadow-md data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-500"
              data-testid="learning-tab"
            >
              <span className="hidden sm:inline">Обучение {stats.courses_completed} из {stats.courses_total}</span>
              <span className="sm:hidden">Обучение {stats.courses_completed}/{stats.courses_total}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="documents" 
              className="flex-1 py-3 px-2 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-[#1B318E] data-[state=active]:shadow-md data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-500"
              data-testid="documents-tab"
            >
              Документы
            </TabsTrigger>
          </TabsList>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="animate-slide-in" data-testid="tasks-content">
            <h3 className="text-lg font-bold text-gray-900 mb-4 font-heading">Задачи</h3>
            <div className="space-y-1">
              {tasks.map((task) => (
                <div key={task.id} className="task-item" data-testid={`task-${task.id}`}>
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={task.completed}
                    onCheckedChange={() => handleTaskToggle(task.id, task.completed)}
                    className="task-checkbox w-5 h-5 border-2 border-gray-300 data-[state=checked]:bg-[#1B318E] data-[state=checked]:border-[#1B318E]"
                    data-testid={`task-checkbox-${task.id}`}
                  />
                  <div className="task-content">
                    <p className={`task-title ${task.completed ? 'completed' : ''}`}>
                      {task.title}
                    </p>
                    <p className="task-description">{task.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Learning Tab */}
          <TabsContent value="learning" className="animate-slide-in" data-testid="learning-content">
            <h3 className="text-lg font-bold text-gray-900 mb-4 font-heading">
              Изучите перед началом работы
            </h3>
            <div className="space-y-3">
              {courses.map((course) => (
                <div key={course.id} className="course-item" data-testid={`course-${course.id}`}>
                  <div className="course-image flex items-center justify-center bg-purple-100">
                    {/* Course illustration placeholder */}
                    <svg viewBox="0 0 80 80" className="w-16 h-16">
                      <circle cx="40" cy="30" r="15" fill="#FFE4C4" />
                      <rect x="25" y="45" width="30" height="25" rx="3" fill="#9333EA" opacity="0.3" />
                      <circle cx="35" cy="28" r="2" fill="#333" />
                      <circle cx="45" cy="28" r="2" fill="#333" />
                      <path d="M35 35 Q40 38 45 35" fill="none" stroke="#333" strokeWidth="1.5" />
                    </svg>
                  </div>
                  <div className="course-content">
                    <h4 className="course-title">
                      Модуль {course.module_number}. {course.title}
                    </h4>
                    <p className="course-description">{course.description}</p>
                    <div className="course-meta">
                      {course.completed && (
                        <span className="course-status">
                          <Check size={14} />
                          Изучено
                        </span>
                      )}
                      <span className="course-duration">
                        <Clock size={14} />
                        {course.duration}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="animate-slide-in" data-testid="documents-content">
            <h3 className="text-lg font-bold text-gray-900 mb-4 font-heading">
              Документы и шаблоны
            </h3>
            <div>
              {documents.map((doc) => {
                const typeColors = DOC_TYPE_COLORS[doc.file_type] || DOC_TYPE_COLORS.doc;
                return (
                  <div key={doc.id} className="document-item" data-testid={`document-${doc.id}`}>
                    <div className={`document-icon ${typeColors.bg} ${typeColors.text}`}>
                      {doc.file_type}
                    </div>
                    <div className="document-content">
                      <h4 className="document-title">{doc.title}</h4>
                      <p className="document-description">{doc.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
        </div>
      </main>
    </div>
  );
}
