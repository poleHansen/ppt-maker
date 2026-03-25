"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { createProject } from "@/lib/api";


export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    try {
      const project = await createProject({
        name: formData.get("name"),
        language: "zh-CN",
        output_format: formData.get("output_format"),
        template_strategy: formData.get("template_strategy"),
        input_mode: formData.get("input_mode"),
        model_profile_id: formData.get("model_profile_id") || null,
      });
      router.push(`/projects/${project.id}/conversation`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "创建失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <SectionCard title="创建项目" description="MVP 第一阶段默认中文界面。项目创建后会同步建立本地工程目录，并复制可复用模板资产。">
        <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            项目名称
            <input className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none ring-0" name="name" required placeholder="例如：企业 AI 战略汇报" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            输出格式
            <select className="rounded-2xl border border-slate-300 bg-white px-4 py-3" name="output_format" defaultValue="ppt169">
              <option value="ppt169">PPT 16:9</option>
              <option value="ppt43">PPT 4:3</option>
              <option value="xhs">小红书</option>
              <option value="story">Story</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            模板策略
            <select className="rounded-2xl border border-slate-300 bg-white px-4 py-3" name="template_strategy" defaultValue="template_light">
              <option value="template_strict">严格模板</option>
              <option value="template_light">轻模板</option>
              <option value="template_free">自由设计</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            输入模式
            <select className="rounded-2xl border border-slate-300 bg-white px-4 py-3" name="input_mode" defaultValue="intent_mode">
              <option value="intent_mode">主题意图模式</option>
              <option value="file_mode">文件驱动模式</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
            模型档案 ID
            <input className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none ring-0" name="model_profile_id" placeholder="可选，例如 openai-default" />
          </label>
          <div className="md:col-span-2 flex items-center gap-4">
            <button className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={loading} type="submit">
              {loading ? "创建中..." : "创建项目并进入对话页"}
            </button>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
        </form>
      </SectionCard>
    </AppShell>
  );
}