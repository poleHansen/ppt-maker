# PPT Maker

PPT Maker 是一个中文多页面 PPT 生成平台 MVP，目标是打通从需求采集、规划生成、SVG 草稿预览到真实 PPTX 导出的最小闭环。

## 技术栈

1. 前端：Next.js
2. 后端：FastAPI
3. 运行方式：本地文件存储 + `uv` Python 环境
4. 导出能力：按需复用 `D:/code/ppt-master` 的项目初始化与 PPTX 导出脚本

## 当前能力

1. 创建项目
2. 采集结构化 brief
3. 生成大纲、页级规划与简化设计说明
4. 生成 SVG 草稿
5. 预览 SVG
6. 触发真实 PPTX 导出

## 项目结构

```text
ppt-maker/
	apps/
		api/
		web/
	assets/
		svg-templates/
	storage/
		projects/
		exports/
```

## 本地启动

在仓库根目录执行：

```bash
npm run dev:web
npm run dev:api
```

前端默认地址：`http://localhost:3000`

后端默认地址：`http://localhost:8000`

## 相关文档

1. 技术路线：`PPT_WEBSITE_TECH_ROUTE.md`
2. 前端说明：`apps/web/README.md`
