# Canvibe API - Туннель управления

API сервер запускается автоматически вместе с приложением на порту **14141**.

## Базовый URL

```
http://127.0.0.1:14141
```

## Эндпоинты

### Health Check

```http
GET /health
```

Проверка работоспособности API.

**Ответ:**
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

### События (Events)

#### Получить все события

```http
GET /events
GET /events?type=INTENT_DECLARED
```

**Ответ:**
```json
{
  "success": true,
  "message": "Found 10 events",
  "data": [...]
}
```

#### Создать событие

```http
POST /events
Content-Type: application/json

{
  "event_type": "INTENT_DECLARED",
  "data": {
    "intent_id": "intent_001",
    "text": "Добавить авторизацию"
  }
}
```

#### Получить событие по ID

```http
GET /events/{id}
```

### Узлы (Nodes)

#### Получить все узлы

```http
GET /nodes
```

#### Создать узел

```http
POST /nodes
Content-Type: application/json

{
  "type": "intent",
  "x": 100,
  "y": 100,
  "data": {...}
}
```

### Холст (Canvas)

#### Получить состояние холста

```http
GET /canvas/state
```

#### Обновить состояние холста

```http
POST /canvas/state
Content-Type: application/json

{
  "zoom": 1.5,
  "position": {"x": 100, "y": 200}
}
```

#### Установить зум

```http
POST /canvas/zoom
Content-Type: application/json

{
  "zoom": 2.0
}
```

#### Установить позицию

```http
POST /canvas/position
Content-Type: application/json

{
  "x": 150,
  "y": 250
}
```

## Примеры использования

### JavaScript/TypeScript

```typescript
import { canvibeApi } from './services/api';

// Проверка здоровья
const health = await canvibeApi.healthCheck();
console.log(health);

// Создать событие
await canvibeApi.createEvent('INTENT_DECLARED', {
  intent_id: 'intent_001',
  text: 'Добавить авторизацию'
});

// Получить все события
const events = await canvibeApi.getEvents();
console.log(events.data);

// Установить зум холста
await canvibeApi.setZoom(2.0);
```

### cURL

```bash
# Проверка здоровья
curl http://127.0.0.1:14141/health

# Создать событие
curl -X POST http://127.0.0.1:14141/events \
  -H "Content-Type: application/json" \
  -d '{"event_type":"INTENT_DECLARED","data":{"text":"Тест"}}'

# Получить события
curl http://127.0.0.1:14141/events

# Установить зум
curl -X POST http://127.0.0.1:14141/canvas/zoom \
  -H "Content-Type: application/json" \
  -d '{"zoom":1.5}'
```

## Интеграция с фронтендом

API автоматически доступен через `src/services/api.ts`:

```typescript
import { canvibeApi } from '@/services/api';

// Использование в компонентах
const handleCreateEvent = async () => {
  await canvibeApi.createEvent('INTENT_DECLARED', {
    text: 'Новая задача'
  });
};
```
