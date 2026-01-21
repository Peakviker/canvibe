# Автоматическое тестирование API туннеля

$apiUrl = "http://127.0.0.1:14141"

Write-Host "🧪 Тестирование API туннеля Canvibe..." -ForegroundColor Cyan

# 1. Проверка здоровья
Write-Host "`n1. Проверка здоровья..." -ForegroundColor Yellow
$health = Invoke-RestMethod -Uri "$apiUrl/health" -Method Get
if ($health.success) {
    Write-Host "✅ API работает: $($health.message)" -ForegroundColor Green
} else {
    Write-Host "❌ API не работает" -ForegroundColor Red
    exit 1
}

# 2. Создание события
Write-Host "`n2. Создание события..." -ForegroundColor Yellow
$eventData = @{
    event_type = "INTENT_DECLARED"
    data = @{
        intent_id = "test_001"
        text = "Тест API туннеля"
        source = "api"
    }
} | ConvertTo-Json

$newEvent = Invoke-RestMethod -Uri "$apiUrl/events" -Method Post -Body $eventData -ContentType "application/json"
if ($newEvent.success) {
    Write-Host "✅ Событие создано: $($newEvent.message)" -ForegroundColor Green
    Write-Host "   ID: $($newEvent.data.id)" -ForegroundColor Gray
} else {
    Write-Host "❌ Не удалось создать событие" -ForegroundColor Red
}

# 3. Получение всех событий
Write-Host "`n3. Получение всех событий..." -ForegroundColor Yellow
$events = Invoke-RestMethod -Uri "$apiUrl/events" -Method Get
if ($events.success) {
    Write-Host "✅ Найдено событий: $($events.data.Count)" -ForegroundColor Green
} else {
    Write-Host "❌ Не удалось получить события" -ForegroundColor Red
}

# 4. Управление холстом
Write-Host "`n4. Управление холстом..." -ForegroundColor Yellow
$zoomData = @{ zoom = 2.0 } | ConvertTo-Json
$zoomResult = Invoke-RestMethod -Uri "$apiUrl/canvas/zoom" -Method Post -Body $zoomData -ContentType "application/json"
if ($zoomResult.success) {
    Write-Host "✅ Зум установлен: $($zoomResult.message)" -ForegroundColor Green
}

$posData = @{ x = 100; y = 200 } | ConvertTo-Json
$posResult = Invoke-RestMethod -Uri "$apiUrl/canvas/position" -Method Post -Body $posData -ContentType "application/json"
if ($posResult.success) {
    Write-Host "✅ Позиция установлена: $($posResult.message)" -ForegroundColor Green
}

Write-Host "`n✨ Все тесты пройдены!" -ForegroundColor Green
