const priorities = { low: 'Низкий', medium: 'Средний', high: 'Высокий' };

export default function TaskItem({ task, categoryName, onEdit, onToggle, onDelete }) {
  return <li>
    <strong>{task.title}</strong>
    <p>{task.completed ? 'Выполнена' : 'В работе'} · {priorities[task.priority]} · {categoryName}</p>
    <button type="button" onClick={() => onToggle(task.id)}>Переключить статус</button>
    <button type="button" onClick={() => onEdit(task.id)}>Редактировать</button>
    <button type="button" onClick={() => onDelete(task.id)}>Удалить</button>
  </li>;
}
