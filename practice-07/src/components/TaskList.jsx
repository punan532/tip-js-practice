import TaskItem from './TaskItem.jsx';

export default function TaskList({ tasks, categories, onEdit, onToggle, onDelete }) {
  return <section aria-label="Список задач">
    <h2>Задачи</h2>
    <p>Найдено: {tasks.length}</p>
    {tasks.length === 0 ? <p>Список задач пуст</p> : <ul>
      {tasks.map(task => <TaskItem key={task.id} task={task}
        categoryName={categories.find(category => category.id === task.categoryId)?.name}
        onEdit={onEdit} onToggle={onToggle} onDelete={onDelete} />)}
    </ul>}
  </section>;
}
