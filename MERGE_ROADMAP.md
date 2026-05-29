# Дорожная карта: Upstream merge gallery-dev (Этапы 3–5)

## Контекст

**Репозиторий**: `/home/alexey/gallery-dev`  
**Ветка**: `prod/current`  
**Upstream remote**: `upstream/main` (https://github.com/open-noodle/gallery.git)  
**Merge base**: `c20107dee3` (19 мая 2026)  
**Upstream HEAD**: `f38182bec4` (31 мая 2026)  

Этапы 1–2 уже выполнены. HEAD сейчас: `27f16dabb4`.

---

## ⚠️ КРИТИЧЕСКИ ВАЖНО — не потерять

В файле `mobile/lib/infrastructure/repositories/sync_stream.repository.dart` **уже есть наш FK-фикс** (закоммичен как `46faa689c6`). При мерже любого upstream-коммита затрагивающего этот файл — **сохранить метод `_resolveKnownPersonIds` и его вызовы в `updateAssetFacesV1` / `updateAssetFacesV2`**.

---

## Этап 3 — Mobile: Background Backup Reliability (`7c96bc9`)

**Дата**: 29 мая 2026  
**Cherry-pick**: `git cherry-pick 7c96bc9b20245090ff0bb2018ad3e187df494f10 --no-edit`

### Стратегия

Этот коммит большой. Вместо cherry-pick'а — **применить файлы напрямую из upstream**, исключая конфликтные, затем вручную смержить конфликтные.

### Новые файлы (взять напрямую из upstream — нет конфликтов)

```bash
git checkout upstream/main -- \
  mobile/lib/domain/services/background_backup_event_recorder.dart \
  mobile/lib/domain/services/background_backup_loop.dart \
  mobile/lib/services/background_backup_reminder.service.dart \
  mobile/lib/services/background_backup_status.service.dart \
  mobile/lib/utils/background_downloader_recovery.dart \
  mobile/lib/widgets/backup/background_backup_health_banner.dart \
  mobile/lib/domain/models/background_backup_status.model.dart
```

### Конфликтные файлы — правила разрешения

#### `mobile/lib/domain/models/store.model.dart`
- Upstream добавляет новые `StoreKey` для backup state
- **Принять upstream версию целиком**, наши изменения минимальны
- `git checkout upstream/main -- mobile/lib/domain/models/store.model.dart`

#### `mobile/lib/providers/backup/drift_backup.provider.dart`
- У нас: незначительные изменения (исправление работы с nullable)
- Upstream: рефакторинг логики запуска backup
- **cherry-pick + разрешить конфликты вручную, приоритет upstream**

#### `mobile/lib/domain/services/background_worker.service.dart`
- Upstream существенно рефакторил (добавил `BackupLoop`, event recording)
- У нас: минимальные изменения
- **Принять upstream, перепроверить наши изменения и применить поверх**

#### `mobile/lib/infrastructure/repositories/sync_stream.repository.dart`
- ⚠️ **КРИТИЧНО**: наш FK-фикс уже закоммичен — это `46faa689c6`
- Upstream добавил `_hideReferencedLivePhotoMotionAssets()` в `updateAssetsV1`
- Этот же метод **уже применён** в файле (cherry-pick был сделан ранее)
- При конфликте: взять текущий HEAD, т.е. нашу версию (она уже содержит upstream изменения)

#### `mobile/lib/pages/backup/drift_backup.page.dart`
- Upstream добавил `BackgroundBackupHealthBanner`
- Взять upstream и убедиться что import'ы корректны

#### `mobile/pigeon/background_worker_api.dart` + `.g.dart` файлы
- Pigeon-generated файлы (Kotlin/Swift/Dart)
- **Взять напрямую из upstream**:
  ```bash
  git checkout upstream/main -- \
    mobile/pigeon/background_worker_api.dart \
    mobile/lib/platform/background_worker_api.g.dart \
    mobile/android/app/src/main/kotlin/app/alextran/immich/background/BackgroundWorker.g.kt \
    mobile/android/app/src/main/kotlin/app/alextran/immich/background/BackgroundWorker.kt \
    mobile/ios/Runner/Background/BackgroundWorker.g.swift \
    mobile/ios/Runner/Background/BackgroundWorkerApiImpl.swift
  ```

#### `mobile/lib/main.dart`
- Upstream регистрирует новые сервисы (BackupReminderService, BackupStatusService)
- Взять upstream, убедиться что наш EasyLocalization init сохранён (строки с `EasyLocalization.ensureInitialized()`)

#### `i18n/en.json`
- Upstream добавил ключи: `background_backup_*`, `backup_health_*`
- У нас добавлены ключи: `saved_location_*`, брендинг-строки
- **Объединить JSON вручную**: взять upstream как базу, добавить наши ключи поверх
  ```bash
  # 1. Посмотреть наши добавленные ключи:
  git diff c20107dee3..HEAD -- i18n/en.json
  # 2. Взять upstream:
  git checkout upstream/main -- i18n/en.json
  # 3. Добавить наши ключи вручную в алфавитном порядке
  ```

### Commit после Этапа 3
```bash
git add -A
git commit -m "feat(mobile): reliable & honest background backup (#639) — cherry-pick with FK-fix preserved"
```

---

## Этап 4 — Mobile: Infinite Scroll + Sort for Live Search (`115c89e`)

**Дата**: 31 мая 2026  
**Cherry-pick**: `git cherry-pick 115c89ea13fe096df722117e2d867c9c19b925d5 --no-edit`

### Ключевые изменения в этом коммите

1. **УДАЛЁН** `mobile/lib/presentation/pages/search/drift_search.page.dart` (919 строк)
2. **УДАЛЁН** `mobile/lib/presentation/pages/search/paginated_search.provider.dart`
3. **УДАЛЁН** `mobile/lib/providers/search/search_input_focus.provider.dart`
4. **ДОБАВЛЕН** `mobile/lib/providers/photos_filter/photos_filter_search.provider.dart`
5. **ДОБАВЛЕН** `mobile/lib/presentation/widgets/timeline/scroll_drain.dart`
6. **ДОБАВЛЕН** `mobile/lib/presentation/widgets/filter_sheet/sort_icon_button.widget.dart`

### Стратегия

Сначала проверить: меняли ли мы `drift_search.page.dart`?
```bash
git diff c20107dee3..HEAD -- mobile/lib/presentation/pages/search/drift_search.page.dart
```
Если diff пустой — нет наших изменений, удаление принять автоматически.

### Конфликтные файлы — правила

#### `mobile/lib/models/search/search_filter.model.dart`
- Upstream: добавляет `isUntagged` boolean в `SearchDisplayFilters`
- Мы: добавляли кастомные поля для localization/saved_location фильтров
- **Принять upstream изменения + наши поля**: оба добавляли разные поля в один класс, конфликт механический

#### `mobile/lib/providers/photos_filter/photos_filter.provider.dart`
- Upstream рефакторил для нового search engine
- У нас — изменения для наших кастомных фильтров
- **Вручную объединить**: наши кастомные фильтры нужно сохранить

#### `mobile/lib/presentation/widgets/timeline/timeline.widget.dart`
- Upstream: добавил `ScrollDrain` для infinite scroll
- У нас: возможны минимальные изменения
- **Приоритет upstream**, наши изменения применить поверх

#### `mobile/lib/presentation/pages/dev/main_timeline.page.dart`
- **Взять upstream целиком** — dev-only страница, нет наших критичных изменений

#### `mobile/lib/routing/router.dart` + `router.gr.dart`
- Upstream убирает маршрут к удалённому `DriftSearchPage`
- **Взять upstream целиком**

### Commit после Этапа 4
```bash
git add -A
git commit -m "feat(mobile): infinite scroll + sort for live search (#654)"
```

---

## Этап 5 — Оставшиеся 4 коммита

Применять **последовательно**, каждый отдельным cherry-pick:

### 5a: `aba527c` — web: space person face thumbnail (#615)
```bash
git cherry-pick aba527c9448a8bfed216babb73a1440397a40485 --no-edit
```
**Конфликт**: `web/src/lib/utils/people-utils.ts`
- Upstream добавляет `getThumbnailUrl` для non-owner viewer
- Мы меняли alias logic
- **Взять оба изменения**: разные функции, конфликт только в расположении

### 5b: `0dafb58` — mobile: stabilize search filters (#627)
```bash
git cherry-pick 0dafb58bb814f37b0cc4a4f8de1545b835f59464 --no-edit
```
**Файлы**: `sync_stream.repository.dart` (наш FK-фикс уже есть), `search_filter.model.dart`
- При конфликте в `sync_stream` — взять HEAD (наша версия уже содержит upstream Live Photo fix)
- При конфликте в `search_filter` — взять оба изменения

### 5c: `2e1299d` — mobile: scroll to date from memories (#643)
```bash
git cherry-pick 2e1299dcc07e05066c0ba006d3ec086e65953020 --no-edit
```
**Конфликт**: `timeline.widget.dart`, `scroll_to_date_notifier.provider.dart`
- Upstream изменения аддитивны (scroll behavior)
- **Взять upstream**, проверить что наш код не нарушен

### 5d: `f38182b` — mobile: drain HTTP before iOS teardown (#657)
```bash
git cherry-pick f38182bec4285ffbc659826accd31b6a8140eb0d --no-edit
```
**Новый файл**: `mobile/lib/infrastructure/repositories/draining_http_client.dart`
- `network.repository.dart` — upstream добавляет `DrainingHttpClient`
- **Взять upstream целиком** для обоих файлов

---

## Верификация (обязательно после всех этапов)

```bash
# 1. Flutter analyze
cd /home/alexey/gallery-dev/mobile && flutter analyze 2>&1 | tail -5

# 2. Сборка APK
flutter build apk --release 2>&1 | tail -5

# 3. Установка на устройство (IPv4 only!)
adb -s 192.168.100.178:38107 install --user 0 -r \
  build/app/outputs/flutter-apk/app-release.apk

# 4. Server TypeScript check
cd /home/alexey/gallery-dev/server && npx tsc --noEmit 2>&1 | head -20
```

### Что проверить на устройстве
1. Backup запускается и идёт до конца (нет SqliteException 787)
2. Поиск работает с новым движком (infinite scroll)
3. Memories — кнопка "прокрутить к дате" работает

---

## Быстрый статус cherry-picks

```bash
# Что уже применено:
git log --oneline c20107dee3..HEAD

# Что ещё нужно из upstream:
git log HEAD..upstream/main --oneline
```

## Конфигурация среды

- **ADB device**: `192.168.100.178:38107` (WiFi, только IPv4!)
- **Flutter**: проверить `flutter --version`
- **Сервер**: Docker на `192.168.100.78:2283`
- **Файл с FK-фиксом**: `mobile/lib/infrastructure/repositories/sync_stream.repository.dart` — метод `_resolveKnownPersonIds`
