const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export type QueueItem = {
  submission_id: string;
  scenario_id?: string;
  broker?: string;
  insured?: string;
  product?: string;
  stage?: string;
  risk_level?: string;
  recommended_action?: string;
  approval_status?: string;
  errors?: string[];
  priority_score?: number;
  workflow_complete?: boolean;
};

export type AgentState = Record<string, unknown>;

export function listScenarios() {
  return api<{ scenario_id: string; title: string; description: string; expected_action: string }[]>(
    "/scenarios"
  );
}

export function listSubmissions() {
  return api<{ submissions: QueueItem[]; banner: string }>("/submissions");
}

export function getSubmission(id: string) {
  return api<{ state: AgentState; banner: string }>(`/submissions/${id}`);
}

export function createFromScenario(scenarioId: string) {
  return api<{ submission_id: string; state: AgentState }>(
    `/submissions/from-scenario/${scenarioId}`,
    { method: "POST" }
  );
}

export function runSubmission(id: string) {
  return api<{ state: AgentState }>(`/submissions/${id}/run`, { method: "POST" });
}

export function approveSubmission(
  id: string,
  body: {
    user?: string;
    decision: string;
    final_action?: string;
    override_reason?: string;
  }
) {
  return api<{ state: AgentState }>(`/submissions/${id}/approve`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function recordOutcome(
  id: string,
  body: Record<string, unknown>
) {
  return api<{ state: AgentState }>(`/submissions/${id}/outcome`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getMetrics() {
  return api<Record<string, unknown>>("/agent/metrics");
}

export function getGovernance() {
  return api<Record<string, unknown>>("/agent/governance");
}

export function getUseCases() {
  return api<Record<string, unknown>>("/agent/use-cases");
}
