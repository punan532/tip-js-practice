import { demoTasks, variantTasks, variantNumber } from "./data.js";
import {
  addTask,
  findTaskById,
  removeTask,
  setTaskCompleted,
  updateTask,
} from "./task-service.js";
import { getVisibleTasks } from "./task-selectors.js";
import { renderEmptyState, renderSummary, renderTaskList } from "./task-view.js";
import { validateTaskDraft } from "./form-validation.js";
import { loadTasks, removeSavedTasks, saveTasks } from "./task-storage.js";

const elements = {
  list: document.querySelector("#task-list"),
  filters: document.querySelector("#task-filters"),
  summary: document.querySelector("#task-summary"),
  empty: document.querySelector("#empty-message"),
  message: document.querySelector("#operation-message"),
  datasetLabel: document.querySelector("#dataset-label"),
  storageStatus: document.querySelector("#storage-status"),
  form: document.querySelector("#task-form"),
  formHeading: document.querySelector("#form-heading"),
  formMode: document.querySelector("#form-mode"),
  formMessage: document.querySelector("#form-message"),
  idInput: document.querySelector("#task-id"),
  titleInput: document.querySelector("#task-title"),
  priorityInput: document.querySelector("#task-priority"),
  submitButton: document.querySelector("#form-submit"),
  cancelButton: document.querySelector("#cancel-edit"),
  resetButton: document.querySelector("#reset-data"),
};

const params = new URLSearchParams(window.location.search);
const isVariant = params.get("dataset") === "variant";
const isCheckRun = params.get("mode") === "check";
const initialTasks = isVariant ? variantTasks : demoTasks;
const datasetName = isVariant ? "variant" : "demo";
const storageKey = isCheckRun
  ? `tip-js-practice-04:checks:${datasetName}`
  : `tip-js-practice-04:${datasetName}`;

// Готовая граница запуска: даже незавершённый или ошибочный модуль хранилища
// не должен оставлять страницу без диагностического сообщения.
let loaded;
try {
  loaded = loadTasks(window.localStorage, storageKey, initialTasks);
} catch (error) {
  loaded = {
    ok: false,
    source: "fallback",
    tasks: initialTasks.map((task) => ({ ...task })),
    error: `Хранилище не инициализировано: ${error.message}`,
  };
  console.error(error);
}
let currentTasks = loaded.tasks;
let currentFilter = "all";
let editingId = null;

const VALID_FILTERS = ["all", "pending", "completed"];

elements.datasetLabel.textContent = isVariant
  ? `Индивидуальный вариант: ${variantNumber ?? "не указан"}`
  : "Общий контрольный набор";

if (loaded.source === "storage") {
  elements.storageStatus.textContent = "Данные восстановлены из localStorage.";
} else if (loaded.ok) {
  elements.storageStatus.textContent = "Используется исходный набор; сохранённых данных пока нет.";
} else {
  elements.storageStatus.textContent = loaded.error;
  elements.storageStatus.classList.add("is-warning");
}

function renderApp() {
  // Полный массив и фильтр хранятся отдельно; видимая выборка считается заново.
  // Функция отрисовки не читает и не записывает localStorage.
  const visibleTasks = getVisibleTasks(currentTasks, currentFilter);

  renderTaskList(elements.list, visibleTasks);
  renderSummary(elements.summary, currentTasks, visibleTasks.length);
  renderEmptyState(elements.empty, currentTasks.length, visibleTasks.length);

  for (const button of elements.filters.querySelectorAll("button[data-filter]")) {
    const isActive = button.dataset.filter === currentFilter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }
}

function clearFieldError(name) {
  const input = elements.form.elements.namedItem(name);
  const message = elements.form.querySelector(`[data-error-for="${name}"]`);
  if (input instanceof HTMLInputElement || input instanceof HTMLSelectElement) {
    input.setCustomValidity("");
    input.removeAttribute("aria-invalid");
  }
  if (message) message.textContent = "";
}

function clearFormErrors() {
  for (const name of ["id", "title", "priority"]) clearFieldError(name);
  elements.formMessage.textContent = "";
}

function showFormErrors(errors) {
  clearFormErrors();
  for (const [name, text] of Object.entries(errors)) {
    const input = elements.form.elements.namedItem(name);
    const message = elements.form.querySelector(`[data-error-for="${name}"]`);
    if (input instanceof HTMLInputElement || input instanceof HTMLSelectElement) {
      input.setCustomValidity(text);
      input.setAttribute("aria-invalid", "true");
    }
    if (message) message.textContent = text;
  }
  elements.form.reportValidity();
}

function setFormMode(id = null) {
  if (id === null) {
    editingId = null;
    elements.form.reset();
    clearFormErrors();
    elements.idInput.disabled = false;
    elements.formHeading.textContent = "Добавление задачи";
    elements.formMode.textContent = "Режим создания новой задачи.";
    elements.submitButton.textContent = "Добавить задачу";
    elements.cancelButton.hidden = true;
    elements.idInput.focus();
    return;
  }

  // Поля заполняются из актуальной записи массива, а не из DOM карточки.
  const task = findTaskById(currentTasks, id);
  if (task === undefined) {
    elements.message.textContent = `Задача с id ${id} не найдена.`;
    return;
  }

  editingId = id;
  clearFormErrors();
  elements.idInput.value = String(task.id);
  elements.titleInput.value = task.title;
  elements.priorityInput.value = task.priority;
  // Заблокированное поле не попадает в FormData: id берётся из editingId.
  elements.idInput.disabled = true;
  elements.formHeading.textContent = "Редактирование задачи";
  elements.formMode.textContent = `Изменение задачи с id ${id}.`;
  elements.submitButton.textContent = "Сохранить изменения";
  elements.cancelButton.hidden = false;
  elements.titleInput.focus();
}

function persistCurrentTasks(successMessage) {
  const saved = saveTasks(window.localStorage, storageKey, currentTasks);
  elements.storageStatus.classList.toggle("is-warning", !saved.ok);
  elements.storageStatus.textContent = saved.ok
    ? "Изменения сохранены в localStorage."
    : saved.error;
  elements.message.textContent = saved.ok ? successMessage : `${successMessage} ${saved.error}`;
  renderApp();
  return saved;
}

// Готовая вспомогательная функция из логики ПР3. После полной перерисовки
// возвращает фокус на действие той же задачи либо на активный фильтр.
function restoreTaskFocus(id, action) {
  const actionButton = elements.list.querySelector(
    `[data-task-id="${id}"] button[data-action="${action}"]`,
  );
  const filterButton = elements.filters.querySelector(`[data-filter="${currentFilter}"]`);
  (actionButton ?? filterButton)?.focus();
}

function handleFormSubmit(event) {
  event.preventDefault();

  const formData = new FormData(elements.form);
  const draft = {
    id: formData.get("id"),
    title: formData.get("title"),
    priority: formData.get("priority"),
  };

  const checked = validateTaskDraft(draft, currentTasks, editingId);
  if (!checked.ok) {
    // Состояние и хранилище при ошибке не меняются.
    showFormErrors(checked.errors);
    return;
  }

  const { id, title, priority } = checked.value;
  const isEditing = editingId !== null;
  // Сервис проверяет данные ещё раз: валидация формы не заменяет защиту операции.
  const result = isEditing
    ? updateTask(currentTasks, id, title, priority)
    : addTask(currentTasks, id, title, priority);

  if (!result.ok) {
    elements.formMessage.textContent = result.error;
    return;
  }

  currentTasks = result.tasks;
  setFormMode();
  persistCurrentTasks(isEditing ? `Задача ${id} изменена.` : `Задача ${id} добавлена.`);
}

function handleTaskListClick(event) {
  // Цель клика может быть вложенным span или текстом, а не самой кнопкой.
  if (!(event.target instanceof Element)) return;

  const button = event.target.closest("button[data-action]");
  if (!button || !elements.list.contains(button)) return;

  const action = button.dataset.action;
  if (action !== "toggle" && action !== "edit" && action !== "delete") return;

  const card = button.closest("[data-task-id]");
  if (!card || !elements.list.contains(card)) return;

  // dataset хранит строки. Number("4abc") даёт NaN, в отличие от parseInt.
  const id = Number(card.dataset.taskId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    elements.message.textContent = "Некорректный идентификатор задачи.";
    return;
  }

  if (action === "edit") {
    // Переход в режим редактирования не меняет данные и не пишет storage.
    elements.message.textContent = "";
    setFormMode(id);
    return;
  }

  let result;
  if (action === "toggle") {
    // Текущий статус берётся из массива, а не из текста кнопки или класса.
    const task = findTaskById(currentTasks, id);
    result = task === undefined
      ? { ok: false, error: `Задача с id ${id} не найдена.` }
      : setTaskCompleted(currentTasks, id, !task.completed);
  } else {
    result = removeTask(currentTasks, id);
  }

  // При отказе result.tasks не существует: состояние остаётся прежним.
  if (!result.ok) {
    elements.message.textContent = result.error;
    return;
  }

  currentTasks = result.tasks;
  // Удалённую задачу больше нельзя редактировать: форма возвращается к созданию.
  if (action === "delete" && editingId === id) setFormMode();
  persistCurrentTasks(action === "toggle" ? `Статус задачи ${id} изменён.` : `Задача ${id} удалена.`);
  restoreTaskFocus(id, action);
}

function handleFilterClick(event) {
  if (!(event.target instanceof Element)) return;

  const button = event.target.closest("button[data-filter]");
  if (!button || !elements.filters.contains(button)) return;

  const filter = button.dataset.filter;
  if (!VALID_FILTERS.includes(filter)) return;

  // Меняется только режим отображения: данные и localStorage не затрагиваются.
  currentFilter = filter;
  elements.message.textContent = "";
  renderApp();
}

function handleResetClick() {
  const removed = removeSavedTasks(window.localStorage, storageKey);

  // Исходный набор не сохраняется обратно: ключ после сброса отсутствует.
  currentTasks = initialTasks.map((task) => ({ ...task }));
  currentFilter = "all";
  setFormMode();

  elements.storageStatus.classList.toggle("is-warning", !removed.ok);
  elements.storageStatus.textContent = removed.ok
    ? "Сохранённые данные удалены. Используется исходный набор."
    : removed.error;
  elements.message.textContent = "";
  renderApp();
}

elements.form.addEventListener("submit", handleFormSubmit);
elements.form.addEventListener("input", (event) => {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) {
    clearFieldError(event.target.name);
  }
});
elements.list.addEventListener("click", handleTaskListClick);
elements.filters.addEventListener("click", handleFilterClick);
elements.cancelButton.addEventListener("click", () => setFormMode());
elements.resetButton.addEventListener("click", handleResetClick);

try {
  setFormMode();
  renderApp();
} catch (error) {
  elements.message.textContent = `Ошибка запуска: ${error.message}`;
  console.error(error);
}
