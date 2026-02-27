# PRD: Онбординг - Веб-приложение для преподавателей НИУ ВШЭ

## Original Problem Statement
Разработать веб-версию с адаптивом, основываясь на макетах Figma. Приложение для онбординга преподавателей с авторизацией, задачами, обучением и документами.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI + MongoDB (currently using in-memory mock data)
- **Auth**: Role-based auth (teacher / admin)
- **Test Users**: 
  - Teacher: test@test.ru / test
  - Admin: test_admin@test.ru / test_admin

## User Personas
- **Новый преподаватель** - нуждается в понятном процессе адаптации, быстром доступе к сервисам и материалам
- **Администратор** - управляет контентом (задачами, модулями, уроками, документами)

## Core Requirements (Static)
1. Страница входа с каруселью и формой авторизации
2. Дашборд с хедером, сервисами и 3 табами
3. Таб "Задачи" - чек-лист с возможностью отмечать выполнение
4. Таб "Обучение" - список модулей и уроков
5. Таб "Документы" - шаблоны и памятки с иконками типов файлов
6. Адаптивная верстка для мобильных устройств
7. Админ-панель для управления контентом

## What's Been Implemented

### Feb 27, 2026 - Modules & Lessons Feature
- ✅ Full CRUD for Modules in admin panel (side-page form)
- ✅ Full CRUD for Lessons with WYSIWYG editor (react-quill-new)
- ✅ Lesson modal with tabs (Description / Content)
- ✅ **Editor mode toggle: Visual (WYSIWYG) / HTML code**
- ✅ Teacher view: modules list in Learning tab
- ✅ Teacher view: lessons list in modal with content display
- ✅ **Real-time sync: teacher sees updated content immediately**
- ✅ API endpoints: /api/admin/modules, /api/admin/lessons, /api/modules (public)

### Feb 24, 2026 - Admin Panel & Teacher Dashboard
- ✅ Login page with 3-slide carousel and auth form
- ✅ Role-based authentication (teacher / admin)
- ✅ Teacher Dashboard:
  - Sticky header, user profile, logout
  - 8 service cards
  - Tasks tab with checkbox toggle
  - Learning tab (now shows modules)
  - Documents tab with file type icons
- ✅ Admin Dashboard:
  - Sidebar navigation
  - Teachers CRUD (add, edit, status, avatar selection)
  - Tasks CRUD (add, edit, delete, ordering)
  - Documents CRUD (add, edit, delete, external links)
  - Modules & Lessons management
- ✅ Responsive design for mobile devices

## Prioritized Backlog

### P0 (Done)
- [x] Authentication flow with roles
- [x] Teacher dashboard (all tabs)
- [x] Admin panel - Teachers management
- [x] Admin panel - Tasks management
- [x] Admin panel - Documents management
- [x] Admin panel - Modules & Lessons management with WYSIWYG

### P1 (Completed)
- [x] File upload backend (POST /api/upload, GET /api/uploads/{filename})
- [x] Connect frontend file uploads to backend (avatars, documents)

### P2 (Enhancements)
- [ ] Progress persistence in MongoDB
- [ ] Course/lesson completion tracking per user
- [ ] Real JWT authentication
- [ ] Password reset flow

## Technical Notes
- WYSIWYG editor: react-quill-new (compatible with React 19)
- All data is MOCKED in-memory in server.py (not persistent)
- Shadcn/UI components at /app/frontend/src/components/ui/

## Next Tasks
1. Implement backend for file uploads (POST /api/upload)
2. Persist data in MongoDB instead of in-memory
3. Add lesson completion tracking
