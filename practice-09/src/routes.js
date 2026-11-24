import { Router, json } from 'express';
import { ApiError } from './errors.js';
import { parsePositiveId, parseFilters, validateTaskDraft } from './validation.js';

export function createRouter(store) {
  const router = Router({ caseSensitive: true });
  router.get('/health', (_req, res) => res.json({ data: { status: 'ok' } }));
  router.get('/categories', (_req, res) => {
    const data = store.listCategories();
    res.json({ data, meta: { total: data.length } });
  });
  router.get('/tasks', (req, res) => {
    const searchParams = new URL(req.originalUrl, 'http://localhost').searchParams;
    const filters = parseFilters(searchParams);
    const data = store.listTasks(filters);
    res.status(200).json({ data, meta: { total: data.length, filters } });
  });
  router.post('/tasks', json({ limit: '16kb' }), (req, res) => {
    const value = validateTaskDraft(req.body, store.listCategories());
    const task = store.createTask(value);
    res.location(`/api/tasks/${task.id}`).status(201).json({ data: task });
  });
  router.get('/tasks/:id', (req, res) => {
    const id = parsePositiveId(req.params.id);
    if (id === null) throw new ApiError(400, 'INVALID_ID', 'Некорректный id.');
    const task = store.getTask(id);
    if (!task) throw new ApiError(404, 'TASK_NOT_FOUND', 'Задача не найдена.', { id });
    res.json({ data: task });
  });
  for (const path of ['/health', '/categories', '/tasks', '/tasks/:id']) {
    router.all(path, (_req, res) => {
      res.set('Allow', path === '/tasks' ? 'GET, HEAD, POST, OPTIONS' : 'GET, HEAD, OPTIONS');
      throw new ApiError(405, 'METHOD_NOT_ALLOWED', 'Метод не поддерживается.');
    });
  }
  return router;
}
