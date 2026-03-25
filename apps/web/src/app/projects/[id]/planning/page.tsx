"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { DesignSpecPayload, generatePlan, getProject, PlanningResponse, ProjectRecord } from "@/lib/api";


export default function PlanningPage() {
  const params = useParams<{ id: string }>();
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [designSpec, setDesignSpec] = useState<DesignSpecPayload | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getProject(params.id)
      .then((result) => {
        setProject(result);
        setDesignSpec(result.design_spec);
      })
      .catch((error) => setMessage(error.message));
  }, [params.id]);

  async function handleGeneratePlan() {
    try {
      const response: PlanningResponse = await generatePlan(params.id);
      setProject(response.project);
      setDesignSpec(response.design_spec);
      setMessage("大纲、页级规划和 SVG 草稿已经生成，可以进入预览导出页。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "生成失败");
    }
  }

  return (
    <AppShell>
      <SectionCard title="大纲与规划" description="这里聚合 brief、outline、slide plan 与精简 design spec。MVP 会同步生成结构化 SVG 草稿。">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <button className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white" onClick={handleGeneratePlan} type="button">
            生成大纲与 SVG 草稿
          </button>
          <Link className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700" href={`/projects/${params.id}/sources`}>
            导入资料
          </Link>
          <Link className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700" href={`/projects/${params.id}/design-spec`}>
            编辑设计规格
          </Link>
          <Link className="rounded-full border border-teal-700 px-6 py-3 text-sm font-semibold text-teal-800" href={`/projects/${params.id}/preview`}>
            前往预览与导出
          </Link>
          {message ? <span className="text-sm text-slate-600">{message}</span> : null}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">大纲</h3>
              <ol className="space-y-3 text-sm leading-7 text-slate-700">
                {(project?.outline ?? []).map((item, index) => (
                  <li key={item}>{index + 1}. {item}</li>
                ))}
              </ol>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">逐页规划</h3>
              <div className="grid gap-4">
                {(project?.slides ?? []).map((slide) => (
                  <div key={slide.page} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <strong className="text-slate-900">第 {slide.page} 页 · {slide.title}</strong>
                      <span className="text-xs text-slate-500">{slide.visual_hint}</span>
                    </div>
                    <p className="mb-2 text-sm text-slate-600">{slide.objective}</p>
                    <ul className="space-y-1 text-sm text-slate-700">
                      {slide.bullets.map((bullet) => <li key={bullet}>- {bullet}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">设计规格</h3>
            <dl className="space-y-3 text-sm">
              {Object.entries(designSpec ?? {}).map(([key, value]) => (
                <div key={key}>
                  <dt className="font-medium text-slate-900">{key}</dt>
                  <dd className="mt-1 leading-6 text-slate-600">{value}</dd>
                </div>
              ))}
            </dl>
          </article>
        </div>
      </SectionCard>
    </AppShell>
  );
}