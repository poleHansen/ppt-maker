"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { saveBrief } from "@/lib/api";


export default function ConversationPage() {
  const params = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    try {
      await saveBrief(params.id, {
        audience: formData.get("audience"),
        goal: formData.get("goal"),
        scenario: formData.get("scenario"),
        style: formData.get("style"),
        page_count: Number(formData.get("page_count") ?? 10),
        must_have: String(formData.get("must_have") ?? "").split("\n").filter(Boolean),
        avoid: String(formData.get("avoid") ?? "").split("\n").filter(Boolean),
        source_text: String(formData.get("source_text") ?? ""),
      });
      setMessage("需求简报已保存，可以进入规划页生成大纲与 SVG。 ");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <SectionCard title="对话式需求采集" description="MVP 阶段先用结构化表单表达对话结果，后续可以扩展为流式多轮聊天。">
        <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            目标受众
            <input className="rounded-2xl border border-slate-300 bg-white px-4 py-3" name="audience" required placeholder="例如：企业管理层 / 投资人 / 答辩委员会" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            核心目标
            <input className="rounded-2xl border border-slate-300 bg-white px-4 py-3" name="goal" required placeholder="例如：说服管理层批准项目立项" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            使用场景
            <input className="rounded-2xl border border-slate-300 bg-white px-4 py-3" name="scenario" required placeholder="例如：季度经营会汇报" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            风格偏好
            <input className="rounded-2xl border border-slate-300 bg-white px-4 py-3" name="style" required placeholder="例如：顶级咨询风 / 学术答辩风 / 极简理性风" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            预估页数
            <input className="rounded-2xl border border-slate-300 bg-white px-4 py-3" defaultValue={10} min={5} max={20} name="page_count" type="number" />
          </label>
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-7 text-slate-600">
            建议在这一页把文件模式缺失的信息补全，例如：谁来看、想让对方接受什么结论、哪些内容必须出现、哪些表达要规避。
          </div>
          <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
            必须包含
            <textarea className="min-h-28 rounded-2xl border border-slate-300 bg-white px-4 py-3" name="must_have" placeholder="每行一项，例如：\n市场规模\n竞品差异化\n预算测算" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
            避免出现
            <textarea className="min-h-28 rounded-2xl border border-slate-300 bg-white px-4 py-3" name="avoid" placeholder="每行一项，例如：\n不要过度营销化\n不要使用高饱和渐变" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
            源内容补充 / 粘贴文本
            <textarea className="min-h-40 rounded-2xl border border-slate-300 bg-white px-4 py-3" name="source_text" placeholder="如果暂时没有文件，可先贴入需求摘要、纪要、段落草稿。" />
          </label>
          <div className="md:col-span-2 flex items-center gap-4">
            <button className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={loading} type="submit">
              {loading ? "保存中..." : "保存对话结果"}
            </button>
            <Link className="rounded-full border border-teal-700 px-6 py-3 text-sm font-semibold text-teal-800" href={`/projects/${params.id}/planning`}>
              进入规划页
            </Link>
            {message ? <span className="text-sm text-slate-600">{message}</span> : null}
          </div>
        </form>
      </SectionCard>
    </AppShell>
  );
}