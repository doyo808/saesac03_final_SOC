import { AxiosHeaders } from "axios";
import { api } from "./client";
import type { RequestScenarioRun, RequestScenarioTemplate } from "../types";

const CUSTOM_SCENARIOS_STORAGE_KEY = "campus.request-scenarios.custom";
const RUN_HISTORY_STORAGE_KEY = "campus.request-scenarios.runs";
const MAX_RUN_HISTORY = 30;

function hasWindow() {
  return typeof window !== "undefined";
}

function readStorage<T>(key: string, fallback: T): T {
  if (!hasWindow()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  if (!hasWindow()) {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures and keep in-memory behavior only.
  }
}

function normalizeResponseSnippet(data: unknown) {
  if (typeof data === "string") {
    return data.slice(0, 240);
  }

  if (data == null) {
    return "";
  }

  try {
    return JSON.stringify(data).slice(0, 240);
  } catch {
    return String(data).slice(0, 240);
  }
}

export function loadCustomRequestScenarios() {
  return readStorage<RequestScenarioTemplate[]>(CUSTOM_SCENARIOS_STORAGE_KEY, []);
}

export function saveCustomRequestScenario(
  scenario: Omit<RequestScenarioTemplate, "id" | "source"> & { id?: string },
) {
  const items = loadCustomRequestScenarios();
  const nextScenario: RequestScenarioTemplate = {
    ...scenario,
    id: scenario.id ?? `custom-${Date.now()}`,
    source: "custom",
  };

  const nextItems = items.some((item) => item.id === nextScenario.id)
    ? items.map((item) => (item.id === nextScenario.id ? nextScenario : item))
    : [nextScenario, ...items];

  writeStorage(CUSTOM_SCENARIOS_STORAGE_KEY, nextItems);
  return nextScenario;
}

export function deleteCustomRequestScenario(id: string) {
  const nextItems = loadCustomRequestScenarios().filter((item) => item.id !== id);
  writeStorage(CUSTOM_SCENARIOS_STORAGE_KEY, nextItems);
}

export function loadRequestScenarioRuns() {
  return readStorage<RequestScenarioRun[]>(RUN_HISTORY_STORAGE_KEY, []);
}

function saveRequestScenarioRun(run: RequestScenarioRun) {
  const nextRuns = [run, ...loadRequestScenarioRuns()].slice(0, MAX_RUN_HISTORY);
  writeStorage(RUN_HISTORY_STORAGE_KEY, nextRuns);
}

export async function executeRequestScenario(
  scenario: RequestScenarioTemplate,
  userEmail: string,
): Promise<RequestScenarioRun> {
  const startedAt = performance.now();

  const headers = AxiosHeaders.from();
  headers.set("X-Request-Scenario-Id", scenario.id);
  headers.set("X-Request-Scenario-Class", scenario.expectedClass);
  if (scenario.contentType) {
    headers.set("Content-Type", scenario.contentType);
  }

  const response = await api.request({
    method: scenario.method,
    url: scenario.rawUrl,
    data: scenario.body,
    headers,
    validateStatus: () => true,
  });

  const run: RequestScenarioRun = {
    id: `run-${Date.now()}`,
    scenarioId: scenario.id,
    title: scenario.title,
    expectedClass: scenario.expectedClass,
    method: scenario.method,
    rawUrl: scenario.rawUrl,
    status: response.status,
    durationMs: Math.round(performance.now() - startedAt),
    responseSnippet: normalizeResponseSnippet(response.data),
    executedAt: new Date().toISOString(),
    userEmail,
  };

  saveRequestScenarioRun(run);
  return run;
}
