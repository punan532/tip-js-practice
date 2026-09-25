"use strict";

const totalTasks = 12;
const completedTasks = 5;
const dailyLimit = 3;

function isValidCount(value) {
  return typeof value === "number" && Number.isInteger(value);
}

if (!isValidCount(totalTasks) || !isValidCount(completedTasks)) {
  console.log("Ошибка: значения задач должны быть целыми числами");
} else if (totalTasks < 0 || completedTasks < 0) {
  console.log("Ошибка: отрицательное количество");
} else if (totalTasks > 1000) {
  console.log("Ошибка: превышена верхняя граница");
} else if (completedTasks > totalTasks) {
  console.log("Ошибка: выполнено больше, чем существует");
} else if (!isValidCount(dailyLimit)) {
  console.log("Ошибка: дневная норма должна быть целым числом");
} else if (dailyLimit < 1 || dailyLimit > 1000) {
  console.log("Ошибка: дневная норма вне допустимого диапазона");
} else {
  let remaining = totalTasks - completedTasks;
  console.log(`Осталось задач: ${remaining}`);

  if (remaining === 0) {
    console.log("Все задачи уже выполнены");
    console.log("Потребуется дней: 0");
  } else {
    let day = 0;
    while (remaining > 0) {
      day = day + 1;
      const doneToday = Math.min(dailyLimit, remaining);
      remaining = remaining - doneToday;
      console.log(`День ${day}: выполнено ${doneToday}, осталось ${remaining}`);
    }
    console.log(`Потребуется дней: ${day}`);
  }
}
