import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Carousel slides data matching Figma design exactly
const CAROUSEL_SLIDES = [
  {
    id: 1,
    image: "/images/slide1-whale.svg",
    title: "Разберитесь в правилах за 15 минут",
    description: "Ключевые требования и цифровые сервисы — кратко и по делу, без погружения в лишние регламенты"
  },
  {
    id: 2,
    image: "/images/slide2-meditation.svg",
    title: "Осваивайте только то, что нужно для работы",
    description: "Короткие практические блоки, которые можно пройти за несколько минут и сразу применить в работе"
  },
  {
    id: 3,
    image: "/images/slide3-idea.svg",
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
    <div className="min-h-screen bg-[#F0F0F5] flex items-center justify-center p-4 lg:p-8" data-testid="login-page">
      <div className="w-full max-w-[1000px] bg-white rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
        
        {/* Left side - Carousel */}
        <div className="bg-[#E8E0F0] p-6 lg:p-10 flex flex-col justify-between hidden lg:flex">
          {/* Image container */}
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-[380px] h-[340px] relative flex items-center justify-center">
              <img 
                key={currentSlide}
                src={CAROUSEL_SLIDES[currentSlide].image}
                alt={CAROUSEL_SLIDES[currentSlide].title}
                className="max-w-full max-h-full object-contain animate-fade-in"
                data-testid={`carousel-image-${currentSlide}`}
              />
            </div>
          </div>
          
          {/* Text content */}
          <div className="space-y-4">
            <h2 className="text-2xl lg:text-[28px] font-bold text-[#1B318E] leading-tight font-heading">
              {CAROUSEL_SLIDES[currentSlide].title}
            </h2>
            <p className="text-gray-600 text-base leading-relaxed">
              {CAROUSEL_SLIDES[currentSlide].description}
            </p>
            
            {/* Carousel dots */}
            <div className="flex gap-2 pt-4">
              {CAROUSEL_SLIDES.map((_, index) => (
                <button
                  key={index}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    index === currentSlide 
                      ? 'bg-[#1B318E] w-6' 
                      : 'bg-gray-300 w-2.5 hover:bg-gray-400'
                  }`}
                  onClick={() => setCurrentSlide(index)}
                  aria-label={`Слайд ${index + 1}`}
                  data-testid={`carousel-dot-${index}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="p-8 lg:p-12 flex flex-col justify-center">
          <div className="w-full max-w-[360px] mx-auto">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 rounded-full bg-[#1B318E] flex items-center justify-center overflow-hidden">
                <img 
                  src="/images/hse-logo.svg" 
                  alt="ВШЭ" 
                  className="w-full h-full"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<span class="text-white text-xl font-bold">В</span>';
                  }}
                />
              </div>
              <h1 className="text-2xl font-bold text-[#1B318E] font-heading">
                Онбординг
              </h1>
            </div>

            {/* Login Form */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-8 font-heading">Вход</h2>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-600 text-sm sr-only">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 rounded-xl border-gray-200 bg-white focus:border-[#1B318E] focus:ring-[#1B318E]/20 text-base px-5"
                    data-testid="email-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-600 text-sm sr-only">Пароль</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Пароль"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-14 rounded-xl border-gray-200 bg-white focus:border-[#1B318E] focus:ring-[#1B318E]/20 text-base px-5 pr-14"
                      data-testid="password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                      data-testid="toggle-password"
                    >
                      {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className="text-sm text-[#1B318E] hover:underline font-medium"
                  data-testid="forgot-password-link"
                >
                  Забыли пароль?
                </button>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 bg-[#1B318E] hover:bg-[#152570] text-white rounded-xl font-medium text-base transition-all duration-200 mt-4"
                  data-testid="login-button"
                >
                  {isLoading ? "Вход..." : "Войти"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
