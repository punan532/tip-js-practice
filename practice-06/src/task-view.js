const PRIORITY_LABELS = Object.freeze({
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
});

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

export function createTaskElement(task, category) {
  const card = createElement("li", "task-card");
  card.dataset.taskId = String(task.id);
  card.classList.toggle("is-completed", task.completed);

  // Название и категория пришли с сервера: только textContent, без innerHTML.
  const title = createElement("h3", "task-title", task.title);

  const meta = createElement("p", "task-meta");
  meta.append(
    createElement("span", "task-status", task.completed ? "Выполнена" : "В работе"),
    createElement("span", "task-priority", PRIORITY_LABELS[task.priority]),
    createElement("span", "task-category", category?.name ?? "Без категории"),
  );

  const toggle = createActionButton("toggle", "Выполнена");
  toggle.setAttribute("aria-pressed", String(task.completed));
  const actions = createElement("div", "task-actions");
  actions.append(
    toggle,
    createActionButton("edit", "Изменить"),
    createActionButton("delete", "Удалить"),
  );

  card.append(title, meta, actions);
  return card;
}

export function renderTaskList(list, tasks, categories) {
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  // replaceChildren заменяет старые карточки, сам ul с обработчиком сохраняется.
  list.replaceChildren(
    ...tasks.map((task) => createTaskElement(task, categoryById.get(task.categoryId))),
  );
}
