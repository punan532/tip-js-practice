export function selectTasks(tasks, { completed = null, priority = null, categoryId = null, q = '' } = {}) {
  const search = q.toLowerCase();
  return tasks.filter(task =>
    (completed === null || task.completed === completed) &&
    (priority === null || task.priority === priority) &&
    (categoryId === null || task.categoryId === categoryId) &&
    task.title.toLowerCase().includes(search)
  );
}

export function findTask(tasks, id) {
  return tasks.find(task => task.id === id) ?? null;
}
