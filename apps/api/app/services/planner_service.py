from __future__ import annotations

from app.models.schemas import BriefPayload, PlanSlide


class PlannerService:
    def build_outline(self, brief: BriefPayload) -> list[str]:
        return [
            f"背景与目标：{brief.goal}",
            f"对象与场景：{brief.audience} / {brief.scenario}",
            "关键论点与支撑证据",
            "实施路径与里程碑",
            "结论与行动建议",
        ]

    def build_slides(self, brief: BriefPayload) -> list[PlanSlide]:
        slide_count = max(5, min(brief.page_count, 12))
        titles = [
            "封面与结论先导",
            "问题背景与机会窗口",
            "用户/对象画像",
            "核心方案结构",
            "关键页面示意",
            "实施节奏与分工",
            "价值评估与风险控制",
            "结论与下一步",
        ]
        slides: list[PlanSlide] = []
        for index in range(slide_count):
            title = titles[index] if index < len(titles) else f"补充页 {index + 1}"
            slides.append(
                PlanSlide(
                    page=index + 1,
                    title=title,
                    objective=f"围绕“{brief.goal}”推进第 {index + 1} 页的信息表达",
                    bullets=[
                        f"服务对象：{brief.audience}",
                        f"使用场景：{brief.scenario}",
                        f"风格方向：{brief.style}",
                    ],
                    visual_hint="咨询风信息卡片 + 结构化图形",
                )
            )
        return slides

    def build_design_spec(self, brief: BriefPayload, output_format: str) -> dict[str, str]:
        return {
            "theme": f"{brief.goal} 演示文稿",
            "style_objective": brief.style,
            "color_scheme": "深墨蓝 + 米白 + 青绿色强调",
            "typography": "中文标题加粗，正文保持 14-16pt 可读性",
            "imagery": "MVP 以结构图和数据块为主，减少无关装饰图",
            "page_count_strategy": f"建议控制在 {brief.page_count} 页左右，突出重点信息分层",
            "notes": f"画布格式：{output_format}；目标受众：{brief.audience}；图标策略：优先使用线性图标与几何示意",
        }