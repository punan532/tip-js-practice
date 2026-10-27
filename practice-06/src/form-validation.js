const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const MAX_TITLE_LENGTH = 100;

// Возвращает { valid, value, errors }.
// value содержит нормализованные title, priority и числовой categoryId.
export function validateTaskDraft(draft, categories) {
  const errors = {};

  let title = "";
  if (typeof draft?.title !== "string") {
    errors.title = "Введите название задачи.";
  } else {
    title = draft.title.trim();
    if (title.length === 0) {
      errors.title = "Название не должно состоять только из пробелов.";
    } else if (title.length > MAX_TITLE_LENGTH) {
      errors.title = `Название должно быть не длиннее ${MAX_TITLE_LENGTH} символов.`;
    }
  }

  const priority = draft?.priority;
  if (typeof priority !== "string" || !ALLOWED_PRIORITIES.has(priority)) {
    errors.priority = "Выберите приоритет: низкий, средний или высокий.";
  }

  // Значение select приходит строкой; пустая строка не должна стать нулём.
  const rawCategoryId = draft?.categoryId;
  const categoryId = typeof rawCategoryId === "string" && rawCategoryId.trim() === ""
    ? NaN
    : Number(rawCategoryId);
  const knownCategory = Array.isArray(categories)
    && categories.some((category) => category.id === categoryId);
  if (!Number.isSafeInteger(categoryId) || categoryId <= 0 || !knownCategory) {
    errors.categoryId = "Выберите категорию из списка.";
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, value: null, errors };
  }
  return { valid: true, value: { title, priority, categoryId }, errors: {} };
}
