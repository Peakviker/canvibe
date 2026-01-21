# Исправление проблем компиляции

## Проблема

Ошибка компиляции: `linker 'link.exe' not found`

## Решение

Установлены Visual Studio Build Tools 2022. Теперь нужно:

1. **Запустить Visual Studio Installer** вручную:
   - Найти "Visual Studio Installer" в меню Пуск
   - Выбрать "Visual Studio Build Tools 2022"
   - Нажать "Изменить"
   - Установить компонент: **"C++ build tools"** или **"Desktop development with C++"**
   - Обязательно включить: Windows 10/11 SDK и MSVC v143 компилятор

2. **После установки перезапустить терминал**

3. **Проверить компиляцию:**
   ```bash
   cd src-tauri
   cargo check
   ```

4. **Запустить приложение:**
   ```bash
   npm run tauri:dev
   ```

## Альтернативное решение

Можно использовать веб-версию без Tauri:
```bash
npm run dev
```
Откроется на http://localhost:1420
