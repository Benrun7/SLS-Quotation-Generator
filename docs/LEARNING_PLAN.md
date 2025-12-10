# План обучения разработчика

> Параллельно со Sprint 1 и 2

## 🎯 Цель

К концу Sprint 2 (31.12) освоить:
- ✅ JavaScript (основы + продвинутое)
- ✅ Git (базовые команды)
- ✅ Node.js + REST API
- ✅ React (базовое понимание)
- ⏭️ Prisma + PostgreSQL

---

## Неделя 1 (08.12 - 15.12) — Во время Sprint 1, Days 1-8

### Git — Just-in-time обучение

**Когда учить:** По мере необходимости

| Команда | Зачем | Когда использовать |
|---------|-------|-------------------|
| `git init` | Создать репозиторий | Один раз в начале |
| `git add .` | Добавить файлы в staging | Перед каждым коммитом |
| `git commit -m "..."` | Зафиксировать изменения | После каждой завершённой задачи |
| `git status` | Посмотреть изменения | Часто, для контроля |
| `git log` | История коммитов | Когда нужно вспомнить |
| `git push` | Отправить на GitHub | После нескольких коммитов |

**Практика:**
```bash
# Сразу создай репозиторий для проекта
git init
git add .
git commit -m "feat: Initial commit with documentation"

# Создай репозиторий на GitHub и подключи
git remote add origin https://github.com/твой-username/3D-Quotation-Ecosystem.git
git push -u origin main
```

**Правило:** Коммит после каждой выполненной User Story

---

### JavaScript — Изучение по темам задач

**Базовые концепции (День 1-3):**

| Тема | Ресурс | Время | Применение в проекте |
|------|--------|-------|---------------------|
| Переменные (let, const) | [JavaScript.info](https://learn.javascript.ru/variables) | 20 мин | Хранение данных |
| Типы данных | [JavaScript.info](https://learn.javascript.ru/types) | 30 мин | Работа с числами, строками |
| Функции | [JavaScript.info](https://learn.javascript.ru/function-basics) | 40 мин | Расчёты, обработчики |
| Стрелочные функции | [JavaScript.info](https://learn.javascript.ru/arrow-functions-basics) | 20 мин | Современный синтаксис |

**Практика (День 3-4):**
```javascript
// Твоя первая функция для проекта
const calculatePrice = (volume, tariff, quantity = 1) => {
  return volume * tariff * quantity;
};

console.log(calculatePrice(15.5, 50, 2)); // 1550
```

**Массивы и объекты (День 4-5):**

| Тема | Ресурс | Время | Применение |
|------|--------|-------|-----------|
| Массивы | [JavaScript.info](https://learn.javascript.ru/array) | 30 мин | Списки моделей |
| Методы массивов | [JavaScript.info](https://learn.javascript.ru/array-methods) | 60 мин | map, filter, reduce |
| Объекты | [JavaScript.info](https://learn.javascript.ru/object) | 40 мин | Модель данных |

**Практика (День 5-6):**
```javascript
// Работа с массивом моделей
const models = [
  { name: "Деталь 1", volume: 15.5, technology: "FDM", quantity: 2 },
  { name: "Деталь 2", volume: 8.3, technology: "SLA", quantity: 1 }
];

// Рассчитать общую стоимость
const tariffs = { FDM: 50, SLA: 100 };
const total = models.reduce((sum, model) => {
  const price = model.volume * tariffs[model.technology] * model.quantity;
  return sum + price;
}, 0);

console.log(total); // 2380
```

**Асинхронность (День 7-8):**

| Тема | Ресурс | Время | Применение |
|------|--------|-------|-----------|
| Промисы | [JavaScript.info](https://learn.javascript.ru/promise-basics) | 40 мин | API запросы |
| async/await | [JavaScript.info](https://learn.javascript.ru/async-await) | 30 мин | Чистый код для API |
| fetch API | [MDN](https://developer.mozilla.org/ru/docs/Web/API/Fetch_API/Using_Fetch) | 30 мин | HTTP запросы |

**Практика (День 8):**
```javascript
// Сохранение расчёта через API
async function saveCalculation(data) {
  try {
    const response = await fetch('http://localhost:3001/api/calculations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) throw new Error('Network error');
    
    const result = await response.json();
    console.log('Сохранено:', result);
  } catch (error) {
    console.error('Ошибка:', error);
  }
}
```

---

## Неделя 2 (16.12 - 22.12) — Sprint 1, Days 9-12 + выходные

### Node.js + REST API

**Основы Node.js (День 9-10):**

| Тема | Ресурс | Время |
|------|--------|-------|
| Что такое Node.js | [Node.js Introduction](https://nodejs.org/en/learn/getting-started/introduction-to-nodejs) | 20 мин |
| Модули (import/export) | [JavaScript.info](https://learn.javascript.ru/modules-intro) | 30 мин |
| npm basics | [npm Docs](https://docs.npmjs.com/getting-started) | 20 мин |

**Fastify (День 10-11):**

| Тема | Практика |
|------|----------|
| Hello World | [Fastify Quickstart](https://fastify.dev/docs/latest/Guides/Getting-Started/) |
| Роуты (GET, POST) | Создать `/health`, `/api/calculations` |
| Request/Response | Обработка тела запроса |
| CORS | Разрешить запросы с фронтенда |

**Практика (Day 11):**
```javascript
// apps/api/server.js
import Fastify from 'fastify';

const app = Fastify({ logger: true });

app.get('/api/hello', async (request, reply) => {
  return { message: 'Hello from API!' };
});

app.post('/api/calculations', async (request, reply) => {
  const { tariff, items } = request.body;
  // TODO: сохранить в БД
  return { status: 'created', id: 123 };
});

app.listen({ port: 3001 });
```

---

### Prisma + PostgreSQL (День 11-12)

| Тема | Ресурс | Время |
|------|--------|-------|
| Что такое ORM | [Prisma Introduction](https://www.prisma.io/docs/concepts/overview/what-is-prisma) | 15 мин |
| Prisma Schema | [Prisma Schema](https://www.prisma.io/docs/concepts/components/prisma-schema) | 30 мин |
| Миграции | [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate) | 20 мин |
| CRUD операции | [Prisma Client](https://www.prisma.io/docs/concepts/components/prisma-client) | 40 мин |

**Основные команды:**
```bash
# Создать клиента Prisma
npx prisma generate

# Создать миграцию
npx prisma migrate dev --name add_calculations

# Открыть UI для БД
npx prisma studio
```

**Практика (Day 12):**
```javascript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Создать расчёт
const calculation = await prisma.calculation.create({
  data: {
    tariff: 50,
    total: 1550,
    items: {
      create: [
        { fileName: "part1.stl", volume: 15.5, quantity: 2, price: 1550 }
      ]
    }
  },
  include: { items: true }
});

// Получить все расчёты
const all = await prisma.calculation.findMany();
```

---

## Неделя 3-4 (23.12 - 31.12) — Sprint 2

### React основы

**Когда учить:** После завершения бэкенда (Day 12+)

| Тема | Ресурс | Время | Приоритет |
|------|--------|-------|-----------|
| JSX | [React: Writing Markup](https://react.dev/learn/writing-markup-with-jsx) | 30 мин | High |
| Компоненты | [React: Your First Component](https://react.dev/learn/your-first-component) | 40 мин | High |
| Props | [React: Passing Props](https://react.dev/learn/passing-props-to-a-component) | 30 мин | High |
| useState | [React: State](https://react.dev/learn/state-a-components-memory) | 40 мин | High |
| Списки | [React: Rendering Lists](https://react.dev/learn/rendering-lists) | 30 мин | Medium |
| События | [React: Responding to Events](https://react.dev/learn/responding-to-events) | 20 мин | Medium |

> **Примечание:** Для Sprint 2 можно обойтись vanilla JS. React — на будущее.

---

## 📚 Дополнительные ресурсы

### Видео-курсы (если предпочитаешь видео)
- [JavaScript за час (основы)](https://www.youtube.com/watch?v=W6NZfCO5SIk) — русский
- [Node.js за 1 час](https://www.youtube.com/watch?v=3aGSqasVPsI) — русский
- [Fullstack за 2 часа](https://www.youtube.com/watch?v=Oi4v5uxTY5o) — английский с субтитрами

### Шпаргалки
- [JavaScript Cheatsheet](https://htmlcheatsheet.com/js/)
- [Git Cheatsheet](https://education.github.com/git-cheat-sheet-education.pdf)
- [Prisma Cheatsheet](https://www.prisma.io/dataguide/postgresql/reading-and-querying-data)

### Сообщества (если застрял)
- [Stack Overflow](https://stackoverflow.com) — на английском
- [Хекслет: форум](https://ru.hexlet.io/community) — на русском
- [GitHub Discussions](https://github.com/discussions) — искать решения

---

## 🎯 Минимальный набор к концу Sprint 1

К 19.12 ты должен уметь:
- ✅ Писать функции на JS
- ✅ Работать с массивами (map, filter, reduce)
- ✅ Делать fetch запросы
- ✅ Создавать REST API на Fastify
- ✅ Работать с Prisma (create, findMany)
- ✅ Базовые команды Git

**Это реально за 12 дней?** Да, если по 2-3 часа в день с фокусом на практику.

---

## 🎓 Оценка прогресса

После каждой недели спроси себя:

**Week 1:**
- [ ] Могу ли я написать функцию расчёта?
- [ ] Понимаю ли разницу между `let` и `const`?
- [ ] Могу ли работать с массивами объектов?
- [ ] Понимаю ли async/await?

**Week 2:**
- [ ] Могу ли создать простой API endpoint?
- [ ] Понимаю ли, как работает Prisma?
- [ ] Могу ли сохранить данные в БД?
- [ ] Могу ли подключить фронтенд к бэкенду?

Если на 50%+ ответов "Да" — ты молодец, продолжай!

---

*Создано: 10.12.2024*
*Обновляется по ходу обучения*

