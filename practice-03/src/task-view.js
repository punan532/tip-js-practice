import { getTaskStats } from "./task-service.js";

// Здесь создаётся DOM, но не изменяется состояние приложения.
// Все тексты назначаются через textContent, innerHTML не используется.

const PRIORITY_LABELS = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
};

// Небольшая вспомогательная функция: создаёт элемент, класс и текст.
function createElement(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// Кнопка с вложенным span.action-label: нажатие по тексту всплывает до кнопки.
function createActionButton(action, label) {
  const button = createElement("button");
  button.type = "button";
  button.dataset.action = action;
  button.append(createElement("span", "action-label", label));
  return button;
}

export function createTaskElement(task) {
  const card = createElement("li", "task-card");
  card.dataset.taskId = String(task.id);
  card.classList.toggle("is-completed", task.completed);

  const title = createElement("h3", "task-title", task.title);
  const status = createElement("span", "task-status", task.completed ? "Выполнена" : "В работе");
  const priority = createElement("span", "task-priority", PRIORITY_LABELS[task.priority]);

  const toggle = createActionButton("toggle", "Выполнена");
  toggle.setAttribute("aria-pressed", String(task.completed));
  const remove = createActionButton("delete", "Удалить");

  const actions = createElement("div", "task-actions");
  actions.append(toggle, remove);

  card.append(title, status, priority, actions);
  return card;
}

export function renderTaskList(listElement, tasks) {
  // Сам ul сохраняется: на нём висит делегированный обработчик.
  // replaceChildren() без аргументов очищает список, поэтому [] тоже работает.
  listElement.replaceChildren(...tasks.map((task) => createTaskElement(task)));
}

export function renderSummary(summaryElement, tasks, visibleCount) {
  // tasks — ВЕСЬ текущий массив, visibleCount — длина отфильтрованной выборки.
  const { total, completed, pending, progress } = getTaskStats(tasks);
  const values = {
    total: String(total),
    completed: String(completed),
    pending: String(pending),
    // toFixed возвращает строку, поэтому применяется только при отображении.
    progress: `${progress.toFixed(1)}%`,
    visible: String(visibleCount),
  };
  for (const [name, value] of Object.entries(values)) {
    const node = summaryElement.querySelector(`[data-stat="${name}"]`);
    if (node) node.textContent = value;
  }
}

export function renderEmptyState(messageElement, total, visibleCount) {
  if (visibleCount > 0) {
    messageElement.textContent = "";
    messageElement.hidden = true;
    return;
  }
  messageElement.textContent = total === 0
    ? "Список задач пуст."
    : "Нет задач по выбранному фильтру.";
  messageElement.hidden = false;
}
