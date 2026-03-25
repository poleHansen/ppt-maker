"use client";

import { ChangeEvent, useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { listModelProfiles, ModelProfile, saveModelProfile, validateModelProfile } from "@/lib/api";


const emptyProfile: ModelProfile = {
  id: "",
  provider_name: "",
  display_name: "",
  base_url: "",
  api_key: "",
  model_name: "",
  stage_mapping: { brief: "", planning: "", export: "" },
  enabled: true,
};


export default function ModelsPage() {
  const [profiles, setProfiles] = useState<ModelProfile[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [form, setForm] = useState<ModelProfile>(emptyProfile);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    listModelProfiles()
      .then((items) => {
        setProfiles(items);
        if (items[0]) {
          setSelectedId(items[0].id);
          setForm(items[0]);
        }
      })
      .catch((error) => setMessage(error.message));
  }, []);

  function selectProfile(profileId: string) {
    setSelectedId(profileId);
    const profile = profiles.find((item) => item.id === profileId);
    if (profile) {
      setForm(profile);
    }
  }

  function handleFieldChange(key: keyof ModelProfile) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const value = key === "enabled" ? (event.target as HTMLInputElement).checked : event.target.value;
      setForm((current) => ({ ...current, [key]: value }));
    };
  }

  function handleStageChange(stage: string) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({
        ...current,
        stage_mapping: { ...current.stage_mapping, [stage]: event.target.value },
      }));
    };
  }

  async function handleSave() {
    setMessage(null);
    const payload = { ...form, id: form.id || `${form.provider_name || "custom"}-${Date.now()}` };
    try {
      const updated = await saveModelProfile(payload);
      setProfiles(updated);
      setSelectedId(payload.id);
      setForm(updated.find((item) => item.id === payload.id) ?? payload);
      setMessage("模型配置已保存。")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    }
  }

  async function handleValidate() {
    setMessage(null);
    try {
      const result = await validateModelProfile(form);
      setMessage(result.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "校验失败");
    }
  }

  function handleCreateNew() {
    setSelectedId("");
    setForm(emptyProfile);
    setMessage("正在创建新的模型配置。")
  }

  return (
    <AppShell>
      <SectionCard title="模型配置" description="把模型档案从只读展示升级为可编辑、可持久化的配置中心，支持阶段映射与基础校验。">
        <div className="mb-6 flex flex-wrap gap-3">
          <button className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white" onClick={handleCreateNew} type="button">
            新建配置
          </button>
          <button className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700" onClick={handleValidate} type="button">
            校验配置
          </button>
          <button className="rounded-full border border-teal-700 px-6 py-3 text-sm font-semibold text-teal-800" onClick={handleSave} type="button">
            保存配置
          </button>
          {message ? <span className="text-sm text-slate-600">{message}</span> : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="grid gap-3">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                className={`rounded-3xl border px-5 py-4 text-left ${selectedId === profile.id ? "border-teal-700 bg-teal-50" : "border-slate-200 bg-slate-50"}`}
                onClick={() => selectProfile(profile.id)}
                type="button"
              >
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-slate-900">{profile.display_name}</strong>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${profile.enabled ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                    {profile.enabled ? "启用中" : "已停用"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{profile.provider_name} / {profile.model_name}</p>
              </button>
            ))}
          </div>

          <div className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <label className="grid gap-2 text-sm text-slate-700">
              <span className="font-medium text-slate-900">配置 ID</span>
              <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3" onChange={handleFieldChange("id")} value={form.id} />
            </label>
            <label className="grid gap-2 text-sm text-slate-700">
              <span className="font-medium text-slate-900">显示名称</span>
              <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3" onChange={handleFieldChange("display_name")} value={form.display_name} />
            </label>
            <label className="grid gap-2 text-sm text-slate-700">
              <span className="font-medium text-slate-900">供应商名称</span>
              <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3" onChange={handleFieldChange("provider_name")} value={form.provider_name} />
            </label>
            <label className="grid gap-2 text-sm text-slate-700">
              <span className="font-medium text-slate-900">Base URL</span>
              <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3" onChange={handleFieldChange("base_url")} value={form.base_url} />
            </label>
            <label className="grid gap-2 text-sm text-slate-700">
              <span className="font-medium text-slate-900">默认模型</span>
              <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3" onChange={handleFieldChange("model_name")} value={form.model_name} />
            </label>
            <label className="grid gap-2 text-sm text-slate-700">
              <span className="font-medium text-slate-900">API Key</span>
              <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3" onChange={handleFieldChange("api_key")} value={form.api_key ?? ""} />
            </label>
            <div className="grid gap-3 md:grid-cols-3">
              {Object.entries(form.stage_mapping).map(([stage, model]) => (
                <label key={stage} className="grid gap-2 text-sm text-slate-700">
                  <span className="font-medium capitalize text-slate-900">{stage} 阶段</span>
                  <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3" onChange={handleStageChange(stage)} value={model} />
                </label>
              ))}
            </div>
            <label className="flex items-center gap-3 text-sm text-slate-700">
              <input checked={form.enabled} onChange={handleFieldChange("enabled")} type="checkbox" />
              启用该模型配置
            </label>
          </div>
        </div>
      </SectionCard>
    </AppShell>
  );
}