# 📸 Gallery (fork of Immich v2.7.5) — Полный снапшот проекта

> Дата: 2026-06-22
> Ветка: `prod/current`
> Проект: `/home/alexey/gallery-dev`
> Организация: open-noodle (Elrafir/gallery-dev)

---

## 1. Общее описание

**Gallery** — кастомный форк Immich v2.7.5 с расширенными функциями: общие пространства (Shared Spaces), система идентификации лиц (Face Identity), per-user overlay метаданных (alias system), локальный геокодер (Nominatim), сохранённые места и продвинутая панель фильтров.

**Docker-образы:** `ghcr.io/open-noodle/gallery-server`, `ghcr.io/open-noodle/gallery-ml`
**Лицензия:** AGPL v3

---

## 2. Инфраструктура и запуск

### Работающие контейнеры

| Контейнер | Порт | Назначение |
|-----------|------|------------|
| `immich_server` | `:2283` | **PROD** сервер (pre-built image) |
| `immich_server_dev` | `:2284` | **DEV** сервер (live-reload, source mount) |
| `immich_web_dev` | `:3001` | DEV фронтенд (SvelteKit HMR) |
| `immich_ml_dev` | `:3004` | DEV machine learning |
| `immich_machine_learning` | — | PROD ML |
| `immich_postgres` | `5432` | **Общая** PostgreSQL (для prod И dev) |
| `immich_redis` | `6379` | Redis |
| `nominatim_local` | `:8088` | Локальный Nominatim (геокодер) |

### Docker Compose файлы (`/docker/`)

- `docker-compose.yml` — Прод (GHCR images)
- `docker-compose.dev.yml` — Dev stack (НЕ содержит postgres — подключается к проду через `immich_default` network)
- `docker-compose.prod.yml` — Локальная прод-сборка + Prometheus + Grafana

### Запуск dev

```bash
cd /home/alexey/gallery-dev
make dev           # или: docker compose -f docker/docker-compose.dev.yml up -d
# Dev server: http://localhost:2284
# Dev web:    http://localhost:3001
# Prod:       http://localhost:2283
```

### Перезапуск dev сервера после изменений

```bash
docker restart immich_server_dev
```

### TypeScript компиляция

```bash
cd /home/alexey/gallery-dev/server
npx tsc --noEmit --pretty 2>&1 | grep "error TS"
```

### ENV файл

```
# docker/.env
DB_PASSWORD=postgres
DB_USERNAME=postgres
DB_DATABASE_NAME=immich
DB_HOSTNAME=immich_postgres
UPLOAD_LOCATION=/mnt/data/Immich_Uploads
```

---

## 3. Технологический стек

| Компонент | Технология |
|-----------|------------|
| Backend | NestJS 11, Kysely 0.28.15, BullMQ, Express 5, TypeScript 6 |
| Frontend | SvelteKit, Svelte 5.55, Vite 8, TypeScript 6 |
| БД | PostgreSQL 14 + vectorchord + pgvectors |
| ML | Python FastAPI, ONNX Runtime |
| Кеш | Valkey (Redis-совместимый) |
| Node | v24.14.1 (mise/volta) |
| Package Manager | pnpm 10.33.0 (workspace monorepo) |
| SDK | `@immich/sdk` (generated from OpenAPI spec) |
| UI Lib | `@immich/ui` |

---

## 4. Структура проекта

```
/home/alexey/gallery-dev/
├── server/src/
│   ├── controllers/     (72 файла)
│   ├── services/        (113 файлов) — бизнес-логика
│   ├── repositories/    (71 файл) — доступ к данным (Kysely)
│   ├── dtos/            (63 файла)
│   ├── schema/
│   │   ├── tables/          (80 таблиц)
│   │   ├── migrations/      (upstream)
│   │   └── migrations-gallery/  (37 кастомных миграций)
│   └── ...
├── web/src/
│   ├── lib/components/
│   │   ├── filter-panel/    ← кастомная панель фильтров
│   │   ├── spaces/          ← UI для Shared Spaces
│   │   └── ...
│   └── routes/(user)/
│       ├── spaces/          ← роуты пространств
│       ├── photos/          ← основной timeline
│       └── ...
├── docker/
├── machine-learning/
├── open-api/                ← OpenAPI spec (959KB)
├── branding/                ← ребрендинг Immich → Gallery
└── CLAUDE.md                ← детальный контекст проекта
```

### Ключевые файлы (по размеру и важности)

| Файл | Строк | Назначение |
|------|-------|------------|
| `server/src/services/shared-space.service.ts` | 2662 | Вся логика Shared Spaces |
| `server/src/repositories/shared-space.repository.ts` | 2811 | Репозиторий Shared Spaces |
| `server/src/repositories/face-identity.repository.ts` | 2778 | Identity-based people queries |
| `server/src/repositories/search.repository.ts` | 1807 | Поиск + геокодер + фильтры |
| `server/src/services/asset.service.ts` | 1050 | Overlay: alias, tags, people |
| `web/.../filter-panel/filter-panel.svelte` | 849 | Панель фильтров |
| `web/.../spaces/[spaceId]/people/[personId]/...` | 770 | Страница человека в space |

---

## 5. Кастомные фичи (форк-специфичные)

### 5.1 Shared Spaces (главная фича)

Система совместных фото-пространств с ролями:

| Роль | Права |
|------|-------|
| **Owner** | Всё: редактирование общих данных, thumbnail, merge, dedup, delete |
| **Editor** | Редактирование своих alias-ов (имя, описание, birthDate, isHidden), просмотр |
| **Viewer** | Только просмотр |

**Таблицы (16+):** `shared_space`, `shared_space_member`, `shared_space_asset`, `shared_space_library`, `shared_space_owner`, `shared_space_person`, `shared_space_person_face`, `shared_space_person_alias`, `shared_space_tag`, `shared_space_tag_override`, `shared_space_activity`, + audit таблицы

### 5.2 Alias System (per-user метаданные)

Ключевая архитектура: **каждый пользователь видит СВОИ правки**, не затрагивая общие данные.

```
shared_space_person          ← общая запись (Owner заполняет)
  ├── name, description, birthDate, isHidden, representativeFaceId
  └── общие для всех

shared_space_person_alias    ← per-user overlay (Editor создаёт)
  ├── alias (подменяет name)
  ├── description, birthDate, isHidden
  └── видит ТОЛЬКО этот пользователь
```

**Как работает:**
1. Owner редактирует → пишет в `shared_space_person` (видят все)
2. Editor редактирует → пишет в `shared_space_person_alias` (видит только он)
3. При чтении: `COALESCE(alias.field, shared.field)` — alias приоритетнее
4. «Сбросить по умолчанию» → удаляет alias, возвращает данные Owner'а

**Где применяется alias:**
- `mapSpacePerson()` — строка ~2640 в shared-space.service.ts
- `applyPersonAliases()` — строка ~332 в asset.service.ts
- SQL: `COALESCE(alias.alias, person.name)` — face-identity.repository.ts (~6 мест)
- SQL: `COALESCE(alias."isHidden", person."isHidden")` — face-identity + search repos (~7 мест)
- SQL: `COALESCE(alias."birthDate", person."birthDate")` — face-identity.repository.ts
- SQL: `COALESCE(alias.description, person.description)` — face-identity.repository.ts

### 5.3 Face Identity System

Identity — абстракция «один и тот же человек» поверх space-person'ов:
- `face_identity` + `face_identity_face` — связь лицо→identity
- `hydrateAccessiblePeople()` — основной запрос People page (~строка 1620 в face-identity.repository.ts)
- `getAccessiblePeopleStatistics()` — подсчёт total/hidden
- `getAccessiblePeopleFaceStatistics()` — подсчёт с face info
- `getAccessiblePeopleCounts()` — total/hidden для UI
- Reconciliation: merge identities при объединении people

### 5.4 Nominatim (локальный геокодер)

**Контейнер:** `nominatim_local` на `:8088`
**Файл:** `search.repository.ts` → `searchPlaces()` (строки ~950-1068)
- Параллельные запросы: text search + structured (country/state)
- `accept-language=ru` — русская локализация
- User-Agent: `Gallery-Dev-Local-Geocoder`
- Fallback к БД через `ILIKE` если Nominatim недоступен

### 5.5 Saved Locations (Сохранённые места)

**Таблица:** `saved_location` (name, label, description, lat, lng, radius, isFavorite, icon)
**Файлы:** `saved-location.service.ts`, `saved-location.repository.ts`, `saved-location.controller.ts`
- API proximity-поиска
- UI привязки фото к местам с radius slider
- Фильтрация timeline по `savedLocationId`

### 5.6 Другие кастомные фичи

- **Filter Panel** — панель фильтров по людям, локации, камере, тегам, рейтингу, типу медиа, избранному, альбомам
- **Classification** — CLIP-based авто-категоризация
- **Pet Detection** — YOLO11, toggleable per space (`petsEnabled`)
- **User Groups** — именованные группы с цветами
- **S3 Storage** — dual disk+S3 backends
- **Storage Migration** — инструмент перемещения между backend'ами
- **Video Duplicate Detection** — multi-frame CLIP embeddings
- **Google Photos Import** — browser-based Takeout wizard
- **OCR Search** — `asset_ocr` + `ocr_search` таблицы

---

## 6. Миграции

**Стратегия двух директорий:**
- `server/src/schema/migrations/` — upstream (перезаписываются при rebase)
- `server/src/schema/migrations-gallery/` — форк (37 миграций, не трогаются)
- `CompositeMigrationProvider` в `composite-migration-provider.ts` → `allowUnorderedMigrations: true`

---

## 7. Проделанная работа в текущей сессии (21-22 июня 2026)

### 7.1 Alias Isolation Fix

**Проблема:** Когда editor редактировал имя/описание человека, правки перезаписывали общую запись `shared_space_person` — все видели чужие изменения.

**Решение:** `updateSpacePerson()` теперь разделяет логику:
- Owner → `shared_space_person` (общее)
- Non-owner → `shared_space_person_alias` (личное)

### 7.2 Description Overlay

**Проблема:** `applyPersonAliases()` не применяла `description` из alias.

**Решение:** Добавлен блок `if (alias.description !== null)` в asset.service.ts.

### 7.3 Thumbnail Owner-Only

**Проблема:** Любой editor мог менять thumbnail (representative face).

**Решение:** `updateSpacePersonRepresentativeFace()` → `requireRole(Owner)`. Кнопка скрыта на фронте для non-owner.

### 7.4 Reset Defaults

**Проблема:** `resetSpacePersonToDefaults()` обнуляла общую запись для всех ролей.

**Решение:** Non-owner → только удаление своего alias. Owner → сброс общей записи + backfill.

### 7.5 isHidden в фильтрах

**Проблема:** Скрытые люди (isHidden) появлялись в панели фильтров «Люди».

**Решение:**
- `updateSpacePerson()` → `isHidden` включён в `hasPersonalOverrides` для non-owner
- 7 SQL-запросов: `COALESCE(alias."isHidden", shared."isHidden")` в face-identity.repository + search.repository

### 7.6 SQL Repairs (ранее в сессии)

- 11 space persons → валидный `representativeFaceId`
- 4 дубликата объединены (Агата, bird, cat, horse)
- `repairMissingEmbeddingRepresentativeFaces()` → вызов перед dedup

### 7.7 Owner Fallback

- `findOwnerSpacePersonOverrides()` — fallback к данным owner'а если у space person пустое имя
- `applySpacePeopleWithOwnerFallback()` — применение overlay на asset detail

---

## 8. Коммиты в текущей сессии

```
46a6cbecf1 fix: per-user alias isHidden in filters, statistics, and people lists
f0fcc48c74 fix: alias isolation for non-owner users, description overlay, thumbnail owner-only, reset defaults
```

Незакоммиченных изменений: **0** (всё закоммичено)

---

## 9. Известные проблемы / TODO

### 9.1 Не проверено пользователем
- [ ] isHidden в фильтрах — скрытые люди не должны появляться (коммит `46a6cbecf1`)
- [ ] Description alias — правки editor'а должны сохраняться и отображаться
- [ ] Alias name — имя editor'а должно отображаться на Space Person page

### 9.2 Потенциальные задачи
- [ ] **Pet Detection** — пользователь хотел отключить (проверить в админке `petsEnabled`)
- [ ] Hardcoded русский текст `"Найти персонажа..."` в `people-filter.svelte:99` → вынести в i18n
- [ ] `buildFilteredSpacePeopleQuery` (search.repository.ts:1612) — не учитывает per-user alias isHidden (нет userId параметра)
- [ ] Проверить tag overlay (`shared_space_tag_override`) — работает ли per-user alias для тегов

### 9.3 Архитектурные заметки
- Dev и Prod используют **одну и ту же** PostgreSQL. Осторожно с миграциями!
- `shared_space_person_alias` → upsert по `(personId, userId)` unique constraint
- `COALESCE(alias.field, shared.field)` — паттерн применяется везде где per-user overlay нужен
- `mapSpacePerson()` (строка ~2637) — единая точка маппинга person → DTO (alias подставляется здесь)

---

## 10. Важные контексты для нового чата

### Терминология пользователя
- **«Мэеновый аккаунт»** = Owner (админ, владелец space)
- **«Дочерний пользователь»** = Editor (член space, не владелец)
- **«Overlay»** / **«оверлей»** = alias (per-user override метаданных)
- **«Main-овое дерево»** = данные Owner'а (дефолтные для всех)
- **«Сбросить по умолчанию»** = удалить свой alias → вернуться к данным Owner'а

### Правила пользователя
1. Editor видит **свои** правки в первую очередь. Если своих нет → данные Owner'а.
2. Editor **НЕ видит** правки других editor'ов.
3. Owner может редактировать **общие** данные (видят все).
4. Thumbnail (representative face) → **только Owner**.
5. Всё должно быть «forward-looking» — без ретроспективных миграций данных.

### Как запускать

```bash
# Перезапуск dev сервера после изменений
docker restart immich_server_dev

# Проверка TypeScript
cd /home/alexey/gallery-dev/server && npx tsc --noEmit --pretty

# Логи dev сервера
docker logs -f immich_server_dev --tail 50

# Dev web: http://localhost:3001
# Dev API: http://localhost:2284
# Prod: http://localhost:2283
```

### Файл CLAUDE.md

В корне проекта есть `/home/alexey/gallery-dev/CLAUDE.md` (12KB) — детальный контекст от предыдущего разработчика. Прочитать при старте нового чата!

---

## 11. Git ветки

| Ветка | Назначение |
|-------|------------|
| `prod/current` ← HEAD | Текущая рабочая (prod+dev правки) |
| `dev` | Синхронизирована с `origin/dev` |
| `main` | Основная (не используется активно) |
| `feature/nominatim-fixes` | Фичабранч геокодера |

**Remotes:** `origin` (gallery-dev), `upstream` (immich)
