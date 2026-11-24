import { addTask, updateTask, toggleTask, removeTask, selectTasks, getTaskStats } from './domain/task-service.js';
import { useState } from 'react';
import { tasks as initialTasks, categories } from './data.js';
import { createInitialFilters } from './variant.js';
import TaskForm from './components/TaskForm.jsx';
import TaskFilters from './components/TaskFilters.jsx';
import TaskList from './components/TaskList.jsx';
import TaskStats from './components/TaskStats.jsx';

export default function App() {
  const [tasks, setTasks] = useState(() => initialTasks.map(task => ({ ...task })));
  const [filters, setFilters] = useState(createInitialFilters);
  const [editingId, setEditingId] = useState(null);
  const visibleTasks = selectTasks(tasks, filters);
  const stats = getTaskStats(tasks);
  const editingTask = tasks.find(task => task.id === editingId) ?? null;

  function save(value) {
    if (editingId !== null && !editingTask) return false;
    setTasks(current => editingId === null
      ? addTask(current, value, Math.max(0, ...current.map(task => task.id)) + 1)
      : updateTask(current, editingId, value));
    setEditingId(null);
    return true;
  }

  function remove(id) {
    setTasks(current => removeTask(current, id));
    if (editingId === id) setEditingId(null);
  }

  return (
    <main>
      <h1>Задачи на React</h1>
      <p>ПР7: данные в памяти. Обновление страницы восстанавливает исходный набор.</p>
      <TaskStats stats={stats} />
      <TaskFilters filters={filters} categories={categories} onChange={setFilters} />
      <TaskForm key={editingId ?? "new"} categories={categories} initialTask={editingTask}
        onSave={save} onCancel={() => setEditingId(null)} />
      <TaskList tasks={visibleTasks} categories={categories} onEdit={setEditingId}
        onToggle={id => setTasks(current => toggleTask(current, id))} onDelete={remove} />
    </main>
  );
}
