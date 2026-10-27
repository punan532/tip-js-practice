const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const MAX_TITLE_LENGTH = 100;

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

// Значение из FormData приходит строкой. Пустая строка не должна стать нулём,
// поэтому она отклоняется до преобразования через Number.
function parseDraftId(rawId) {
  if (typeof rawId === "string" && rawId.trim() === "") return NaN;
  if (typeof rawId !== "string" && typeof rawId !== "number") return NaN;
  return Number(rawId);
}

// Чистая проверка данных формы. DOM и показ сообщений выполняются в main.js.
// draft: { id, title, priority }; editingId: null либо id редактируемой задачи.
export function validateTaskDraft(draft, tasks, editingId = null) {
  const errors = {};
  let id;

  if (editingId === null) {
    // Режим создания: id берётся из формы и должен быть свободен.
    id = parseDraftId(draft.id);
    if (!isPositiveSafeInteger(id)) {
      errors.id = "Введите положительное целое число.";
    } else if (tasks.some((task) => task.id === id)) {
      errors.id = `Задача с id ${id} уже существует.`;
    }
  } else {
    // Режим редактирования: поле id заблокировано, источник — editingId.
    id = editingId;
    if (!isPositiveSafeInteger(id) || !tasks.some((task) => task.id === id)) {
      errors.id = "Редактируемая задача не найдена.";
    }
  }

  let title = "";
  if (typeof draft.title !== "string") {
    errors.title = "Введите название задачи.";
  } else {
    title = draft.title.trim();
    if (title.length === 0) {
      errors.title = "Название не должно состоять только из пробелов.";
    } else if (title.length > MAX_TITLE_LENGTH) {
      errors.title = `Название должно быть не длиннее ${MAX_TITLE_LENGTH} символов.`;
    }
  }

  if (typeof draft.priority !== "string" || !ALLOWED_PRIORITIES.has(draft.priority)) {
    errors.priority = "Выберите приоритет: низкий, средний или высокий.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, value: { id, title, priority: draft.priority } };
}
