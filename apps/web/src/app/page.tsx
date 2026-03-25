import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";

export default function Home() {
  return (
    <AppShell>
      <section className="grid gap-6 rounded-[36px] bg-slate-950 px-8 py-10 text-white shadow-[0_30px_120px_rgba(15,23,42,0.3)] lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <span className="inline-flex rounded-full border border-white/20 px-4 py-2 text-sm text-white/80">
            中文多页面 PPT 生成平台 MVP
          </span>
          <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-tight">
            把需求采集、规划、SVG 生成与真实 PPTX 导出，收敛进一个可演示的 Web 工作流。
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-300">
            前端基于 Next.js，后端基于 FastAPI。项目创建、规划输出、SVG 草稿生成和真实导出都通过统一项目模型管理，并按需复用 ppt-master 的成熟脚本能力。
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/projects/new" className="rounded-full bg-[#f4c95d] px-6 py-3 text-sm font-semibold text-slate-950">
              开始创建项目
            </Link>
            <Link href="/models" className="rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white">
              查看模型配置
            </Link>
          </div>
        </div>
        <div className="grid gap-4 rounded-[28px] bg-white/10 p-5">
          <div className="rounded-3xl bg-white/10 p-5">
            <p className="text-sm text-slate-300">流程阶段</p>
            <p className="mt-2 text-xl font-semibold">创建项目 → 对话采集 → 规划生成 → SVG 预览 → PPTX 导出</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-3xl bg-[#0f766e] p-5">
              <p className="text-sm text-white/80">输入模式</p>
              <p className="mt-2 text-lg font-semibold">文件驱动 / 意图驱动统一项目模型</p>
            </div>
            <div className="rounded-3xl bg-[#7c2d12] p-5">
              <p className="text-sm text-white/80">输出能力</p>
              <p className="mt-2 text-lg font-semibold">真实复用 ppt-master 后处理与导出链路</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="项目管理" description="按企业项目结构组织项目目录、日志、导出物和模板资源。">
          <p className="text-sm leading-7 text-slate-600">项目创建时自动建立本地工作目录，并同步可复用的 SVG 模板资源目录。</p>
        </SectionCard>
        <SectionCard title="规划中台" description="把 brief、outline、slide plan 与 design spec 汇聚成统一中间层。">
          <p className="text-sm leading-7 text-slate-600">MVP 先提供结构化生成与可视化查看，为后续深度生成和多轮修订留出扩展位。</p>
        </SectionCard>
        <SectionCard title="导出闭环" description="严格复用 ppt-master 的后处理顺序，保证 PPT 产物真实可下载。">
          <p className="text-sm leading-7 text-slate-600">当前版本已预留并实现真实导出接口，后续只需增强 SVG 质量即可提高最终 PPT 效果。</p>
        </SectionCard>
      </div>
    </AppShell>
  );
}
