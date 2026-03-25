import Link from "next/link";
import { ReactNode } from "react";


const links = [
  { href: "/", label: "首页" },
  { href: "/projects", label: "项目列表" },
  { href: "/projects/new", label: "创建项目" },
  { href: "/models", label: "模型配置" },
];


export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f6f0e8_0%,#efe5d7_38%,#e4ece7_100%)] text-slate-900">
      <header className="border-b border-slate-900/10 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-semibold tracking-tight text-slate-950">
            PPT Maker MVP
          </Link>
          <nav className="flex gap-3 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-slate-300 px-4 py-2 text-slate-700 transition hover:border-teal-700 hover:text-teal-800"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8">{children}</main>
    </div>
  );
}