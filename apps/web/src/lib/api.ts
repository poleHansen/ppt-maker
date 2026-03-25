const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail ?? "请求失败");
  }

  return response.json() as Promise<T>;
}

export type ProjectSummary = {
  id: string;
  name: string;
  status: string;
  output_format: string;
  input_mode: string;
  updated_at: string;
  last_exported_at?: string | null;
};

export type ProjectLogEntry = {
  timestamp: string;
  stage: string;
  level: "info" | "success" | "warning" | "error";
  message: string;
};

export type DesignSpecPayload = {
  theme: string;
  style_objective: string;
  color_scheme: string;
  typography: string;
  imagery: string;
  page_count_strategy: string;
  notes: string;
};

export type ProjectRecord = {
  id: string;
  name: string;
  language: string;
  output_format: string;
  template_strategy: string;
  input_mode: string;
  status: string;
  project_path: string;
  created_at: string;
  updated_at: string;
  last_exported_at?: string | null;
  outline: string[];
  design_spec: DesignSpecPayload;
  logs: ProjectLogEntry[];
  slides: Array<{
    page: number;
    title: string;
    objective: string;
    bullets: string[];
    visual_hint: string;
  }>;
  export_file?: string | null;
  brief?: {
    audience: string;
    goal: string;
    scenario: string;
    style: string;
    page_count: number;
    must_have: string[];
    avoid: string[];
    source_text: string;
  } | null;
};

export type PlanningResponse = {
  project: ProjectRecord;
  design_spec: DesignSpecPayload;
};

export type ModelProfile = {
  id: string;
  provider_name: string;
  display_name: string;
  base_url: string;
  api_key?: string;
  model_name: string;
  stage_mapping: Record<string, string>;
  enabled: boolean;
};

export type ModelValidationResponse = {
  profile_id: string;
  ok: boolean;
  message: string;
};

export type SlidePreview = {
  filename: string;
  svg_content: string;
};

export type SourceAsset = {
  kind: "upload" | "url" | "text";
  name: string;
  original_value: string;
  stored_path?: string | null;
  normalized_markdown_path?: string | null;
};

export type SourceImportResponse = {
  project_id: string;
  imported: SourceAsset[];
  archived: string[];
  markdown: string[];
  assets: string[];
  notes: string[];
  skipped: string[];
};

export type ProjectLogsResponse = {
  project_id: string;
  logs: ProjectLogEntry[];
};

export async function listProjects() {
  return request<ProjectSummary[]>("/projects");
}

export async function createProject(payload: Record<string, unknown>) {
  return request<ProjectRecord>("/projects", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getProject(projectId: string) {
  return request<ProjectRecord>(`/projects/${projectId}`);
}

export async function saveBrief(projectId: string, payload: Record<string, unknown>) {
  return request<ProjectRecord>(`/projects/${projectId}/brief`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function generatePlan(projectId: string) {
  return request<PlanningResponse>(`/projects/${projectId}/plan`, {
    method: "POST",
  });
}

export async function getProjectLogs(projectId: string) {
  return request<ProjectLogsResponse>(`/projects/${projectId}/logs`);
}

export async function updateDesignSpec(projectId: string, payload: DesignSpecPayload) {
  return request<ProjectRecord>(`/projects/${projectId}/design-spec`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function listModelProfiles() {
  return request<ModelProfile[]>("/model-profiles");
}

export async function saveModelProfile(payload: ModelProfile) {
  return request<ModelProfile[]>("/model-profiles", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function validateModelProfile(payload: ModelProfile) {
  return request<ModelValidationResponse>("/model-profiles/validate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listPreviews(projectId: string) {
  return request<SlidePreview[]>(`/projects/${projectId}/previews`);
}

export async function exportProject(projectId: string) {
  return request<{ project_id: string; pptx_path: string }>(`/projects/${projectId}/export`, {
    method: "POST",
  });
}

export async function importProjectSources(projectId: string, payload: { urls: string[]; pasted_text: string; pasted_text_name?: string; files: File[] }) {
  const formData = new FormData();
  formData.append("urls", JSON.stringify(payload.urls.filter(Boolean)));
  formData.append("pasted_text", payload.pasted_text);
  formData.append("pasted_text_name", payload.pasted_text_name ?? "pasted-notes.txt");
  payload.files.forEach((file) => formData.append("files", file));

  const response = await fetch(`${API_BASE}/projects/${projectId}/sources`, {
    method: "POST",
    body: formData,
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail ?? "导入资料失败");
  }

  return response.json() as Promise<SourceImportResponse>;
}

export function getExportDownloadUrl(projectId: string) {
  return `${API_BASE}/projects/${projectId}/export/download`;
}