import { demoTasks } from "../practice-02/src/data.js";
import { findTaskById, setTaskCompleted } from "../practice-02/src/task-service.js";

const success = setTaskCompleted(demoTasks, 4, true);
console.log("setTaskCompleted(demoTasks, 4, true) → ok:", success.ok);
console.log("Новая запись id 4:", JSON.stringify(findTaskById(success.tasks, 4)));
console.log("Исходная запись id 4:", JSON.stringify(findTaskById(demoTasks, 4)));
console.log("Новый массив:", success.tasks !== demoTasks,
  "| новый объект:", findTaskById(success.tasks, 4) !== findTaskById(demoTasks, 4));

const failure = setTaskCompleted(demoTasks, 777, true);
console.log("setTaskCompleted(demoTasks, 777, true) →", failure);
console.log("Статусы demoTasks после вызовов:",
  demoTasks.map((task) => `${task.id}: ${task.completed}`).join(", "));
