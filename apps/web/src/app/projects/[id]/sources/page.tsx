"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { importProjectSources, SourceImportResponse } from "@/lib/api";


export default function ProjectSourcesPage() {
  const params = useParams<{ id: string }>();
  const [files, setFiles] = useState<File[]>([]);
  const [urls, setUrls] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<SourceImportResponse | null>(null);

  const fileNames = useMemo(() => files.map((file) => file.name).join("、"), [files]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(event.target.files ?? []));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const response = await importProjectSources(params.id, {
        urls: urls.split("\n").map((item) => item.trim()).filter(Boolean),
        pasted_text: pastedText,
        pasted_text_name: "pasted-notes.txt",
        files,
      });
      setSummary(response);
      setMessage("资料已导入，可以继续补充 brief 或直接进入规划页。 ");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "导入失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <SectionCard title="资料导入" description="这一页用于补齐文件模式最小闭环。当前支持 PDF、DOCX、Markdown、URL 和粘贴文本，并通过 ppt-master 的 import-sources 能力做归档和标准化。">
        <form className="grid gap-6" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              上传文件
              <input accept=".pdf,.doc,.docx,.md,.markdown,.txt,.html,.epub,.rst,.tex" className="rounded-2xl border border-slate-300 bg-white px-4 py-3" multiple onChange={handleFileChange} type="file" />
            </label>
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-7 text-slate-600">
              {files.length > 0 ? `已选择：${fileNames}` : "可一次上传多个源文件。对于 PDF / DOCX / URL，会优先复用 ppt-master 的标准化导入逻辑。"}
            </div>
          </div>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            URL 列表
            <textarea className="min-h-28 rounded-2xl border border-slate-300 bg-white px-4 py-3" onChange={(event) => setUrls(event.target.value)} placeholder="每行一个 URL，例如：\nhttps://example.com/report\nhttps://example.com/article" value={urls} />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            粘贴文本
            <textarea className="min-h-40 rounded-2xl border border-slate-300 bg-white px-4 py-3" onChange={(event) => setPastedText(event.target.value)} placeholder="如果你只有会议纪要、摘要、网页摘录，可以先直接粘贴到这里。" value={pastedText} />
          </label>

          <div className="flex flex-wrap items-center gap-4">
            <button className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={submitting} type="submit">
              {submitting ? "导入中..." : "开始导入资料"}
            </button>
            <Link className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700" href={`/projects/${params.id}/conversation`}>
              返回对话采集
            </Link>
            <Link className="rounded-full border border-teal-700 px-6 py-3 text-sm font-semibold text-teal-800" href={`/projects/${params.id}/planning`}>
              前往规划页
            </Link>
            {message ? <span className="text-sm text-slate-600">{message}</span> : null}
          </div>
        </form>

        {summary ? (
          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">导入结果</h3>
              <dl className="grid gap-3 text-sm text-slate-700">
                <div>
                  <dt className="font-medium text-slate-900">归档文件</dt>
                  <dd>{summary.archived.length}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-900">标准化 Markdown</dt>
                  <dd>{summary.markdown.length}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-900">附属资源目录</dt>
                  <dd>{summary.assets.length}</dd>
                </div>
              </dl>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">处理备注</h3>
              <ul className="space-y-2 text-sm leading-7 text-slate-700">
                {summary.notes.length > 0 ? summary.notes.map((item) => <li key={item}>- {item}</li>) : <li>- 本次没有额外备注。</li>}
                {summary.skipped.map((item) => <li key={item} className="text-amber-700">- {item}</li>)}
              </ul>
            </article>
          </div>
        ) : null}
      </SectionCard>
    </AppShell>
  );
}