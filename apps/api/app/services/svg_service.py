from __future__ import annotations

from pathlib import Path

from app.models.schemas import ProjectRecord


VIEWBOX_MAP = {
    "ppt169": (1280, 720),
    "ppt43": (1024, 768),
    "xhs": (1242, 1660),
    "story": (1080, 1920),
}


class SvgService:
    def generate(self, project: ProjectRecord) -> None:
        width, height = VIEWBOX_MAP.get(project.output_format, (1280, 720))
        output_dir = Path(project.project_path) / "svg_output"
        notes_dir = Path(project.project_path) / "notes"
        output_dir.mkdir(parents=True, exist_ok=True)
        notes_dir.mkdir(parents=True, exist_ok=True)

        note_lines: list[str] = []
        for slide in project.slides:
            svg = self._render_slide(width, height, project.name, slide.page, slide.title, slide.bullets)
            file_path = output_dir / f"slide_{slide.page:02d}.svg"
            file_path.write_text(svg, encoding="utf-8")
            note_lines.append(f"# Page {slide.page}\n\n{slide.objective}\n")

        (notes_dir / "total.md").write_text("\n".join(note_lines), encoding="utf-8")

    def list_previews(self, project: ProjectRecord) -> list[tuple[str, str]]:
        output_dir = Path(project.project_path) / "svg_output"
        previews: list[tuple[str, str]] = []
        for svg_file in sorted(output_dir.glob("*.svg")):
            previews.append((svg_file.name, svg_file.read_text(encoding="utf-8")))
        return previews

    def _render_slide(self, width: int, height: int, project_name: str, page: int, title: str, bullets: list[str]) -> str:
        bullet_markup = []
        y = 260
        for bullet in bullets:
            bullet_markup.append(
                f'<circle cx="132" cy="{y - 8}" r="6" fill="#00796b" />'
                f'<text x="154" y="{y}" font-size="28" fill="#102a43" font-family="Microsoft YaHei">{bullet}</text>'
            )
            y += 64

        return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}">
  <rect width="{width}" height="{height}" fill="#f5efe4" />
  <rect x="64" y="64" width="24" height="{height - 128}" fill="#00796b" />
  <text x="120" y="132" font-size="28" fill="#00796b" font-family="Microsoft YaHei">PPT Maker MVP</text>
  <text x="120" y="208" font-size="44" font-weight="700" fill="#102a43" font-family="Microsoft YaHei">{title}</text>
  {''.join(bullet_markup)}
  <rect x="820" y="170" width="360" height="360" rx="28" fill="#102a43" />
  <text x="860" y="250" font-size="30" fill="#f5efe4" font-family="Microsoft YaHei">项目：{project_name}</text>
  <text x="860" y="318" font-size="24" fill="#d9e2ec" font-family="Microsoft YaHei">页码：{page:02d}</text>
  <text x="860" y="386" font-size="24" fill="#d9e2ec" font-family="Microsoft YaHei">结构化 SVG 草稿</text>
  <text x="860" y="454" font-size="24" fill="#d9e2ec" font-family="Microsoft YaHei">可继续接入 ppt-master 深度生成</text>
</svg>'''