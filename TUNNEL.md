# Туннель управления Canvibe

API сервер для полного управления приложением Canvibe запущен на **порту 14141**.

## Статус

✅ API сервер запускается автоматически вместе с приложением  
✅ Доступен на: `http://127.0.0.1:14141`  
✅ CORS включен для всех источников

## Быстрый тест

```bash
curl http://127.0.0.1:14141/health
```

Должен вернуть:
```json
{
  "success": true,
  "message": "Canvibe API is running",
  "data": {
    "version": "0.1.0",
    "status": "healthy"
  }
}
```

## Примеры использования

### Создать событие

```bash
curl -X POST http://127.0.0.1:14141/events \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "INTENT_DECLARED",
    "data": {
      "text": "Добавить новую фичу",
      "intent_id": "intent_001"
    }
  }'
```

### Получить все события

```bash
curl http://127.0.0.1:14141/events
```

### Управление холстом

```bash
# Установить зум
curl -X POST http://127.0.0.1:14141/canvas/zoom \
  -H "Content-Type: application/json" \
  -d '{"zoom": 2.0}'

# Установить позицию
curl -X POST http://127.0.0.1:14141/canvas/position \
  -H "Content-Type: application/json" \
  -d '{"x": 100, "y": 200}'
```

### Создать узел

```bash
curl -X POST http://127.0.0.1:14141/nodes \
  -H "Content-Type: application/json" \
  -d '{
    "type": "intent",
    "x": 100,
    "y": 100,
    "data": {
      "text": "Новая задача"
    }
  }'
```

## TypeScript API клиент

Используйте готовый клиент в `src/services/api.ts`:

```typescript
import { canvibeApi } from '@/services/api';

// Проверка здоровья
await canvibeApi.healthCheck();

// Создать событие
await canvibeApi.createEvent('INTENT_DECLARED', {
  text: 'Новая задача'
});

// Управление холстом
await canvibeApi.setZoom(2.0);
await canvibeApi.setPosition(100, 200);
```

## Интеграция

Теперь я (AI) могу полностью управлять приложением через этот API:
- Читать события
- Создавать новые события
- Управлять узлами на холсте
- Изменять состояние холста (зум, позиция)
- Получать состояние приложения

Полная документация в `API.md`.
