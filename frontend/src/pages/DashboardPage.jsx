import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  LogOut,
  ExternalLink,
  ChevronRight,
  X,
  CheckCircle2,
  Circle,
  AlertCircle
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

export default function DashboardPage({ user, userId, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [services, setServices] = useState([]);
  const [modules, setModules] = useState([]);
  const [stats, setStats] = useState({ tasks_completed: 2, tasks_total: 5, courses_completed: 2, courses_total: 6 });
  const [activeTab, setActiveTab] = useState("tasks");
  const [isLoading, setIsLoading] = useState(true);
  
  // Lesson modal states
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [moduleLessons, setModuleLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  
  // Get user ID from props or localStorage
  const currentUserId = userId || localStorage.getItem("onboarding_user_id") || "1";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tasksRes, coursesRes, docsRes, servicesRes, statsRes, modulesRes] = await Promise.all([
        axios.get(`${API}/tasks?user_id=${currentUserId}`),
        axios.get(`${API}/courses`),
        axios.get(`${API}/documents`),
        axios.get(`${API}/services`),
        axios.get(`${API}/user/stats?user_id=${currentUserId}`),
        axios.get(`${API}/modules`)
      ]);
      
      setTasks(tasksRes.data);
      setCourses(coursesRes.data);
      setDocuments(docsRes.data);
      setServices(servicesRes.data);
      setStats(statsRes.data);
      setModules(modulesRes.data);
    } catch (error) {
      toast.error("Ошибка загрузки данных");
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openModuleLessons = async (module) => {
    setSelectedModule(module);
    setSelectedLesson(null);
    setModuleLessons([]); // Clear cache
    setIsLessonModalOpen(true);
    try {
      const response = await axios.get(`${API}/modules/${module.id}/lessons?user_id=${currentUserId}`);
      setModuleLessons(response.data);
    } catch (error) {
      toast.error("Ошибка загрузки уроков");
    }
  };

  const openLesson = async (lesson) => {
    try {
      // Always fetch fresh data from server
      const response = await axios.get(`${API}/lessons/${lesson.id}?user_id=${currentUserId}`);
      setSelectedLesson(response.data);
      
      // Mark as in_progress if not started
      if (!lesson.progress_status || lesson.progress_status === "not_started") {
        await axios.put(`${API}/lessons/${lesson.id}/progress?user_id=${currentUserId}`, { status: "in_progress" });
        // Update local state
        setModuleLessons(prev => prev.map(l => 
          l.id === lesson.id ? { ...l, progress_status: "in_progress" } : l
        ));
      }
    } catch (error) {
      toast.error("Ошибка загрузки урока");
    }
  };

  const markLessonComplete = async () => {
    if (!selectedLesson) return;
    
    try {
      await axios.put(`${API}/lessons/${selectedLesson.id}/progress?user_id=${currentUserId}`, { status: "completed" });
      
      // Update local state
      setSelectedLesson(prev => ({ ...prev, progress_status: "completed" }));
      setModuleLessons(prev => prev.map(l => 
        l.id === selectedLesson.id ? { ...l, progress_status: "completed" } : l
      ));
      
      // Refresh stats
      const statsRes = await axios.get(`${API}/user/stats?user_id=${currentUserId}`);
      setStats(statsRes.data);
      
      toast.success("Урок отмечен как пройденный!");
    } catch (error) {
      toast.error("Ошибка сохранения прогресса");
    }
  };

  const goBackToLessons = async () => {
    setSelectedLesson(null);
    // Refresh lessons list when going back
    if (selectedModule) {
      try {
        const response = await axios.get(`${API}/modules/${selectedModule.id}/lessons?user_id=${currentUserId}`);
        setModuleLessons(response.data);
      } catch (error) {
        console.error("Error refreshing lessons:", error);
      }
    }
  };

  const handleTaskToggle = async (taskId, currentState) => {
    const newState = !currentState;
    
    // Optimistic update
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, completed: newState } : task
    ));

    try {
      await axios.put(`${API}/tasks/${taskId}/toggle?user_id=${currentUserId}`, { completed: newState });
      
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
          <TabsList 
            className="w-full h-auto flex" 
            style={{ backgroundColor: '#EBEEF2', padding: '4px', borderRadius: '12px' }}
            data-testid="tabs-list"
          >
            <TabsTrigger 
              value="tasks" 
              className="flex-1 py-3 px-2 text-sm font-medium transition-all"
              style={{ 
                borderRadius: '10px',
                backgroundColor: activeTab === 'tasks' ? 'white' : 'transparent',
                color: activeTab === 'tasks' ? '#1B318E' : '#6B7280',
                boxShadow: activeTab === 'tasks' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                fontWeight: activeTab === 'tasks' ? '600' : '500'
              }}
              data-testid="tasks-tab"
            >
              <span className="hidden sm:inline">Задачи {stats.tasks_completed} из {stats.tasks_total}</span>
              <span className="sm:hidden text-xs">Задачи {stats.tasks_completed}/{stats.tasks_total}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="learning" 
              className="flex-1 py-3 px-2 text-sm font-medium transition-all"
              style={{ 
                borderRadius: '10px',
                backgroundColor: activeTab === 'learning' ? 'white' : 'transparent',
                color: activeTab === 'learning' ? '#1B318E' : '#6B7280',
                boxShadow: activeTab === 'learning' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                fontWeight: activeTab === 'learning' ? '600' : '500'
              }}
              data-testid="learning-tab"
            >
              <span className="hidden sm:inline">Обучение {stats.courses_completed} из {stats.courses_total}</span>
              <span className="sm:hidden text-xs">Обучение {stats.courses_completed}/{stats.courses_total}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="documents" 
              className="flex-1 py-3 px-2 text-sm font-medium transition-all"
              style={{ 
                borderRadius: '10px',
                backgroundColor: activeTab === 'documents' ? 'white' : 'transparent',
                color: activeTab === 'documents' ? '#1B318E' : '#6B7280',
                boxShadow: activeTab === 'documents' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                fontWeight: activeTab === 'documents' ? '600' : '500'
              }}
              data-testid="documents-tab"
            >
              <span className="hidden sm:inline">Документы</span>
              <span className="sm:hidden text-xs">Документы</span>
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
              {modules.map((module) => (
                <div 
                  key={module.id} 
                  className="course-item cursor-pointer hover:shadow-md transition-shadow" 
                  onClick={() => openModuleLessons(module)}
                  data-testid={`module-${module.id}`}
                >
                  <div className="course-image flex items-center justify-center bg-purple-100">
                    <svg viewBox="0 0 80 80" className="w-16 h-16">
                      <circle cx="40" cy="30" r="15" fill="#FFE4C4" />
                      <rect x="25" y="45" width="30" height="25" rx="3" fill="#9333EA" opacity="0.3" />
                      <circle cx="35" cy="28" r="2" fill="#333" />
                      <circle cx="45" cy="28" r="2" fill="#333" />
                      <path d="M35 35 Q40 38 45 35" fill="none" stroke="#333" strokeWidth="1.5" />
                    </svg>
                  </div>
                  <div className="course-content flex-1">
                    <h4 className="course-title">
                      Модуль {module.order}. {module.title}
                    </h4>
                    <p className="course-description">{module.description}</p>
                    <div className="course-meta">
                      <span className="text-sm text-gray-500">
                        {module.lessons_count} {module.lessons_count === 1 ? 'урок' : module.lessons_count < 5 ? 'урока' : 'уроков'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))}
              
              {modules.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <GraduationCap className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Модули пока не добавлены</p>
                </div>
              )}
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
                    <div className="document-content flex-1">
                      <h4 className="document-title">{doc.title}</h4>
                      <p className="document-description">{doc.description}</p>
                    </div>
                    {doc.download_url && (
                      <a
                        href={doc.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                        onClick={(e) => e.stopPropagation()}
                        title="Открыть документ"
                        data-testid={`doc-link-${doc.id}`}
                      >
                        <ExternalLink className="w-5 h-5 text-gray-600" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
        </div>
      </main>

      {/* Lesson Modal */}
      <Dialog open={isLessonModalOpen} onOpenChange={(open) => {
        setIsLessonModalOpen(open);
        if (!open) {
          // Refresh modules when modal closes
          axios.get(`${API}/modules`).then(res => setModules(res.data)).catch(() => {});
          // Refresh stats
          axios.get(`${API}/user/stats?user_id=${currentUserId}`).then(res => setStats(res.data)).catch(() => {});
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0">
          {selectedLesson ? (
            // Lesson Content View
            <>
              <DialogHeader className="p-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={goBackToLessons}
                    className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    data-testid="back-to-lessons-btn"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600 rotate-180" />
                  </button>
                  <DialogTitle className="text-xl font-semibold">{selectedLesson.title}</DialogTitle>
                  {selectedLesson.progress_status === "completed" && (
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                      Пройден
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {selectedLesson.duration_minutes} мин
                  </span>
                  {selectedLesson.is_snapshot && (
                    <span className="flex items-center gap-1 text-amber-600">
                      <AlertCircle className="w-4 h-4" />
                      Сохранённая версия
                    </span>
                  )}
                </div>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto p-6">
                {selectedLesson.is_snapshot && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                    Вы видите контент, сохранённый на момент прохождения урока. 
                    Актуальная версия могла измениться.
                  </div>
                )}
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedLesson.content }}
                  data-testid="lesson-content"
                />
              </div>
              {/* Complete button */}
              {selectedLesson.progress_status !== "completed" && (
                <div className="p-4 border-t border-gray-100">
                  <Button
                    onClick={markLessonComplete}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    data-testid="mark-lesson-complete-btn"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Урок пройден
                  </Button>
                </div>
              )}
            </>
          ) : (
            // Lessons List View
            <>
              <DialogHeader className="p-6 pb-4 border-b border-gray-100">
                <DialogTitle className="text-xl font-semibold">
                  {selectedModule && `Модуль ${selectedModule.order}. ${selectedModule.title}`}
                </DialogTitle>
                {selectedModule && (
                  <p className="text-sm text-gray-500 mt-1">{selectedModule.description}</p>
                )}
              </DialogHeader>
              <div className="flex-1 overflow-y-auto">
                {moduleLessons.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {moduleLessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => openLesson(lesson)}
                        data-testid={`lesson-item-${lesson.id}`}
                      >
                        <div className="flex items-center gap-4">
                          {/* Progress indicator */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            lesson.progress_status === "completed" 
                              ? "bg-green-100" 
                              : lesson.progress_status === "in_progress"
                                ? "bg-yellow-100"
                                : "bg-purple-100"
                          }`}>
                            {lesson.progress_status === "completed" ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : lesson.progress_status === "in_progress" ? (
                              <Circle className="w-5 h-5 text-yellow-600" />
                            ) : (
                              <span className="text-purple-600 font-medium">{lesson.order}</span>
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                            <p className="text-sm text-gray-500">{lesson.description}</p>
                            {lesson.progress_status === "completed" && (
                              <span className="text-xs text-green-600 font-medium">Пройден</span>
                            )}
                            {lesson.progress_status === "in_progress" && (
                              <span className="text-xs text-yellow-600 font-medium">В процессе</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {lesson.duration_minutes} мин
                          </span>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>В этом модуле пока нет уроков</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
