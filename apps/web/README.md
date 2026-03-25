# PPT Maker Web

`apps/web` 是 PPT Maker MVP 的前端应用，基于 Next.js App Router 构建，当前提供中文多页面工作流界面。

## 当前页面

1. 首页
2. 模型配置页
3. 项目列表页
4. 创建项目页
5. 对话采集页
6. 规划查看页
7. 预览导出页

## 本地运行

在仓库根目录执行：

```bash
npm run dev:web
```

默认访问地址：`http://localhost:3000`

如果需要单独在当前目录运行，也可以执行：

```bash
npm run dev
```

## 依赖后端

前端默认通过 `NEXT_PUBLIC_API_BASE_URL` 访问后端接口；未配置时，默认指向：

```text
http://localhost:8000/api
```

后端建议在仓库根目录执行：

```bash
npm run dev:api
```

## 说明

1. 当前 UI 全部使用中文。
2. MVP 先打通从项目创建到真实 PPTX 导出的主链路。
3. 文件导入、设计规格编辑、任务监控等能力在下一阶段补齐。
