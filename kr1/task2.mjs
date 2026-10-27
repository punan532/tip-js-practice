import { demoTasks } from "../practice-02/src/data.js";
import { getPendingTasks } from "../practice-02/src/task-service.js";

const pending = getPendingTasks(demoTasks);
console.log("getPendingTasks(demoTasks), id:", pending.map((task) => task.id));
console.log("Новый массив:", pending !== demoTasks, "| исходный размер:", demoTasks.length);

const empty = getPendingTasks([]);
console.log("getPendingTasks([]):", empty);
