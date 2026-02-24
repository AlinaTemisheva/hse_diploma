import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Carousel slides data matching Figma design
const CAROUSEL_SLIDES = [
  {
    id: 1,
    image: "/images/whale.svg",
    title: "Разберитесь в правилах за 15 минут",
    description: "Ключевые требования и цифровые сервисы — кратко и по делу, без погружения в лишние регламенты"
  },
  {
    id: 2,
    image: "/images/person-books.svg",
    title: "Всё в одном месте",
    description: "Документы, шаблоны, курсы и чек-листы — структурированный путь к первому занятию"
  },
  {
    id: 3,
    image: "/images/person-idea.svg",
    title: "Минимум бюрократии — Максимум ясности",
    description: "Все требования, сервисы и обязательные шаги — в одном месте, чтобы вы были готовы к занятию без лишних уточнений"
  }
];

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Пожалуйста, заполните все поля");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, {
        email,
        password
      });

      if (response.data.success) {
        toast.success("Добро пожаловать!");
        onLogin(response.data.user);
      }
    } catch (error) {
      const message = error.response?.data?.detail || "Ошибка входа";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container" data-testid="login-page">
      {/* Left side - Carousel */}
      <div className="login-carousel">
        <div className="carousel-slide">
          <div className="w-full flex justify-center mb-6">
            {/* Placeholder for illustration - using emoji representation */}
            <div className="w-64 h-64 flex items-center justify-center">
              {currentSlide === 0 && (
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  {/* Whale illustration placeholder */}
                  <ellipse cx="100" cy="120" rx="70" ry="40" fill="#E8E8F0" />
                  <ellipse cx="100" cy="100" rx="60" ry="35" fill="#FFFFFF" stroke="#333" strokeWidth="2" />
                  <circle cx="75" cy="95" r="5" fill="#333" />
                  <path d="M50 80 L40 50 L60 70" fill="#E8FF00" stroke="#333" strokeWidth="2" />
                  <path d="M130 85 Q150 70 160 90" fill="none" stroke="#333" strokeWidth="2" />
                  <ellipse cx="40" cy="130" rx="15" ry="8" fill="#E8E8F0" />
                  <path d="M170 60 Q180 50 175 65 Q185 55 180 70" fill="none" stroke="#333" strokeWidth="2" />
                </svg>
              )}
              {currentSlide === 1 && (
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  {/* Person with books illustration */}
                  <rect x="60" y="140" width="80" height="50" rx="5" fill="#E8E8F0" />
                  <rect x="70" y="130" width="60" height="15" rx="3" fill="#1B318E" />
                  <rect x="75" y="120" width="50" height="15" rx="3" fill="#4F46E5" />
                  <circle cx="100" cy="80" r="25" fill="#FFE4C4" />
                  <path d="M85 75 Q100 85 115 75" fill="none" stroke="#333" strokeWidth="2" />
                  <circle cx="92" cy="72" r="3" fill="#333" />
                  <circle cx="108" cy="72" r="3" fill="#333" />
                </svg>
              )}
              {currentSlide === 2 && (
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  {/* Person with lightbulb illustration */}
                  <circle cx="100" cy="40" r="20" fill="#FFFF00" stroke="#333" strokeWidth="2" />
                  <path d="M90 55 L95 70 L105 70 L110 55" fill="#FFFF00" stroke="#333" strokeWidth="2" />
                  <circle cx="100" cy="110" r="30" fill="#FFE4C4" />
                  <path d="M85 105 Q100 115 115 105" fill="none" stroke="#333" strokeWidth="2" />
                  <circle cx="92" cy="102" r="3" fill="#333" />
                  <circle cx="108" cy="102" r="3" fill="#333" />
                  <rect x="70" y="140" width="60" height="50" rx="5" fill="#E8FF00" />
                </svg>
              )}
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-[#1B318E] mb-2 font-heading">
            {CAROUSEL_SLIDES[currentSlide].title}
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            {CAROUSEL_SLIDES[currentSlide].description}
          </p>
          
          {/* Carousel dots */}
          <div className="carousel-dots">
            {CAROUSEL_SLIDES.map((_, index) => (
              <button
                key={index}
                className={`carousel-dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Слайд ${index + 1}`}
                data-testid={`carousel-dot-${index}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="login-form-container">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="logo-icon">
              <span>В</span>
            </div>
            <h1 className="text-2xl font-bold text-[#1B318E] font-heading">
              Онбординг
            </h1>
          </div>

          {/* Login Form */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Вход</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-lg border-gray-200 focus:border-[#1B318E] focus:ring-[#1B318E]/20"
                  data-testid="email-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">Пароль</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-lg border-gray-200 focus:border-[#1B318E] focus:ring-[#1B318E]/20 pr-12"
                    data-testid="password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                    data-testid="toggle-password"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="text-sm text-[#1B318E] hover:underline"
                data-testid="forgot-password-link"
              >
                Забыли пароль?
              </button>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[#1B318E] hover:bg-[#2A42A5] text-white rounded-lg font-medium transition-all duration-200"
                data-testid="login-button"
              >
                {isLoading ? "Вход..." : "Войти"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
