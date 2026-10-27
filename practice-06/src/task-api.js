import { ApiError } from "./api-client.js";

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_FILTERS = new Set(["completed", "priority", "categoryId", "q"]);

function invalidResponse(message) {
  return new ApiError(message, { kind: "invalid-response" });
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

export function isTask(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.title === "string"
    && value.title.trim().length >= 1
    && value.title.trim().length <= 100
    && typeof value.completed === "boolean"
    && ALLOWED_PRIORITIES.has(value.priority)
    && isPositiveSafeInteger(value.categoryId),
  );
}

export function isCategory(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.name === "string"
    && value.name.trim().length >= 1
    && value.name.trim().length <= 100,
  );
}

function normalizeFilters(filters) {
  if (filters === null || typeof filters !== "object" || Array.isArray(filters)) {
    throw new TypeError("Фильтры должны быть обычным объектом.");
  }
  const query = {};
  for (const [name, value] of Object.entries(filters)) {
    if (!ALLOWED_FILTERS.has(name)) {
      throw new TypeError(`Неизвестный фильтр: ${name}.`);
    }
    if (value === undefined) continue;
    if (name === "completed" && typeof value !== "boolean") {
      throw new TypeError("Фильтр completed должен быть true или false.");
    }
    if (name === "priority" && !ALLOWED_PRIORITIES.has(value)) {
      throw new TypeError("Фильтр priority должен быть low, medium или high.");
    }
    if (name === "categoryId" && !isPositiveSafeInteger(value)) {
      throw new TypeError("Фильтр categoryId должен быть положительным целым числом.");
    }
    if (name === "q") {
      if (typeof value !== "string" || value.trim().length > 100) {
        throw new TypeError("Фильтр q должен быть строкой до 100 символов.");
      }
      if (value.trim() === "") continue;
      query.q = value.trim();
      continue;
    }
    // Логическое false остаётся boolean: строку создаст URLSearchParams.
    query[name] = value;
  }
  return query;
}

function checkId(id) {
  if (!isPositiveSafeInteger(id)) {
    throw new TypeError("id задачи должен быть положительным целым числом.");
  }
}

function checkCollection(payload, isItem, label) {
  const items = payload?.data;
  if (!Array.isArray(items)) {
    throw invalidResponse(`Ответ ${label} не содержит массив data.`);
  }
  if (!items.every(isItem)) {
    throw invalidResponse(`Ответ ${label} содержит запись неверной формы.`);
  }
  if (new Set(items.map((item) => item.id)).size !== items.length) {
    throw invalidResponse(`Ответ ${label} содержит повторяющиеся id.`);
  }
  const meta = payload.meta;
  if (!meta || typeof meta !== "object" || meta.total !== items.length) {
    throw invalidResponse(`meta.total ответа ${label} не совпадает с длиной data.`);
  }
  return { items, meta };
}

function checkTaskPayload(payload) {
  if (!isTask(payload?.data)) {
    throw invalidResponse("Ответ с задачей имеет неверную форму.");
  }
  return payload.data;
}

// Методы результата:
// getTasks, getTaskById, getCategories, loadInitialData, createTask, updateTask,
// setTaskCompleted, deleteTask и resetDemoData.
// Последний аргумент каждого метода данных — { signal }.
export function createTaskApi(client) {
  if (!client || typeof client.requestJson !== "function") {
    throw new TypeError("createTaskApi ожидает клиент с методом requestJson.");
  }

  async function getTasks(filters = {}, { signal } = {}) {
    // Фильтры проверяются до запроса и передаются серверу в query.
    const query = normalizeFilters(filters);
    const payload = await client.requestJson("/tasks", { query, signal });
    const { items, meta } = checkCollection(payload, isTask, "задач");
    return { tasks: items, meta };
  }

  async function getTaskById(id, { signal } = {}) {
    checkId(id);
    return checkTaskPayload(await client.requestJson(`/tasks/${id}`, { signal }));
  }

  async function getCategories({ signal } = {}) {
    const payload = await client.requestJson("/categories", { signal });
    return checkCollection(payload, isCategory, "категорий").items;
  }

  async function loadInitialData(filters = {}, options = {}) {
    // Оба запроса стартуют сразу; общий await ждёт их вместе.
    const [taskResult, categories] = await Promise.all([
      getTasks(filters, options),
      getCategories(options),
    ]);
    return { tasks: taskResult.tasks, categories, meta: taskResult.meta };
  }

  async function createTask(draft, { signal } = {}) {
    // id и completed назначает сервер, поэтому в тело они не попадают.
    const body = { title: draft.title, priority: draft.priority, categoryId: draft.categoryId };
    return checkTaskPayload(await client.requestJson("/tasks", { method: "POST", body, signal }));
  }

  async function updateTask(id, changes, { signal } = {}) {
    checkId(id);
    if (changes === null || typeof changes !== "object" || Array.isArray(changes)) {
      throw new TypeError("changes должен быть объектом с изменяемыми полями.");
    }
    return checkTaskPayload(
      await client.requestJson(`/tasks/${id}`, { method: "PATCH", body: changes, signal }),
    );
  }

  async function setTaskCompleted(id, completed, { signal } = {}) {
    checkId(id);
    if (typeof completed !== "boolean") {
      throw new TypeError("completed должен быть true или false.");
    }
    return checkTaskPayload(
      await client.requestJson(`/tasks/${id}`, { method: "PATCH", body: { completed }, signal }),
    );
  }

  async function deleteTask(id, { signal } = {}) {
    checkId(id);
    const result = await client.requestJson(`/tasks/${id}`, { method: "DELETE", signal });
    // Успешное удаление — 204 без тела, клиент превращает его в null.
    if (result !== null) {
      throw invalidResponse("После удаления ожидался пустой ответ 204.");
    }
    return null;
  }

  async function resetDemoData({ signal } = {}) {
    const payload = await client.requestJson("/debug/reset", { method: "POST", signal });
    const data = payload?.data;
    if (!data || data.reset !== true || !Number.isSafeInteger(data.total)) {
      throw invalidResponse("Сервер не подтвердил восстановление данных.");
    }
    return data;
  }

  return {
    getTasks,
    getTaskById,
    getCategories,
    loadInitialData,
    createTask,
    updateTask,
    setTaskCompleted,
    deleteTask,
    resetDemoData,
  };
}
