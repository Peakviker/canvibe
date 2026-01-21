# Установка C++ Build Tools для Rust/Tauri

## Проблема

Ошибка компиляции: `linker 'link.exe' not found`

Visual Studio Build Tools установлены, но нужен компонент C++.

## Решение

### Шаг 1: Открыть Visual Studio Installer

1. Найдите **"Visual Studio Installer"** в меню Пуск
2. Запустите его

### Шаг 2: Установить C++ Build Tools

1. Найдите **"Visual Studio Build Tools 2022"** в списке
2. Нажмите **"Изменить"** (Modify)
3. Выберите рабочую нагрузку: **"Desktop development with C++"**
   - Или **"C++ build tools"**
4. В правой панели убедитесь, что выбрано:
   - ✅ **MSVC v143 - VS 2022 C++ x64/x86 build tools**
   - ✅ **Windows 10/11 SDK** (последняя версия)
   - ✅ **C++ CMake tools for Windows**
5. Нажмите **"Изменить"** и дождитесь установки (может занять 10-30 минут)

### Шаг 3: Перезапустить терминал

Закройте и откройте терминал заново, чтобы обновился PATH.

### Шаг 4: Проверить установку

```powershell
where.exe cl.exe
where.exe link.exe
```

Должны показаться пути к компилятору и линкеру.

### Шаг 5: Запустить компиляцию

```bash
cd src-tauri
cargo clean
cargo check
```

### Шаг 6: Запустить приложение

```bash
npm run tauri:dev
```

## Альтернатива: Веб-версия

Пока C++ Build Tools устанавливаются, можно использовать веб-версию:

```bash
npm run dev
```

Откроется на http://localhost:1420
