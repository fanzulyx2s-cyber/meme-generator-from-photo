# MemePhoto AI SEO 改造版说明

本压缩包是在用户上传源码的基础上直接修改得到的 SEO 改造版。

## 已完成

- 统一生产域名与 Metadata 配置
- 独立 Title、Description、canonical
- Open Graph 与 Twitter Card
- `robots.txt` 与 `sitemap.xml`
- `/success`、`/cancel` noindex
- 自定义 404
- 首页关键词方向与内容结构优化
- 独立的使用场景文案和内部链接
- WebApplication、FAQ、Breadcrumb、HowTo 结构化数据
- 三个首批 SEO 页面
- 手动本地编辑与可选 AI Caption 的隐私说明对齐

详细内容见：

- `docs/website-audit/SEO_IMPLEMENTATION_SUMMARY.md`
- `docs/website-audit/SEO_TASK_LIST.md`

## 使用前注意

这个交付包已主动排除：

- `.env.local`
- `.git`
- `.next`
- `node_modules`
- 本地开发日志

因此不会覆盖你的本地密钥和 Git 历史，也不会携带旧缓存。把源码合并回正式项目后，继续使用正式项目原有的 `.env.local`。

## 上线前必须在 Windows 项目中执行

```text
npm.cmd install
npm.cmd run test:ai
npm.cmd run lint
npx.cmd tsc --noEmit --incremental false
npm.cmd run build
```

本次环境已经完成 TypeScript 和 ESLint 验证。AI 测试与 Next.js build 需要在 Windows 原项目中执行，因为用户上传的 `node_modules` 是 Windows 原生依赖，无法在当前 Linux 验证环境完整运行。
