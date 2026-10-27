import { createApiClient } from "../practice-05/src/api-client.js";
import { createTaskApi } from "../practice-05/src/task-api.js";

const client = createApiClient({ baseUrl: "http://127.0.0.1:5505/api", timeoutMs: 2000 });
const api = createTaskApi(client);

try {
  const task = await api.getTaskById(999);
  console.log("Неожиданно получена задача:", task);
} catch (error) {
  console.log("kind:", error.kind);
  console.log("status:", error.status);
  console.log("code:", error.code);
  console.log("message:", error.message);
}
