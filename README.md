# Email Builder — конструктор HTML email

**Версия:** 0.1.0 (MVP)

## Идея

Конструктор HTML email-шаблонов с:
- Drag-and-drop или JSON-описание блоков
- AI-генерация по описанию
- Встроенный хостинг картинок (S3-like)
- Preview в браузере
- Экспорт в HTML

## Архитектура

```
email-builder/
├── cmd/server/          # HTTP server
├── internal/
│   ├── generator/       # Генерация HTML из JSON
│   ├── storage/        # S3-like хранилище картинок
│   ├── templates/      # Готовые шаблоны
│   └── api/            # Handlers
├── web/                 # Frontend (Telegram Mini App)
└── storage/             # Папка для картинок
```

## API Endpoints

- `POST /api/generate` — сгенерировать email из JSON
- `POST /api/ai-generate` — AI-генерация по тексту
- `POST /api/upload` — загрузить картинку
- `GET /api/template/:id` — получить шаблон
- `GET /api/html/:id` — получить готовый HTML

## Frontend

Telegram Mini App с:
- Выбор типа письма (E-commerce, SaaS, B2B, etc.)
- Редактирование блоков
- Preview
- Скачать/Отправить

## S3-like Storage

Минимальный S3-совместимый API:
- `PUT /storage/:key` — загрузить
- `GET /storage/:key` — скачать
- `DELETE /storage/:key` — удалить
- Лимит: 5MB на файл, 100MB всего

---

## Roadmap

- [ ] v0.1 — Базовый генератор (JSON → HTML)
- [ ] v0.2 — Загрузка картинок
- [ ] v0.3 — AI-генерация
- [ ] v0.4 — Frontend
- [ ] v1.0 — Релиз

---

*Created: 2026-02-26*
