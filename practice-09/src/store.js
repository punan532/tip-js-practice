import { categories as seedCategories, tasks as seedTasks } from './data.js';
import { selectTasks, findTask } from './task-service.js';

// Для каждого приложения собственные копии данных, без открытия порта.
export function createStore() {
  const tasks = seedTasks.map(task => ({ ...task }));
  const categories = seedCategories.map(category => ({ ...category }));
  let nextId = Math.max(0, ...tasks.map(task => task.id)) + 1;
  return {
    createTask(value) {
      const task = { ...value, id: nextId++, completed: false };
      tasks.push(task);
      return { ...task };
    },
    listTasks: filters => selectTasks(tasks, filters),
    getTask: id => findTask(tasks, id),
    listCategories: () => categories.map(category => ({ ...category })),
  };
}
