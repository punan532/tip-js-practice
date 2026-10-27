// Прикладная логика работы с задачами.
// Здесь нет вывода в консоль и нет глобального списка: каждая функция
// работает только с переданными аргументами и не изменяет их.
// Ожидаемые ошибки возвращаются как { ok: false, error: "..." }.

const PRIORITIES = ["low", "medium", "high"];
const MAX_TITLE_LENGTH = 100;

// --- Внутренние функции проверки (наружу не экспортируются) ---

// Проверяет id. Строки и другие типы не преобразуются в число.
function validateId(id) {
  if (typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0) {
    return { ok: false, error: "id должен быть положительным безопасным целым числом" };
  }
  return { ok: true, id };
}

// Сначала проверяется тип, затем вызывается trim() и проверяется длина.
function validateTitle(title) {
  if (typeof title !== "string") {
    return { ok: false, error: "Название должно быть строкой" };
  }
  const cleaned = title.trim();
  if (cleaned.length === 0) {
    return { ok: false, error: "Название не должно быть пустым" };
  }
  if (cleaned.length > MAX_TITLE_LENGTH) {
    return { ok: false, error: `Название не должно быть длиннее ${MAX_TITLE_LENGTH} символов` };
  }
  return { ok: true, title: cleaned };
}

function validatePriority(priority) {
  if (typeof priority !== "string" || !PRIORITIES.includes(priority)) {
    return { ok: false, error: 'Приоритет должен быть "low", "medium" или "high"' };
  }
  return { ok: true, priority };
}

// --- Создание задачи ---

export function createTask(id, title, priority = "medium") {
  const idResult = validateId(id);
  if (!idResult.ok) return idResult;

  const titleResult = validateTitle(title);
  if (!titleResult.ok) return titleResult;

  const priorityResult = validatePriority(priority);
  if (!priorityResult.ok) return priorityResult;

  // Каждый вызов создаёт новый объект.
  return {
    ok: true,
    task: {
      id,
      title: titleResult.title,
      completed: false,
      priority,
    },
  };
}

// --- Чтение списка ---

export function findTaskById(tasks, id) {
  // Строгое сравнение: "4" !== 4. Возвращается сам найденный объект.
  return tasks.find((task) => task.id === id);
}

export function getPendingTasks(tasks) {
  return tasks.filter((task) => task.completed === false);
}

export function getTaskTitles(tasks) {
  return tasks.map((task) => task.title);
}

export function getTaskStats(tasks) {
  const total = tasks.length;
  let completed = 0;
  for (const task of tasks) {
    if (task.completed === true) {
      completed += 1;
    }
  }
  const pending = total - completed;
  // Для пустого списка деление на ноль дало бы NaN, поэтому отдельная ветка.
  // Округление не выполняется: toFixed() применяется только при выводе.
  const progress = total > 0 ? (completed / total) * 100 : 0;
  return { total, completed, pending, progress };
}

// --- Изменение данных (без мутации входных значений) ---

export function addTask(tasks, id, title, priority = "medium") {
  const created = createTask(id, title, priority);
  if (!created.ok) return created;

  if (findTaskById(tasks, id) !== undefined) {
    return { ok: false, error: `Задача с id ${id} уже существует` };
  }

  // Новый массив: старые элементы + новая задача в конце.
  return { ok: true, tasks: [...tasks, created.task] };
}

export function setTaskCompleted(tasks, id, completed) {
  const idResult = validateId(id);
  if (!idResult.ok) return idResult;

  if (typeof completed !== "boolean") {
    return { ok: false, error: "completed должен быть true или false" };
  }

  if (findTaskById(tasks, id) === undefined) {
    return { ok: false, error: `Задача с id ${id} не найдена` };
  }

  // map создаёт новый массив; у выбранной задачи — новый объект через spread.
  // Остальные объекты переиспользуются без изменений.
  const updated = tasks.map((task) =>
    task.id === id ? { ...task, completed } : task
  );
  return { ok: true, tasks: updated };
}

export function renameTask(tasks, id, title) {
  const idResult = validateId(id);
  if (!idResult.ok) return idResult;

  const titleResult = validateTitle(title);
  if (!titleResult.ok) return titleResult;

  if (findTaskById(tasks, id) === undefined) {
    return { ok: false, error: `Задача с id ${id} не найдена` };
  }

  const updated = tasks.map((task) =>
    task.id === id ? { ...task, title: titleResult.title } : task
  );
  return { ok: true, tasks: updated };
}

export function removeTask(tasks, id) {
  const idResult = validateId(id);
  if (!idResult.ok) return idResult;

  if (findTaskById(tasks, id) === undefined) {
    return { ok: false, error: `Задача с id ${id} не найдена` };
  }

  return { ok: true, tasks: tasks.filter((task) => task.id !== id) };
}
