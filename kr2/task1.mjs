import { validateTaskDraft } from "../practice-04/src/form-validation.js";

const tasks = [];

const valid = validateTaskDraft({ id: "20", title: "  Изучить localStorage  ", priority: "high" }, tasks);
console.log("title = \"  Изучить localStorage  \" →", JSON.stringify(valid));
console.log("value.title:", JSON.stringify(valid.value.title));

const blank = validateTaskDraft({ id: "20", title: "   ", priority: "high" }, tasks);
console.log("title = \"   \" →", JSON.stringify(blank));
console.log("errors.title:", blank.errors.title);
