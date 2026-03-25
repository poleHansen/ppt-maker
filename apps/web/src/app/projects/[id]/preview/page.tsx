"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { exportProject, getExportDownloadUrl, getProject, getProjectLogs, listPreviews, ProjectLogEntry, ProjectRecord, SlidePreview } from "@/lib/api";


const statusText: Record<string, string> = {
  draft: "草稿",
  sources_ready: "资料已导入",
  brief_ready: "简报已完成",
  planning_ready: "规划已完成",
  svg_ready: "SVG 已生成",
  exporting: "导出中",
  exported: "已导出",
  failed: "失败",
};


export default function PreviewPage() {
  const params = useParams<{ id: string }>();
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [slides, setSlides] = useState<SlidePreview[]>([]);
  const [logs, setLogs] = useState<ProjectLogEntry[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    Promise.all([getProject(params.id), listPreviews(params.id), getProjectLogs(params.id)])
      .then(([projectResponse, previewResponse, logsResponse]) => {
        setProject(projectResponse);
        setSlides(previewResponse);
        setLogs(logsResponse.logs);
      })
      .catch((error) => setMessage(error.message));
  }, [params.id]);

  async function handleExport() {
    setExporting(true);
    setMessage(null);
    try {
      const result = await exportProject(params.id);
      setMessage(`PPTX 已导出：${result.pptx_path}`);
      const [latestProject, latestLogs] = await Promise.all([getProject(params.id), getProjectLogs(params.id)]);
      setProject(latestProject);
      setLogs(latestLogs.logs);
      window.open(getExportDownloadUrl(params.id), "_blank", "noopener,noreferrer");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "导出失败");
    } finally {
      setExporting(false);
    }
  }

  return (
    <AppShell>
      <SectionCard title="SVG 预览与导出" description="MVP 当前会先生成结构化 SVG 草稿，再复用 ppt-master 后处理与导出脚本生成真实 PPTX。">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <button className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={exporting} onClick={handleExport} type="button">
            {exporting ? "导出中..." : "真实导出 PPTX"}
          </button>
          <a className={`rounded-full border px-6 py-3 text-sm font-semibold ${project?.export_file ? "border-emerald-700 text-emerald-800" : "pointer-events-none border-slate-300 text-slate-400"}`} href={project?.export_file ? getExportDownloadUrl(params.id) : undefined} target="_blank" rel="noreferrer">
            下载已导出的 PPTX
          </a>
          {project?.export_file ? <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm text-emerald-800">已导出到：{project.export_file}</span> : null}
          {project?.status ? <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">当前状态：{statusText[project.status] ?? project.status}</span> : null}
          {message ? <span className="text-sm text-slate-600">{message}</span> : null}
        </div>

        <article className="mb-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">执行日志</h3>
          <div className="grid gap-3">
            {logs.length === 0 ? <p className="text-sm text-slate-500">当前还没有执行日志。</p> : logs.slice().reverse().map((log) => (
              <div key={`${log.timestamp}-${log.stage}-${log.message}`} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="font-medium text-slate-900">{log.stage}</span>
                  <span className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleString("zh-CN")}</span>
                </div>
                <p className="mt-2">[{log.level}] {log.message}</p>
              </div>
            ))}
          </div>
        </article>

        <div className="grid gap-6">
          {slides.map((slide) => (
            <article key={slide.filename} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">{slide.filename}</h3>
                <span className="text-sm text-slate-500">项目状态：{project?.status ?? "未知"}</span>
              </div>
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-4">
                <div dangerouslySetInnerHTML={{ __html: slide.svg_content }} />
              </div>
            </article>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}