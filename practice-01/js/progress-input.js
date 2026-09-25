"use strict";

const totalInput = "12";
const completedInput = "5";

function parseTaskCount(rawValue) {
  if (typeof rawValue !== "string") {
    return { ok: false, error: "вместо строки передано другое значение" };
  }

  const trimmed = rawValue.trim();

  if (trimmed === "") {
    return { ok: false, error: "пустой ввод" };
  }

  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    return { ok: false, error: "значение не является целым числом" };
  }

  return { ok: true, value: parsed };
}

const totalResult = parseTaskCount(totalInput);
const completedResult = parseTaskCount(completedInput);

if (!totalResult.ok) {
  console.log("Ошибка: totalTasks —", totalResult.error);
} else if (!completedResult.ok) {
  console.log("Ошибка: completedTasks —", completedResult.error);
} else {
  const totalTasks = totalResult.value;
  const completedTasks = completedResult.value;

  if (totalTasks < 0 || completedTasks < 0) {
    console.log("Ошибка: отрицательное количество");
  } else if (totalTasks > 1000) {
    console.log("Ошибка: превышена верхняя граница");
  } else if (completedTasks > totalTasks) {
    console.log("Ошибка: выполнено больше, чем существует");
  } else if (totalTasks === 0 && completedTasks === 0) {
    console.log("Задач пока нет");
  } else {
    const remaining = totalTasks - completedTasks;
    const percent = (completedTasks / totalTasks) * 100;

    let status;
    if (completedTasks === 0) {
      status = "Не начато";
    } else if (completedTasks === totalTasks) {
      status = "Завершено";
    } else {
      status = "В работе";
    }

    console.log(`Всего задач: ${totalTasks}`);
    console.log(`Выполнено: ${completedTasks}`);
    console.log(`Осталось: ${remaining}`);
    console.log(`Прогресс: ${percent.toFixed(1)}%`);
    console.log(`Статус: ${status}`);
  }
}
