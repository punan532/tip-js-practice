import { ApiError } from './errors.js';

const priorities = ['low', 'medium', 'high'];

export function parsePositiveId(raw) {
  if (typeof raw !== 'string' || !/^[1-9][0-9]*$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) ? id : null;
}

export function parseFilters(searchParams) {
  const filters = { completed: null, priority: null, categoryId: null, q: '' };
  const seen = new Set();
  for (const [name, raw] of searchParams) {
    if (!Object.hasOwn(filters, name) || seen.has(name)) {
      throw new ApiError(400, 'INVALID_QUERY', `Неизвестный или повторный параметр: ${name}.`);
    }
    seen.add(name);
    if (name === 'completed' && ['true', 'false'].includes(raw)) filters.completed = raw === 'true';
    else if (name === 'priority' && priorities.includes(raw)) filters.priority = raw;
    else if (name === 'categoryId' && parsePositiveId(raw) !== null) filters.categoryId = parsePositiveId(raw);
    else if (name === 'q' && raw.trim().length <= 100) filters.q = raw.trim();
    else throw new ApiError(400, 'INVALID_QUERY', `Некорректное значение ${name}.`);
  }
  return filters;
}

export function validateTaskDraft(draft, categories) {
  const title = typeof draft?.title === 'string' ? draft.title.trim() : '';
  const { priority, categoryId } = draft ?? {};
  const errors = {};
  if (!title || title.length > 100) errors.title = 'Введите название от 1 до 100 символов.';
  if (!priorities.includes(priority)) errors.priority = 'Выберите допустимый приоритет.';
  if (!categories.some(category => category.id === categoryId)) errors.categoryId = 'Выберите существующую категорию.';
  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Проверьте поля задачи.', errors);
  }
  return { title, priority, categoryId };
}
