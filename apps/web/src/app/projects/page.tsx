import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { listProjects } from "@/lib/api";


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


export default async function ProjectsPage() {
  const projects = await listProjects().catch(() => []);

  return (
    <AppShell>
      <SectionCard title="项目列表" description="查看所有 PPT 项目，按流程继续推进创建、规划、预览和导出。">
        <div className="grid gap-4">
          {projects.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
              暂无项目，先去创建一个新的中文演示文稿项目。
            </div>
          ) : (
            projects.map((project) => (
              <article key={project.id} className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{project.name}</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    状态：{statusText[project.status] ?? project.status} / 画布：{project.output_format} / 模式：{project.input_mode}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    最近更新：{new Date(project.updated_at).toLocaleString("zh-CN")}
                    {project.last_exported_at ? ` / 最近导出：${new Date(project.last_exported_at).toLocaleString("zh-CN")}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white" href={`/projects/${project.id}/conversation`}>
                    对话采集
                  </Link>
                  <Link className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700" href={`/projects/${project.id}/sources`}>
                    资料导入
                  </Link>
                  <Link className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700" href={`/projects/${project.id}/planning`}>
                    规划查看
                  </Link>
                  <Link className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700" href={`/projects/${project.id}/design-spec`}>
                    设计规格
                  </Link>
                  <Link className="rounded-full border border-teal-700 px-4 py-2 text-sm font-medium text-teal-800" href={`/projects/${project.id}/preview`}>
                    预览导出
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      </SectionCard>
    </AppShell>
  );
}