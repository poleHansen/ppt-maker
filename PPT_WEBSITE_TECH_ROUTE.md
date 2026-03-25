# PPT Website Technical Route

## 1. 目标

实现一个可演示、可继续演进的中文 PPT 生成平台 MVP，满足以下硬要求：

1. 前端为多页面中文界面。
2. 包含首页、模型配置、项目列表、创建项目、对话采集、规划查看、预览导出七类核心页面。
3. 前端使用 Next.js，后端使用 Python FastAPI。
4. 支持真实 PPTX 导出，不做伪导出或仅下载 SVG。
5. 复用 `D:/code/ppt-master` 的关键逻辑与脚本能力，但不把整个项目直接嵌入当前仓库。
6. 单独维护本地 SVG 模板资产目录，作为当前系统的稳定资源层。

当前 MVP 的目标不是一次性做完完整生产系统，而是打通从项目创建到真实导出的最小闭环：

`创建项目 -> 对话采集 -> 生成规划 -> 生成 SVG 草稿 -> 预览 -> 调用 ppt-master 后处理 -> 导出 PPTX`

## 2. 当前 MVP 边界

### 2.1 已实现范围

1. 基于 Next.js 的中文前端骨架。
2. 基于 FastAPI 的后端接口骨架。
3. 本地项目存储与项目状态流转。
4. 结构化 brief 保存。
5. 简化版 outline、slide plan、design spec 生成。
6. SVG 草稿生成到项目目录。
7. 真实调用 `ppt-master` 的导出链路：
   `total_md_split.py -> finalize_svg.py -> svg_to_pptx.py -s final`
8. 本地模板目录 `assets/svg-templates`，用于同步可复用布局、图表与图标资源。

### 2.2 MVP 暂未覆盖

1. 文件上传与多格式导入页面。
2. 多轮流式对话与模型实时调用。
3. 设计规格独立编辑页。
4. 管理后台 / 任务监控页。
5. 页级局部重生成与审批状态管理。
6. 可编辑的模型供应商配置持久化。

这些能力在技术路线中保留扩展位，但不阻塞当前 MVP 交付。

## 3. 企业级项目结构

当前仓库按前后端分层组织：

```text
ppt-maker/
  apps/
    api/        # FastAPI 后端
    web/        # Next.js 前端
  assets/
    svg-templates/
  storage/
    projects/
    exports/
  infra/
    docs/
    scripts/
```

设计原则：

1. 前后端分离，避免单体页面式堆砌。
2. 业务逻辑收敛在后端服务层，不把流程散落在前端页面中。
3. `ppt-master` 通过适配层复用，避免把其完整目录复制到当前项目。
4. 模板资源、运行存储和源码目录分离。

## 4. 页面设计

### 4.1 首页

用途：

1. 展示平台定位。
2. 提供创建项目和进入模型配置的入口。
3. 说明当前 MVP 的工作流闭环。

### 4.2 模型配置页

用途：

1. 展示默认模型档案。
2. 展示不同阶段的模型映射关系。
3. 为后续可编辑配置中心预留接口边界。

### 4.3 项目列表页

用途：

1. 查看项目状态。
2. 从不同阶段继续项目。
3. 进入对话采集、规划、预览导出等页面。

### 4.4 创建项目页

用途：

1. 创建项目外壳。
2. 选择输出格式、模板策略、输入模式和模型档案。
3. 初始化本地项目目录。

### 4.5 对话采集页

用途：

1. 收集 audience、goal、scenario、style、页数等结构化信息。
2. 保存为统一 brief。
3. 作为后续规划生成的输入。

### 4.6 规划查看页

用途：

1. 根据 brief 生成 outline。
2. 生成 slide plan。
3. 生成简化 design spec。
4. 触发 SVG 草稿生产。

### 4.7 预览导出页

用途：

1. 读取 `svg_output` 中的 SVG 页面。
2. 进行草稿预览。
3. 触发真实 PPTX 导出。
4. 显示导出结果路径。

## 5. 后端模块设计

### 5.1 Project Service

职责：

1. 创建项目。
2. 管理项目状态。
3. 保存 brief。
4. 协调规划、SVG 生成与导出。

### 5.2 Planner Service

职责：

1. 从 brief 生成结构化大纲。
2. 生成每页 slide plan。
3. 输出 MVP 版本的 design spec。

### 5.3 SVG Service

职责：

1. 将规划结果渲染为 SVG 草稿。
2. 写入 `svg_output/`。
3. 生成 `notes/total.md`，供 `ppt-master` 后处理链路使用。

### 5.4 Project Repository

职责：

1. 基于本地 JSON 文件保存项目元数据。
2. 管理 `storage/projects/<project_id>/project.json`。

### 5.5 ppt-master Adapter

职责：

1. 调用 `project_manager.py init` 创建标准项目目录。
2. 同步 `layouts`、`charts`、`icons` 到本地模板目录。
3. 严格串行执行导出命令：
   1. `total_md_split.py`
   2. `finalize_svg.py`
   3. `svg_to_pptx.py -s final`

说明：

1. 当前项目只复用必要脚本入口。
2. 不复制 `ppt-master` 的完整仓库结构到当前仓库。
3. 严格遵守其串行后处理约束，不做批处理封装。

## 6. 核心数据流

两种输入模式最终都应汇聚到统一项目模型。当前 MVP 先实现意图驱动主路径，文件驱动作为下一阶段扩展。

统一中间资产：

1. `project.json`
2. `brief`
3. `outline`
4. `slides`
5. `design_spec`
6. `notes/total.md`
7. `svg_output/*.svg`
8. `svg_final/*.svg`
9. `storage/exports/*.pptx`

## 7. 运行方式

### 7.1 前端

```bash
npm run dev:web
```

### 7.2 后端

当前环境优先使用 `uv`：

```bash
npm run dev:api
```

或直接：

```bash
uv run --project apps/api uvicorn app.main:app --app-dir apps/api --reload --host 0.0.0.0 --port 8000
```

## 8. 下一阶段扩展

1. 接入文件上传与 `ppt-master` 多格式导入脚本。
2. 增加模型配置持久化与联通性测试。
3. 增加设计规格独立编辑页。
4. 增加页级修订与审批状态。
5. 提供导出文件下载接口与任务日志展示。
6. 提升 SVG 生成质量，使最终 PPT 更接近生产可用水位。

Responsibilities:

1. Generate page-level SVGs.
2. Apply layout mode decisions.
3. Write outputs to `svg_output/`.
4. Validate syntax and compatibility.

### 5.8 Review Service

Responsibilities:

1. Manage page status.
2. Accept revision requests in conversation form.
3. Trigger page-level regeneration.
4. Lock approved pages.

### 5.9 Export Service

Responsibilities:

1. Split notes using `total_md_split.py`.
2. Finalize SVGs using `finalize_svg.py`.
3. Export PPTX using `svg_to_pptx.py -s final`.

This service must strictly preserve `ppt-master` serial execution discipline.

## 6. Data Model and Project Directory

### 6.1 Disk Project Structure

Recommended structure:

```text
projects/
  <project_id>/
    project.json
    brief.json
    research.md
    outline.json
    slide_plan.json
    design_spec.md
    design_tokens.json
    sources/
    images/
    templates/
    notes/
      total.md
    svg_output/
    svg_final/
    exports/
    logs/
```

This keeps the website implementation compatible with the existing `ppt-master` conventions.

### 6.2 Core Database Tables

Suggested tables:

1. `users`
2. `projects`
3. `project_files`
4. `slides`
5. `jobs`
6. `chat_messages`
7. `model_provider_configs`
8. `model_capabilities`
9. `project_stage_runs`

### 6.3 Slide-Level Record Fields

Each slide should store at least:

1. Slide number.
2. Title.
3. Slide type.
4. Layout mode.
5. SVG path.
6. Final SVG path.
7. Notes path.
8. Approval status.
9. Last revision message.
10. Last model used.

## 7. State Machine

Each project should move through explicit states:

1. `created`
2. `ingesting`
3. `intent_collecting`
4. `researching`
5. `outlining`
6. `planning`
7. `design_spec_ready`
8. `assets_generating`
9. `svg_generating`
10. `reviewing`
11. `approved_for_export`
12. `post_processing`
13. `exporting`
14. `completed`
15. `failed`

Slide-level states should also exist:

1. `draft`
2. `generated`
3. `needs_revision`
4. `regenerating`
5. `approved`
6. `locked`

## 8. Planning Model: Use Linux.do Method Before Rendering

The Linux.do method should not be used only as a prompt style. It should become a real planning layer.

### 8.1 Brief Stage

Ask conversational questions to collect:

1. Audience.
2. Goal.
3. Use scenario.
4. Duration.
5. Depth.
6. Tone.
7. Must-cover topics.
8. Must-avoid topics.

### 8.2 Research Stage

If no file is uploaded, do web or knowledge-base research before writing the outline.

### 8.3 Outline Stage

Generate `outline.json` instead of only free-form markdown.

### 8.4 Slide Plan Stage

Generate `slide_plan.json` for every page. This is mandatory and should bridge content to layout.

Suggested slide plan fields:

1. `slide_id`
2. `slide_type`
3. `goal`
4. `key_message`
5. `layout_mode`
6. `cards`
7. `visual_priority`
8. `text_density`
9. `chart_type`
10. `image_need`
11. `speaker_intent`

This is the missing planning layer that prevents unstable SVG generation.

## 9. Design Specification Layer

`ppt-master` already defines a strong Strategist stage. Reuse it.

The system should generate:

1. `design_spec.md` for humans.
2. `design_tokens.json` for machines.

### 9.1 Eight Required Design Confirmations

1. Canvas format.
2. Page count range.
3. Target audience.
4. Style objective.
5. Color scheme.
6. Icon usage approach.
7. Typography plan.
8. Image usage approach.

### 9.2 Template Strategy

Support three modes:

1. `template_strict`: use fixed template skeletons heavily.
2. `template_light`: use template cover, chapter, footer, and key motifs only.
3. `template_free`: no fixed template, rely on design spec and layout planning.

This keeps the system compatible with both the Linux.do method and the `ppt-master` approach.

## 10. SVG Generation Strategy

### 10.1 Why SVG

SVG remains the best shared intermediate representation because:

1. It is text-based and LLM-friendly.
2. It provides strict coordinates and layout control.
3. It can be validated automatically.
4. It is compatible with downstream PPTX export.

### 10.2 Page Generation Flow

For each slide:

1. Read `slide_plan.json` entry.
2. Read `design_spec.md` and `design_tokens.json`.
3. Resolve page type and layout mode.
4. Generate PowerPoint-safe SVG into `svg_output/`.
5. Run syntax and compatibility checks.
6. Present to user for review.

### 10.3 Recommended Layout Modes

Suggested layout modes:

1. `hero`
2. `two_col_equal`
3. `two_col_asym`
4. `three_col`
5. `four_card`
6. `top_hero_grid`
7. `comparison_split`
8. `timeline`
9. `chart_focus`
10. `mixed_bento`

These modes capture the practical value of the Linux.do Bento-grid approach while keeping outputs structured.

## 11. SVG Technical Constraints and Edge Conditions

This section is non-negotiable. All SVG generation must obey PowerPoint compatibility constraints inherited from `ppt-master`.

### 11.1 Banned Features

Do not generate any of the following:

1. `clipPath`
2. `mask`
3. `<style>`
4. `class`
5. External CSS
6. `<foreignObject>`
7. `textPath`
8. `@font-face`
9. Any `<animate*>` element
10. `<script>`
11. `marker-end`
12. `<iframe>`
13. `<symbol> + <use>` combinations as a reusable symbol mechanism

Notes:

1. `id` references inside `<defs>` are allowed when used in legitimate supported ways, but do not build a symbol system based on `<symbol> + <use>`.
2. Avoid browser-only SVG conveniences. This project targets PowerPoint compatibility, not browser completeness.

### 11.2 Attribute and Style Restrictions

Avoid these patterns:

1. `rgba()` color values.
2. Group-level opacity on `<g opacity="...">`.
3. Direct opacity on `<image opacity="...">` if it will affect PPT import quality.
4. CSS classes and shared style blocks.

Use these safer replacements:

1. Replace `rgba()` with `fill-opacity` and `stroke-opacity`.
2. Replace group opacity with opacity on each child element.
3. Replace image opacity effects with overlay shapes if needed.
4. Replace `marker-end` arrows with explicit `<polygon>` arrow heads.

### 11.3 PowerPoint-Safe SVG Writing Rules

All generated SVG pages should follow these rules:

1. Use explicit inline attributes, not CSS classes.
2. Use a fixed `viewBox` matching the chosen canvas format.
3. Keep text structure simple.
4. Prefer basic shapes and paths.
5. Avoid advanced filters unless proven safe.
6. Avoid external asset references in final output.
7. Keep image dimensions explicit.
8. Keep text positions explicit.
9. Keep z-order simple and deterministic.
10. Avoid hidden overflow dependencies.

### 11.4 Text Handling Constraints

Because PowerPoint import is sensitive to text structure:

1. Keep `<text>` and `<tspan>` hierarchies shallow.
2. Expect `flatten_tspan.py` to simplify them in finalization.
3. Do not rely on advanced text flow features.
4. Do not use `textPath`.
5. Prefer explicit line positioning.

### 11.5 Image Handling Constraints

1. Uploaded images should be analyzed through scripts, not manually interpreted by the core flow.
2. Final SVG should embed image data safely through the post-processing stage.
3. Do not rely on external image URLs in final deliverables.
4. Use explicit width and height.
5. Avoid masking-based crops.
6. Prefer rectangular crops handled by the finalize pipeline.

### 11.6 Geometry and Shape Constraints

1. Prefer `path`, `rect`, `circle`, `line`, `polygon`, and `polyline`.
2. Rounded rectangles may be normalized by `svg_rect_to_path.py`.
3. Do not rely on unsupported markers or symbol reuse systems.
4. Keep stroke alignment visually simple.

### 11.7 Export Discipline Constraints

1. Never export PPTX directly from `svg_output/`.
2. Always export from `svg_final/`.
3. Never replace `finalize_svg.py` with plain file copy.
4. Never bundle post-processing commands into one shell command.
5. Always run the post-processing chain serially.

## 12. Quality Gates

There must be validation before the user reviews and before PPTX export.

### 12.1 Syntax Validation

Check:

1. XML parse success.
2. Valid root SVG element.
3. Correct `viewBox`.
4. Required dimensions present.

### 12.2 Compatibility Validation

Check:

1. No banned elements.
2. No banned attributes.
3. No unsupported CSS.
4. No external asset dependencies in final output.

This should reuse or mirror `svg_quality_checker.py` logic.

### 12.3 Visual Validation

Check:

1. Text overflow.
2. Overlapping elements.
3. Tiny unreadable text.
4. Insufficient margins.
5. Low contrast.
6. Misaligned columns or cards.

## 13. Review and Revision Loop

The user must be able to continue the conversation after seeing SVG drafts.

Revision loop:

1. Generate SVG draft.
2. Show SVG page in preview page.
3. User sends revision request in conversation.
4. System maps the request to one or more slide plan or design spec changes.
5. Regenerate only affected pages.
6. Preserve approved pages.
7. Repeat until approval.

This means conversation is needed both before and after rendering.

## 14. Export Pipeline

After all pages are approved, export strictly according to `ppt-master`.

Required serial steps:

1. Run `total_md_split.py <project_path>`.
2. Confirm success.
3. Run `finalize_svg.py <project_path>`.
4. Confirm success.
5. Run `svg_to_pptx.py <project_path> -s final`.

Important restrictions:

1. Do not batch these commands.
2. Do not add unsupported flags like `--only`.
3. If optimization is later added, rerun the full post-processing chain.

## 15. Model Gateway Design

Do not directly couple business code to one provider SDK.

### 15.1 Unified Model Request Shape

Every model call should accept:

1. Provider.
2. Base URL.
3. API key.
4. Model name.
5. Messages.
6. Response format.
7. Temperature.
8. Max tokens.
9. Timeout.

### 15.2 Capability Matrix

For each configured model, track:

1. Structured output support.
2. Vision support.
3. Tool call support.
4. Context window.
5. Cost class.
6. Recommended workflow stages.

### 15.3 Suggested Stage-to-Model Mapping

1. Conversation and brief extraction: fast, lower-cost reasoning model.
2. Research summarization: long-context model.
3. Outline and slide planning: stable structured-output model.
4. Design spec generation: stable planning model.
5. SVG generation: strong code or XML generation model.
6. Visual review: vision-capable model if available.

## 16. Recommended Tech Stack

### 16.1 Frontend

Suggested choice:

1. Next.js
2. TypeScript
3. Tailwind CSS
4. Zustand
5. React Query
6. Monaco Editor for raw spec/SVG edits

### 16.2 Backend

Suggested choice:

1. FastAPI
2. Python 3.11+
3. Pydantic
4. Celery or Dramatiq
5. Redis
6. PostgreSQL
7. S3-compatible storage or local project disk

Reasoning:

1. `ppt-master` is Python-based.
2. File conversion and SVG export are better reused from Python.
3. Async tasks are required for long-running jobs.

## 17. API Surface Suggestion

Suggested high-level APIs:

1. `POST /api/projects`
2. `GET /api/projects/:id`
3. `POST /api/projects/:id/files`
4. `POST /api/projects/:id/chat`
5. `POST /api/projects/:id/research`
6. `POST /api/projects/:id/outline`
7. `POST /api/projects/:id/slide-plan`
8. `POST /api/projects/:id/design-spec`
9. `POST /api/projects/:id/svg/generate`
10. `POST /api/projects/:id/svg/:slideId/regenerate`
11. `POST /api/projects/:id/slides/:slideId/approve`
12. `POST /api/projects/:id/approve-all`
13. `POST /api/projects/:id/export`
14. `GET /api/projects/:id/download`
15. `POST /api/model-providers`
16. `GET /api/model-providers`
17. `POST /api/model-providers/:id/test`

## 18. MVP Scope

Recommended first release scope:

1. Multi-page frontend.
2. File mode and no-file mode.
3. Model configuration page.
4. Conversation page for intent collection.
5. Outline and slide plan generation.
6. Design spec generation.
7. SVG preview and page-level revision.
8. Strict final export via `ppt-master`.

Not required for v1:

1. Team collaboration.
2. Fine-grained RBAC.
3. Full drag-and-drop slide editor.
4. Large template marketplace.
5. Automatic chart intelligence beyond basic planning.

## 19. Main Risks and Controls

### 19.1 Risk: Unstable model output

Control:

1. Split generation by stage.
2. Use structured outputs.
3. Add slide planning layer.
4. Regenerate by page, not always by project.

### 19.2 Risk: PPT incompatibility

Control:

1. Obey banned SVG feature list.
2. Validate before export.
3. Always run `finalize_svg.py`.

### 19.3 Risk: UI becomes too crowded

Control:

1. Separate pages by function.
2. Keep conversation isolated from preview when needed.
3. Do not compress planning, review, and settings into one screen.

### 19.4 Risk: Two flows diverge over time

Control:

1. Force both entry modes into one shared intermediate representation.
2. Reuse the same SVG and export services.

## 20. Final Architecture Summary

The correct product definition is:

A multi-page website that combines:

1. Linux.do style intent collection, research, and planning,
2. `ppt-master` style project structure, SVG constraints, post-processing, and PPTX export,
3. A unified SVG-first rendering architecture,
4. A user approval loop before final delivery,
5. A configurable multi-provider model gateway.

The final execution path should be:

1. File uploaded: `ingest -> brief -> strategist -> slide plan -> svg -> review -> finalize -> pptx`
2. No file uploaded: `conversation -> research -> outline -> slide plan -> strategist -> svg -> review -> finalize -> pptx`

The most important engineering rule is that SVG generation must be planned, reviewable, and PowerPoint-safe.
