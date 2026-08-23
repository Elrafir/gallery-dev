# Дорожная карта: финальный статус мержа (2026-08-23)

## ✅ Что сделано

| Этап | Описание | Коммит |
|------|----------|--------|
| ✅ FK-фикс | nullify orphaned personIds (SqliteException 787) | `46faa689` |
| ✅ Branding: email templates | rebrand notifications to Noodle Gallery | `bc03d351` |
| ✅ Branding: app download links | repoint off Immich apps | `de63d7f7` |
| ✅ Server: search people filter | require ALL selected people | `27f16dab` |
| ✅ Mobile: stabilize search + iOS backup | filters + backup notification | `9ca9dbc5` |
| ✅ Server test mock fixes | states field + checkFaceSpaceAccess | `c935346b` |

**HEAD**: `c935346bec (prod/current)`
**APK**: ✅ собран 186.7MB — `mobile/build/app/outputs/flutter-apk/app-release.apk`
**Flutter analyze lib/**: ✅ 0 ошибок (3 deprecation — не критично)

---

## ⏳ Осталось сделать

### 1. Проверить TypeScript (server) — запущена задача, ждёт результата
```bash
cd /home/alexey/gallery-dev/server && npx tsc --noEmit 2>&1 | grep "error TS"
```
**Ожидаем 0 ошибок.** Если есть — смотреть в:
- `src/services/search.service.spec.ts` — добавить `states: []` в mock-объекты
- `test/repositories/access.repository.mock.ts` — уже исправлен `checkFaceSpaceAccess`

### 2. Установить APK на устройство
```bash
# IPv4 only!
adb -s 192.168.100.178:38107 install --user 0 -r \
  /home/alexey/gallery-dev/mobile/build/app/outputs/flutter-apk/app-release.apk
```

**Что проверить на устройстве:**
- [ ] Запускается без крашей
- [ ] Sync без SqliteException(787)
- [ ] Поиск работает (infinite scroll, sort)
- [ ] Фильтр "Сохранённая локация" работает
- [ ] Бэкап запускается при foreground
- [ ] Live photo motion файлы скрыты

### 3. Push в origin
```bash
cd /home/alexey/gallery-dev && git push origin prod/current
```

---

## Что намеренно сохранили (не берём из upstream)

| Файл | Наша кастомизация |
|------|-------------------|
| `mobile/lib/main.dart` | `title: 'Домашний фотоальбом'` |
| `mobile/lib/infrastructure/repositories/search_api.repository.dart` | `_order()` helper + `savedLocationId` |
| `mobile/lib/models/search/search_filter.model.dart` | `savedLocationId` в `SearchLocationFilter` |
| `mobile/lib/providers/backup/drift_backup.provider.dart` | `_isBackgroundBackupGroup` + `_isLivePhotoMotionTask` |
| `mobile/lib/providers/app_life_cycle.provider.dart` | вызов `backgroundBackupReminderService` |

---

## Среда
- **ADB**: `192.168.100.178:38107` (WiFi, только IPv4)
- **Server**: Docker `192.168.100.78:2283`
- **Ветка**: `prod/current`
- **Все upstream коммиты**: c20107dee3..f38182bec4 — обработаны
