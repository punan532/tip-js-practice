import { ApiError } from "./api-client.js";

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_FILTERS = new Set(["completed", "priority", "categoryId", "q"]);

function invalidResponse(message) {
  return new ApiError(message, { kind: "invalid-response" });
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function isTask(value) {
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

function isCategory(value) {
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

function hasUniqueIds(items) {
  return new Set(items.map((item) => item.id)).size === items.length;
}

function checkCollection(payload, isItem, label) {
  const items = payload?.data;
  if (!Array.isArray(items)) {
    throw invalidResponse(`Ответ ${label} не содержит массив data.`);
  }
  if (!items.every(isItem)) {
    throw invalidResponse(`Ответ ${label} содержит запись неверной формы.`);
  }
  if (!hasUniqueIds(items)) {
    throw invalidResponse(`Ответ ${label} содержит повторяющиеся id.`);
  }
  const meta = payload.meta;
  if (!meta || typeof meta !== "object" || meta.total !== items.length) {
    throw invalidResponse(`meta.total ответа ${label} не совпадает с длиной data.`);
  }
  return { items, meta };
}

// client — объект, созданный createApiClient.
// Контракт результата:
// getTasks(filters) -> Promise<{ tasks, meta }>
// getTaskById(id) -> Promise<task>
// getCategories() -> Promise<category[]>
// loadInitialData(filters) -> Promise<{ tasks, categories, meta }>
export function createTaskApi(client) {
  if (!client || typeof client.requestJson !== "function") {
    throw new TypeError("createTaskApi ожидает клиент с методом requestJson.");
  }

  async function getTasks(filters = {}) {
    // Фильтры проверяются до запроса и передаются серверу в query.
    const query = normalizeFilters(filters);
    const payload = await client.requestJson("/tasks", { query });
    const { items, meta } = checkCollection(payload, isTask, "задач");
    return { tasks: items, meta };
  }

  async function getTaskById(id) {
    if (!isPositiveSafeInteger(id)) {
      throw new TypeError("id задачи должен быть положительным целым числом.");
    }
    const payload = await client.requestJson(`/tasks/${id}`);
    if (!isTask(payload?.data)) {
      throw invalidResponse("Ответ с задачей имеет неверную форму.");
    }
    return payload.data;
  }

  async function getCategories() {
    const payload = await client.requestJson("/categories");
    return checkCollection(payload, isCategory, "категорий").items;
  }

  async function loadInitialData(filters = {}) {
    // Оба запроса стартуют сразу; общий await ждёт их вместе.
    const [taskResult, categories] = await Promise.all([
      getTasks(filters),
      getCategories(),
    ]);
    return { tasks: taskResult.tasks, categories, meta: taskResult.meta };
  }

  return { getTasks, getTaskById, getCategories, loadInitialData };
}
