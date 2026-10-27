import { ApiError } from "./api-client.js";
import { validateTaskDraft } from "./form-validation.js";

export function messageForError(error) {
  if (!(error instanceof ApiError)) return "Не удалось выполнить операцию.";
  if (error.kind === "timeout") return "Сервер не ответил вовремя. Попробуйте ещё раз.";
  if (error.kind === "network") return "Нет соединения с учебным API. Проверьте, запущен ли npm start.";
  if (error.kind === "invalid-response") return "Сервер вернул ответ неожиданного формата.";
  if (error.kind === "http" && error.status === 404) return "Запись уже отсутствует на сервере. Обновите список.";
  if (error.kind === "http") return error.message || `Сервер вернул ошибку ${error.status}.`;
  return "Не удалось выполнить операцию.";
}

const API_METHODS = [
  "loadInitialData", "getTasks", "createTask", "updateTask",
  "setTaskCompleted", "deleteTask", "resetDemoData",
];
const VIEW_METHODS = [
  "setListState", "setTasks", "setCategories", "setTotal",
  "setFormTask", "showFormErrors", "setMutationPending", "notify",
];

function requireMethods(object, names, label) {
  if (!object || typeof object !== "object") {
    throw new TypeError(`Контроллеру нужен объект ${label}.`);
  }
  for (const name of names) {
    if (typeof object[name] !== "function") {
      throw new TypeError(`В ${label} отсутствует метод ${name}.`);
    }
  }
}

// view — адаптер из dom-app.js. Контроллер не должен обращаться к document.
// Обязательные методы результата:
// start, applyFilters, refresh, submit, beginEdit, cancelEdit,
// toggleTask, deleteTask, resetData и destroy.
export function createAppController({ api, view, validateDraft = validateTaskDraft } = {}) {
  requireMethods(api, API_METHODS, "api");
  requireMethods(view, VIEW_METHODS, "view");

  // Массив — только снимок последнего ответа сервера, источник истины — API.
  let tasks = [];
  let categories = null;
  let filters = {};
  let editingId = null;
  let loadController = null;
  let loadSeq = 0;

  async function loadCurrentTasks() {
    // Предыдущая загрузка больше не нужна: отменяем её и запоминаем номер новой.
    loadController?.abort();
    const controller = new AbortController();
    loadController = controller;
    const seq = ++loadSeq;
    const options = { signal: controller.signal };

    view.setListState("loading");
    try {
      // Пока категории не получены, повтор снова выполняет начальную загрузку.
      const result = categories === null
        ? await api.loadInitialData({ ...filters }, options)
        : await api.getTasks({ ...filters }, options);
      // Ответ устаревшего запроса не должен перезаписать новый фильтр.
      if (seq !== loadSeq) return;

      if (result.categories) {
        categories = result.categories;
        view.setCategories(categories);
      }
      tasks = result.tasks;
      view.setTasks(tasks, categories);
      view.setTotal(result.meta?.total ?? tasks.length);
      view.setListState(tasks.length > 0 ? "ready" : "empty");
    } catch (error) {
      if (seq !== loadSeq) return;
      // Отмена — ожидаемое управление потоком, а не ошибка для пользователя.
      if (error instanceof ApiError && error.kind === "aborted") return;
      view.setListState("error", messageForError(error));
    } finally {
      if (loadController === controller) loadController = null;
    }
  }

  // Общая схема изменения: блокировка → запрос → сообщение → повторный GET.
  async function runMutation(action, successMessage, onError) {
    view.setMutationPending(true);
    try {
      await action();
      view.notify(successMessage, "success");
      await loadCurrentTasks();
      return true;
    } catch (error) {
      onError?.(error);
      view.notify(messageForError(error), "error");
      return false;
    } finally {
      view.setMutationPending(false);
    }
  }

  function resetForm() {
    editingId = null;
    view.setFormTask(null);
    view.showFormErrors({});
  }

  function findLoadedTask(id) {
    const task = tasks.find((item) => item.id === id);
    if (!task) view.notify("Задача не найдена в текущем списке. Обновите список.", "error");
    return task;
  }

  return {
    start(initialFilters = {}) {
      filters = { ...initialFilters };
      return loadCurrentTasks();
    },

    applyFilters(nextFilters = {}) {
      filters = { ...nextFilters };
      return loadCurrentTasks();
    },

    refresh() {
      return loadCurrentTasks();
    },

    async submit(draft) {
      const checked = validateDraft(draft, categories ?? []);
      if (!checked.valid) {
        // Неверная форма не отправляется на сервер.
        view.showFormErrors(checked.errors);
        return false;
      }
      view.showFormErrors({});

      const id = editingId;
      return runMutation(
        async () => {
          if (id === null) await api.createTask(checked.value);
          else await api.updateTask(id, checked.value);
          resetForm();
        },
        id === null ? "Задача добавлена." : `Задача № ${id} изменена.`,
        (error) => {
          // Серверная проверка может отклонить данные, которые пропустил клиент.
          if (error instanceof ApiError && error.code === "VALIDATION_ERROR" && error.details) {
            view.showFormErrors(error.details);
          }
        },
      );
    },

    beginEdit(id) {
      const task = findLoadedTask(id);
      if (!task) return;
      editingId = id;
      view.showFormErrors({});
      view.setFormTask(task);
    },

    cancelEdit() {
      resetForm();
    },

    toggleTask(id) {
      const task = findLoadedTask(id);
      if (!task) return Promise.resolve(false);
      // Новое значение вычисляется из последнего ответа сервера.
      return runMutation(
        () => api.setTaskCompleted(id, !task.completed),
        task.completed ? `Задача № ${id} возвращена в работу.` : `Задача № ${id} выполнена.`,
      );
    },

    deleteTask(id) {
      return runMutation(
        async () => {
          await api.deleteTask(id);
          if (editingId === id) resetForm();
        },
        `Задача № ${id} удалена.`,
      );
    },

    resetData() {
      return runMutation(
        async () => {
          await api.resetDemoData();
          resetForm();
        },
        "Исходные данные восстановлены.",
      );
    },

    destroy() {
      loadSeq += 1;
      loadController?.abort();
      loadController = null;
    },
  };
}
