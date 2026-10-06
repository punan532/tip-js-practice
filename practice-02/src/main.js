import { demoTasks, variantNumber, variantTasks } from "./data.js";
import {
  findTaskById,
  getPendingTasks,
  getTaskTitles,
  getTaskStats,
  addTask,
  setTaskCompleted,
  renameTask,
  removeTask,
} from "./task-service.js";

// Вывод сводки. Деструктуризация достаёт поля объекта в отдельные переменные.
function printStats(label, tasks) {
  const { total, completed, pending, progress } = getTaskStats(tasks);
  console.log(`[${label}] Всего: ${total}; выполнено: ${completed}; осталось: ${pending}`);
  if (total === 0) {
    console.log("Задач пока нет");
  } else {
    // toFixed() возвращает строку, поэтому применяется только при отображении.
    console.log(`Прогресс: ${progress.toFixed(1)}%`);
  }
}

// Применяет операцию: при успехе возвращает новый массив, при отказе
// выводит ошибку и возвращает прежнее состояние без изменений.
function apply(label, currentTasks, result) {
  if (result.ok) {
    console.log(`OK: ${label}`);
    return result.tasks;
  }
  console.error(`Ошибка (${label}): ${result.error}`);
  return currentTasks;
}

// Копия значений для сравнения «до» и «после» (проверка сохранности исходника).
function snapshot(tasks) {
  return JSON.stringify(tasks);
}

// ---------------------------------------------------------------
// Общий сценарий (раздел 6.5)
// ---------------------------------------------------------------
console.log("=== Общий сценарий: demoTasks ===");

const demoBefore = snapshot(demoTasks);
let currentTasks = demoTasks;

console.log("Исходные задачи:");
console.table(currentTasks);
console.log("Названия:", getTaskTitles(currentTasks));
console.log("Невыполненные (id):", getPendingTasks(currentTasks).map((task) => task.id));
printStats("Исходный набор", currentTasks);

currentTasks = apply(
  "добавление id 20",
  currentTasks,
  addTask(currentTasks, 20, "Добавить проверку", "high")
);
printStats("После добавления id 20", currentTasks);

currentTasks = apply(
  "выполнение id 4",
  currentTasks,
  setTaskCompleted(currentTasks, 4, true)
);
printStats("После выполнения id 4", currentTasks);

currentTasks = apply(
  "переименование id 10",
  currentTasks,
  renameTask(currentTasks, 10, "Подготовить инструкцию запуска")
);
printStats("После переименования id 10", currentTasks);

currentTasks = apply(
  "удаление id 7",
  currentTasks,
  removeTask(currentTasks, 7)
);
printStats("После удаления id 7", currentTasks);

console.log("Итоговые id:", currentTasks.map((task) => task.id));
console.table(currentTasks);

// Обработка отказа: повторяющийся id. Состояние не должно измениться.
console.log("--- Показ отказа: повторное добавление id 4 ---");
const stateBeforeFailure = currentTasks;
currentTasks = apply(
  "повторное добавление id 4",
  currentTasks,
  addTask(currentTasks, 4, "Дубликат")
);
console.log("Состояние не заменено:", currentTasks === stateBeforeFailure);

// Ещё один отказ: статус неверного типа.
currentTasks = apply(
  'completed = "true" (строка)',
  currentTasks,
  setTaskCompleted(currentTasks, 4, "true")
);

console.log("Поиск id 4:", findTaskById(currentTasks, 4));
console.log("Поиск id 777:", findTaskById(currentTasks, 777));

console.log(
  "demoTasks не изменился:",
  snapshot(demoTasks) === demoBefore,
  `(${demoTasks.length} записи, id: ${demoTasks.map((task) => task.id)})`
);

// ---------------------------------------------------------------
// Индивидуальный сценарий (раздел 7), вариант 5
// ---------------------------------------------------------------
console.log(`\n=== Вариант ${variantNumber}: variantTasks ===`);

const variantBefore = snapshot(variantTasks);
let variantState = variantTasks;

console.table(variantState);
printStats("Шесть исходных задач", variantState);

variantState = apply(
  "добавление id 80",
  variantState,
  addTask(variantState, 80, "Записать видео-демонстрацию", "medium")
);
printStats("После добавления id 80", variantState);

// id 11 уже выполнена: операция всё равно успешна по контракту.
variantState = apply(
  "completed = true для id 11",
  variantState,
  setTaskCompleted(variantState, 11, true)
);
printStats("После установки completed для id 11", variantState);

variantState = apply(
  "переименование id 23",
  variantState,
  renameTask(variantState, 23, "Закрепить роли и зоны ответственности")
);
printStats("После переименования id 23", variantState);

variantState = apply(
  "удаление id 37",
  variantState,
  removeTask(variantState, 37)
);
printStats("После удаления id 37", variantState);

console.log("--- Показ отказа: повторное добавление id 80 ---");
const variantBeforeFailure = variantState;
variantState = apply(
  "повторное добавление id 80",
  variantState,
  addTask(variantState, 80, "Ещё одна демонстрация", "medium")
);
console.log("Список не изменился:", variantState === variantBeforeFailure);

console.log("Итоговые задачи:");
console.table(variantState);
printStats("Итог варианта", variantState);

console.log(
  "variantTasks не изменился:",
  snapshot(variantTasks) === variantBefore,
  `(${variantTasks.length} записей, id: ${variantTasks.map((task) => task.id)})`
);
