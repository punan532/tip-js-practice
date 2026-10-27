// Модуль ПР3. Вход: корректный массив задач и фильтр all/pending/completed.
// Результат: новый массив, исходный порядок и объекты сохраняются.
// Здесь нет DOM и нет изменения входных данных.
export function getVisibleTasks(tasks, filter = "all") {
  if (filter === "pending") {
    return tasks.filter((task) => task.completed === false);
  }
  if (filter === "completed") {
    return tasks.filter((task) => task.completed === true);
  }
  // "all": копия массива, чтобы вызывающий код не получил ссылку на полный список.
  // Недопустимые значения отсеиваются в обработчике, до этого места они не доходят.
  return [...tasks];
}
