"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { DesignSpecPayload, getProject, ProjectRecord, updateDesignSpec } from "@/lib/api";


const fieldLabels: Record<keyof DesignSpecPayload, string> = {
  theme: "主题定位",
  style_objective: "风格目标",
  color_scheme: "配色方案",
  typography: "字体策略",
  imagery: "图片策略",
  page_count_strategy: "页数策略",
  notes: "补充备注",
};


const emptySpec: DesignSpecPayload = {
  theme: "",
  style_objective: "",
  color_scheme: "",
  typography: "",
  imagery: "",
  page_count_strategy: "",
  notes: "",
};


export default function DesignSpecPage() {
  const params = useParams<{ id: string }>();
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [form, setForm] = useState<DesignSpecPayload>(emptySpec);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProject(params.id)
      .then((result) => {
        setProject(result);
        setForm(result.design_spec ?? emptySpec);
      })
      .catch((error) => setMessage(error.message));
  }, [params.id]);

  function handleChange(key: keyof DesignSpecPayload) {
    return (event: ChangeEvent<HTMLTextAreaElement>) => {
      setForm((current) => ({ ...current, [key]: event.target.value }));
    };
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const updated = await updateDesignSpec(params.id, form);
      setProject(updated);
      setForm(updated.design_spec);
      setMessage("设计规格已保存，可继续回到规划页或直接导出。 ");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <SectionCard title="设计规格编辑" description="把设计规格作为独立中间资产进行查看、补充和修订，后续 SVG 生成与导出会基于这份内容持续收敛。">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <button className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={saving} onClick={handleSave} type="button">
            {saving ? "保存中..." : "保存设计规格"}
          </button>
          <Link className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700" href={`/projects/${params.id}/planning`}>
            返回规划页
          </Link>
          <Link className="rounded-full border border-teal-700 px-6 py-3 text-sm font-semibold text-teal-800" href={`/projects/${params.id}/preview`}>
            前往预览导出
          </Link>
          {project ? <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">项目：{project.name}</span> : null}
          {message ? <span className="text-sm text-slate-600">{message}</span> : null}
        </div>

        <div className="grid gap-5">
          {(Object.keys(fieldLabels) as Array<keyof DesignSpecPayload>).map((key) => (
            <label key={key} className="grid gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <span className="text-sm font-semibold text-slate-900">{fieldLabels[key]}</span>
              <textarea
                className="min-h-28 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-800 outline-none transition focus:border-teal-700"
                onChange={handleChange(key)}
                value={form[key]}
              />
            </label>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}