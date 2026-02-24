# PRD: Онбординг - Веб-приложение для преподавателей НИУ ВШЭ

## Original Problem Statement
Разработать веб-версию с адаптивом, основываясь на макетах Figma. Приложение для онбординга преподавателей с авторизацией, задачами, обучением и документами.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI + MongoDB
- **Auth**: Simple login with test@test.ru / test

## User Personas
- **Новый преподаватель** - нуждается в понятном процессе адаптации, быстром доступе к сервисам и материалам

## Core Requirements (Static)
1. Страница входа с каруселью и формой авторизации
2. Дашборд с хедером, сервисами и 3 табами
3. Таб "Задачи" - чек-лист с возможностью отмечать выполнение
4. Таб "Обучение" - список курсов со статусом прохождения
5. Таб "Документы" - шаблоны и памятки с иконками типов файлов
6. Адаптивная верстка для мобильных устройств

## What's Been Implemented (Feb 24, 2026)
- ✅ Login page with 3-slide carousel and auth form
- ✅ Dashboard with sticky header, user profile, logout
- ✅ 8 service cards (Сайт Вышки, Почта, LMS, Расписание, Библиотека, HR-портал, Справочник, Wiki)
- ✅ Tasks tab with 5 tasks, checkbox toggle, progress counter
- ✅ Learning tab with 6 course modules, completion status
- ✅ Documents tab with 10 documents, file type icons (doc, xls, pdf, zip)
- ✅ Responsive design for mobile devices
- ✅ API endpoints: login, tasks, courses, documents, services, stats

## Prioritized Backlog

### P0 (Done)
- [x] Authentication flow
- [x] Dashboard layout
- [x] All 3 content tabs
- [x] Responsive design

### P1 (Future Admin Panel)
- [ ] Admin panel for content management
- [ ] CRUD operations for tasks, courses, documents
- [ ] User management

### P2 (Enhancements)
- [ ] Progress persistence in database
- [ ] Course completion tracking
- [ ] Document download functionality
- [ ] Real authentication with JWT
- [ ] Password reset flow

## Next Tasks
1. Create admin panel for content management
2. Implement real database persistence for task states
3. Add document download functionality
4. Implement course progress tracking
