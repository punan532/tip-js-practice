export function validateTaskDraft(draft, categories) {
  const value = {
    title: typeof draft.title === 'string' ? draft.title.trim() : '',
    priority: draft.priority, categoryId: Number(draft.categoryId),
  };
  const errors = {};
  if (!value.title || value.title.length > 100) errors.title = 'Название: от 1 до 100 символов.';
  if (!['low', 'medium', 'high'].includes(value.priority)) errors.priority = 'Выберите приоритет.';
  if (!Number.isSafeInteger(value.categoryId) || !categories.some(c => c.id === value.categoryId)) errors.categoryId = 'Выберите категорию.';
  return { valid: Object.keys(errors).length === 0, value, errors };
}

export function selectTasks(tasks, { completed, priority, categoryId, q }) {
  const search = q.trim().toLowerCase();
  return tasks.filter(task =>
    (!completed || task.completed === (completed === 'true')) &&
    (!priority || task.priority === priority) &&
    (!categoryId || task.categoryId === Number(categoryId)) &&
    task.title.toLowerCase().includes(search)
  );
}

export function getTaskStats(tasks) {
  const completed = tasks.filter(task => task.completed).length;
  return { total: tasks.length, completed, active: tasks.length - completed };
}

export function addTask(tasks, { title, priority, categoryId }, id) {
  if (!Number.isSafeInteger(id) || id <= 0 || tasks.some(task => task.id === id)) {
    throw new RangeError('Требуется уникальный положительный id.');
  }
  return [...tasks, { id, title, priority, categoryId, completed: false }];
}

export function updateTask(tasks, id, { title, priority, categoryId }) {
  return tasks.map(task => task.id === id ? { ...task, title, priority, categoryId } : task);
}

export function toggleTask(tasks, id) {
  return tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task);
}

export function removeTask(tasks, id) {
  return tasks.filter(task => task.id !== id);
}
