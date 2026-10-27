export class ApiError extends Error {
  constructor(message, {
    kind,
    status = null,
    code = null,
    details = null,
    url = null,
    cause,
  } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.details = details;
    this.url = url;
  }
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function parseBaseUrl(baseUrl) {
  if (typeof baseUrl !== "string" || baseUrl.trim() === "") {
    throw new TypeError("baseUrl должен быть непустой строкой.");
  }
  let url;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new TypeError(`baseUrl должен быть абсолютным адресом: ${baseUrl}`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new TypeError("baseUrl должен использовать http или https.");
  }
  if (url.search !== "" || url.hash !== "") {
    throw new TypeError("baseUrl не должен содержать query или hash.");
  }
  return url;
}

// Создаёт URL относительно baseUrl и добавляет непустые параметры query.
// Значения кодируются средствами URL и URLSearchParams, а не вручную.
export function buildUrl(baseUrl, path, query = {}) {
  const base = parseBaseUrl(baseUrl);
  if (typeof path !== "string" || path.trim() === "" || /^[a-z][a-z\d+.-]*:/i.test(path)) {
    throw new TypeError("path должен быть непустым относительным путём.");
  }
  if (query === null || typeof query !== "object" || Array.isArray(query)) {
    throw new TypeError("query должен быть обычным объектом.");
  }

  // Лишние слеши по краям убираются, чтобы не получить "api//tasks".
  const basePath = base.pathname.replace(/\/+$/, "");
  const relativePath = path.replace(/^\/+/, "");
  const url = new URL(`${basePath}/${relativePath}`, base.origin);

  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(query)) {
    // false и 0 — настоящие значения фильтра, поэтому пропускаются только пустые.
    if (value === undefined || value === null || value === "") continue;
    params.append(name, String(value));
  }
  url.search = params.toString();
  return url.toString();
}

function isJsonContentType(contentType) {
  return /^application\/([\w.+-]+\+)?json\s*(;|$)/i.test(contentType ?? "");
}

// fetchFn передаётся явно, чтобы модуль можно было проверить без реальной сети.
// Возвращаемый объект: { requestJson(path, { query, signal, timeoutMs } = {}) }.
export function createApiClient({
  baseUrl,
  fetchFn = globalThis.fetch,
  timeoutMs = 2000,
} = {}) {
  parseBaseUrl(baseUrl);
  if (typeof fetchFn !== "function") {
    throw new TypeError("fetchFn должен быть функцией.");
  }
  if (!isPositiveSafeInteger(timeoutMs)) {
    throw new TypeError("timeoutMs должен быть положительным целым числом.");
  }
  const defaultTimeoutMs = timeoutMs;

  async function requestJson(path, { query = {}, signal, timeoutMs = defaultTimeoutMs } = {}) {
    const url = buildUrl(baseUrl, path, query);
    if (!isPositiveSafeInteger(timeoutMs)) {
      throw new TypeError("timeoutMs должен быть положительным целым числом.");
    }

    // Внешний сигнал (отмена пользователем) объединяется с тайм-аутом.
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const requestSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

    // Причина отказа определяется по сигналам, а не по тексту исключения.
    function abortError(cause) {
      if (signal?.aborted) {
        return new ApiError("Запрос отменён.", { kind: "aborted", url, cause });
      }
      if (timeoutSignal.aborted) {
        return new ApiError(`Превышено время ожидания ответа (${timeoutMs} мс).`, {
          kind: "timeout", url, cause,
        });
      }
      return null;
    }

    let response;
    try {
      response = await fetchFn(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: requestSignal,
      });
    } catch (error) {
      throw abortError(error)
        ?? new ApiError("Не удалось связаться с сервером.", { kind: "network", url, cause: error });
    }

    if (!(response instanceof Response)) {
      throw new ApiError("fetchFn вернул значение, не являющееся Response.", {
        kind: "invalid-response", url,
      });
    }

    const contentType = response.headers.get("Content-Type");

    // HTTP-ошибка обрабатывается первой: статус важнее формата тела.
    if (!response.ok) {
      let payload = null;
      if (isJsonContentType(contentType)) {
        try {
          payload = JSON.parse(await response.text());
        } catch {
          payload = null;
        }
      }
      const apiError = payload?.error;
      throw new ApiError(
        typeof apiError?.message === "string" && apiError.message !== ""
          ? apiError.message
          : `Сервер вернул HTTP ${response.status}.`,
        {
          kind: "http",
          status: response.status,
          code: typeof apiError?.code === "string" ? apiError.code : null,
          details: apiError?.details ?? null,
          url,
        },
      );
    }

    if (response.status === 204) return null;

    if (!isJsonContentType(contentType)) {
      throw new ApiError(`Ожидался JSON, получен ${contentType ?? "ответ без Content-Type"}.`, {
        kind: "invalid-response", url,
      });
    }

    let text;
    try {
      text = await response.text();
    } catch (error) {
      throw abortError(error)
        ?? new ApiError("Не удалось прочитать тело ответа.", { kind: "network", url, cause: error });
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      throw new ApiError("Сервер вернул повреждённый JSON.", {
        kind: "invalid-response", url, cause: error,
      });
    }
  }

  return { requestJson };
}
