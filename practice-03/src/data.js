// Общий контрольный набор. Для своего варианта ниже предусмотрен отдельный массив.
// Идентификатор задачи не совпадает с её индексом в массиве.
export const demoTasks = [
  { id: 1, title: "Изучить функции", completed: true, priority: "medium" },
  { id: 4, title: "Подготовить модель задач", completed: false, priority: "high" },
  { id: 7, title: "Проверить методы массивов", completed: false, priority: "low" },
  { id: 10, title: "Оформить README", completed: true, priority: "medium" },
];

// Вариант 5: «Разработка командного прототипа».
// K = 4: первые четыре задачи выполнены, последние две — нет.
export const variantNumber = 5;
export const variantTasks = [
  { id: 11, title: "Согласовать требования к прототипу", completed: true, priority: "medium" },
  { id: 23, title: "Распределить роли в команде", completed: true, priority: "high" },
  { id: 37, title: "Собрать макет интерфейса", completed: true, priority: "low" },
  { id: 41, title: "Реализовать основной сценарий", completed: true, priority: "medium" },
  { id: 58, title: "Провести внутреннее тестирование", completed: false, priority: "high" },
  { id: 64, title: "Подготовить демонстрацию прототипа", completed: false, priority: "low" },
];
