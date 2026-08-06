# MemePhoto AI 第1天一键验收工具

这是一个“**一个统一入口 + 三个独立模块 + 一份统一报告**”的 Windows 工具包。

## 目录结构

```text
MemePhotoAI-Day1-Validation/
├── 运行第1天验收.bat
├── run-day1-check.ps1
├── 安装运行环境.bat
├── config.json
├── modules/
│   ├── 01-product-check.ps1
│   ├── 02-seo-check.ps1
│   └── 03-ga4-check.ps1
├── scripts/
├── assets/
└── artifacts/
```

## 第一次使用

1. 解压 ZIP。
2. 双击 `运行第1天验收.bat`。
3. 首次运行会自动安装依赖和 Playwright Chromium。
4. 脚本依次执行产品、SEO、GA4 三个模块。
5. 结束后自动打开 `artifacts/时间/REPORT.html`。

也可以先单独双击：

```text
安装运行环境.bat
```

## 可以自动完成

### 产品与支付模块

- 桌面端打开首页
- 移动端模拟打开首页
- 上传测试图片
- 填写 Top Text 和 Bottom Text
- 尝试添加 Emoji
- 尝试添加 Logo/图片贴纸
- 尝试切换 4:5 比例
- 下载 PNG
- 保存桌面和移动端截图
- 收集控制台错误和网络失败
- 可选：使用测试 License 激活并重新下载

### SEO / GSC 模块

- 检查公开页面状态码
- 检查 Title、Description、Canonical
- 检查 H1 数量
- 检查 Open Graph 和 Twitter Card
- 检查 `/success`、`/cancel` 是否 `noindex`
- 检查 `robots.txt`
- 检查 `sitemap.xml`
- 检查 sitemap URL 状态
- 检查 HTTP、www 重定向
- 检查真实 404
- 检查首页内部链接
- 可选：通过 Search Console API 提交并读取 sitemap 状态

### GA4 模块

- 检测 G- 开头的 Measurement ID
- 检查 Google Tag 请求
- 检查 page_view collect 请求
- 尝试发送 `day1_validation` 测试事件
- 保存 Analytics 请求
- 可选：通过 GA4 Data API 查询实时报告

## 默认保留人工操作

- 真实 iPhone/Android 抽测
- 免费版水印视觉确认
- Creator 版去水印视觉确认
- Creem 生产环境真实付款
- Creem Test Mode 支付填写
- GSC 首次域名 DNS 验证
- GSC 首页“请求编入索引”

脚本不会把这些项目伪装成自动通过。

## 可选环境变量

### 测试 License

只在你有专门的测试 License 时设置：

```powershell
setx MEMEPHOTO_TEST_LICENSE_KEY "你的测试License"
```

不要使用用户真实 License，不要把值写进 `config.json`。

### Google API

高级模式需要服务账号 JSON：

```powershell
setx GOOGLE_APPLICATION_CREDENTIALS "<SERVICE_ACCOUNT_JSON_PATH>"
setx GA4_PROPERTY_ID "你的GA4数字Property ID"
```

然后编辑 `config.json`：

```json
"gsc": {
  "apiEnabled": true,
  "siteUrl": "sc-domain:memephotoai.com",
  "submitSitemap": true
},
"ga4": {
  "realtimeApiEnabled": true
}
```

服务账号需要被添加到对应 Search Console 资源和 GA4 属性。JSON 凭据不得放入项目、Git 或本工具目录。

## 单独运行模块

```powershell
.\run-day1-check.ps1 -Module Product
.\run-day1-check.ps1 -Module SEO
.\run-day1-check.ps1 -Module GA4
.\run-day1-check.ps1 -Module All
```

也可以直接双击：

- `只检查产品与支付.bat`
- `只检查SEO-GSC.bat`
- `只检查GA4.bat`

## 安全边界

- 默认不自动打开或填写外部支付。
- 默认不修改 DNS、GSC、GA4 或线上代码。
- 默认只读取公开网站和执行浏览器操作。
- 不会把 API Key、License Key、Google 凭据或银行卡信息写入报告。
- `config.json` 中只能放非敏感配置。

## 把它放进项目

推荐目标路径：

```text
<PROJECT_ROOT>/scripts/day1-validation
```

复制前先确认项目中没有同名目录。第一次运行建议让 Codex 在“不 commit、不 push”的前提下完成。

## Project Integration Safety Notes

This folder is an independent Day 1 validation toolkit for MemePhoto AI. It can run product checks, SEO/GSC checks, GA4 checks, and generate local reports without changing the main Next.js application.

Before running the toolkit, copy `config.example.json` to a local `config.json` and review the target domain manually. The local `config.json` is intentionally ignored by Git and must not be committed.

Default checks should remain read-only. Keep GSC sitemap submission disabled unless a human intentionally enables it for a verified production property. Keep real License activation disabled unless a dedicated non-user test license is provided through a local environment variable for a manual test run.

Generated reports, screenshots, logs, browser data, service-account JSON files, cookies, API keys, License keys, and other credentials must never be committed. The `artifacts/` directory is for generated output only; keep `artifacts/.gitkeep` so the folder exists.

The toolkit uses its own scripts and configuration. It should not modify `src/`, `public/`, payment logic, License APIs, Creem configuration, Vercel configuration, or `.env.local`.
