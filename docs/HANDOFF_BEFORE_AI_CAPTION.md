# MemePhoto AI 项目交接单：AI Caption 开发前状态

> 交接目的：给下一次 Codex 会话或下一位开发者继续开发“AI 看图生成英文 Meme 文案”使用。
>
> 本文只记录当前真实代码状态和后续建议，不代表已经实现 AI Caption 或 AI 生图。

## 1. 项目概览

- 项目名称：MemePhoto AI
- 本地工作目录：当前 Git 仓库根目录（`<PROJECT_ROOT>`）
- 线上域名：`https://memephotoai.com`
- 当前分支：`main`
- 当前 HEAD：`061d8d3 Align privacy and refund policies with live payments`
- 技术栈：Next.js App Router、React、TypeScript、Tailwind CSS v4、Canvas、ESLint 9
- 包管理器：npm，仓库包含 `package-lock.json`
- 当前产品定位：浏览器端照片 Meme 编辑器
- 当前 AI 接入状态：未发现 AI Caption、AI 图片理解、AI 生图、Gemini、OpenAI 或 Qwen 运行时代码
- 重要说明：品牌名包含 AI，但当前正式产品仍主要是浏览器端手动照片 Meme 编辑器，不应声称已上线 AI Caption 或 AI 生图。

当前核心用户流程：

1. 用户打开首页。
2. 上传本地照片。
3. 手动输入 Top Text / Bottom Text，或选择 Caption preset。
4. 添加 emoji、logo 或自定义图片 sticker。
5. 选择 1:1、4:5 或 9:16。
6. 在 Canvas 中预览、拖动、缩放、旋转元素。
7. Free Demo 预览和 PNG 导出带 `memephotoai.com` 水印。
8. Creator Plan 用户通过 Creem 购买后输入 License Key，激活当前浏览器。
9. Creator Plan 激活后预览和 PNG 导出无水印。
10. 用户可停用当前浏览器，释放 Creem 激活名额。

## 2. 当前产品功能

以下状态基于当前代码检查：

| 功能 | 状态 | 代码依据 / 备注 |
|---|---|---|
| 上传 JPG | 已完成 | 文件选择器 `accept="image/png,image/jpeg,image/webp"` |
| 上传 PNG | 已完成 | 同上 |
| 上传 WEBP | 已完成 | 同上 |
| 图片大小限制 | 未发现 | 当前仅检查 `file.type.startsWith("image/")`，未发现显式大小限制 |
| Top Text | 已完成 | `topText` 状态、Canvas 文本绘制、工具栏控制 |
| Bottom Text | 已完成 | `bottomText` 状态、Canvas 文本绘制、工具栏控制 |
| Caption Presets | 已完成 | 当前 30 个 preset，Free 和 Creator 均可使用 |
| Emoji | 已完成 | 当前 36 个 emoji sticker option |
| Logo | 已完成 | 通过 image sticker 上传入口实现 |
| 自定义图片贴纸 | 已完成 | `handleImageStickerUpload` 使用 `URL.createObjectURL` |
| 元素拖拽 | 已完成 | Canvas pointer drag 逻辑 |
| 元素缩放 | 已完成 | text / sticker resize 逻辑 |
| 元素旋转 | 已完成 | text / sticker rotate 逻辑 |
| 元素删除 | 已完成 | sticker delete，未发现删除 Top/Bottom text 层本身 |
| Frame | 已完成 | Frame On / Frame Off |
| 1:1 | 已完成 | `square` 1000x1000 |
| 4:5 | 已完成 | `portrait` 1000x1250 |
| 9:16 | 已完成 | `story` 1000x1778 |
| PNG 导出 | 已完成 | `canvas.toDataURL("image/png")` |
| 免费版水印 | 已完成 | `!isCreator` 时绘制摄影签名式水印 |
| Creator 去水印 | 已完成 | `isCreator` 时不绘制水印 |
| License 激活 | 已完成 | `/api/license/activate` |
| License 验证 | 已完成 | `/api/license/validate` |
| License 停用 | 已完成 | `/api/license/deactivate` |
| 最多激活 3 个浏览器 | 已完成 / 需 Creem 配置配合 | 文案和 UI 显示为最多 3 个浏览器，实际限制依赖 Creem 产品/License 配置 |
| Success 页面 | 已完成 | `/success` |
| Cancel 页面 | 已完成 | `/cancel` |
| Pricing 页面 | 已完成 | `/pricing` |
| Contact 页面 | 已完成 | `/contact` |
| Privacy 页面 | 已完成 | `/privacy` |
| Refund 页面 | 已完成 | `/refund` |
| Terms 页面 | 已完成 | `/terms` |
| Acceptable Use 页面 | 已完成 | `/acceptable-use` |

## 3. 当前页面与路由

页面路由：

| 路由 | 用途 | 主要组件 | 公开 | 适合收录 | noindex | 购买入口 | 环境变量 | 支付 / License |
|---|---|---|---|---|---|---|---|---|
| `/` | 首页和编辑器 | `SiteHeader`、`MemeGenerator`、`CreatorLicensePanel compact`、`SiteFooter` | 是 | 是 | 未发现 | 有 | `NEXT_PUBLIC_CREEM_CHECKOUT_URL` | License 面板 / 购买入口 |
| `/pricing` | 价格、购买、License 激活 | `SimplePage`、`CreatorCheckoutButton`、`CreatorLicensePanel full` | 是 | 是 | 未发现 | 有 | `NEXT_PUBLIC_CREEM_CHECKOUT_URL` | 支付和 License |
| `/contact` | 支持联系 | `SimplePage` | 是 | 是 | 未发现 | 无 | 无 | 支持付款、退款、License 问题 |
| `/privacy` | 隐私政策 | `SimplePage` | 是 | 是 | 未发现 | 无 | 无 | 描述 Creem 和 License 数据 |
| `/refund` | 退款政策 | `SimplePage` | 是 | 是 | 未发现 | 无 | 无 | 描述 Creem 退款流程 |
| `/terms` | 服务条款 | `SimplePage` | 是 | 是 | 未发现 | 无 | 无 | 描述 Creator、License、Creem |
| `/acceptable-use` | 可接受使用政策 | `SimplePage` | 是 | 是 | 未发现 | 无 | 无 | 内容限制政策 |
| `/success` | 支付成功后的用户指引 | `SimplePage` | 是 | 建议 noindex，但代码中未发现 | 未发现 | 无 | 无 | 指引查收 License Key 并激活 |
| `/cancel` | 支付取消后的用户指引 | `SimplePage` | 是 | 建议 noindex，但代码中未发现 | 未发现 | 有返回 Pricing | 无 | 说明付款未完成 |

API 路由：

| API | 分类 | 用途 |
|---|---|---|
| `/api/license/activate` | License | 接收 License Key 和 browser instance name，服务端调用 Creem activate |
| `/api/license/validate` | License | 接收 License Key 和 instance id，服务端调用 Creem validate |
| `/api/license/deactivate` | License | 接收 License Key 和 instance id，服务端调用 Creem deactivate |

未发现：

- 支付 webhook 路由
- Success / Cancel return URL 在代码中配置
- AI API 路由
- robots.ts
- sitemap.ts
- `/make-a-meme-from-a-photo`
- 教程型 SEO 页面

## 4. 关键代码文件

| 文件 | 主要职责 | 关系 | 下一阶段修改风险 |
|---|---|---|---|
| `src/app/page.tsx` | 首页、Hero、FAQ、Pricing 摘要、插入编辑器 | 使用 `MemeGenerator`、`CreatorLicensePanel`、`SiteFooter` | 不要把首页改成已上线 AI；AI Caption 上线前只可描述为计划或隐藏功能 |
| `src/components/meme-generator.tsx` | 核心编辑器、上传、Canvas 绘制、文本、贴纸、比例、下载、水印 | 使用 `useCreatorLicense` 判断是否绘制水印 | AI Caption 应复用现有 Top/Bottom Text 状态，不要新建第二套编辑器状态 |
| `src/hooks/use-creator-license.ts` | License 本地状态、localStorage、激活、验证、停用、同页面同步事件 | 调用 `/api/license/*`，被编辑器和 License 面板复用 | 不要改变 storage key 或事件名，避免状态不同步 |
| `src/components/creator-license-panel.tsx` | full / compact License 面板、购买按钮、激活、停用 UI | 复用 hook，读取 `NEXT_PUBLIC_CREEM_CHECKOUT_URL` | 不要复制第二套 License 逻辑 |
| `src/components/creator-checkout-button.tsx` | Pricing 卡片购买按钮 | 读取 `NEXT_PUBLIC_CREEM_CHECKOUT_URL` 并跳转 | 不要硬编码 Checkout URL |
| `src/lib/creem-license.ts` | 服务端 Creem License 配置读取、校验、调用、响应清洗、激活回滚 | 被 3 个 License API 使用 | API Key 必须保持服务端；不要泄露上游原始响应 |
| `src/app/api/license/activate/route.ts` | License 激活接口 | 调用 `callCreemLicenseApi` | 不要在客户端暴露 License API Key |
| `src/app/api/license/validate/route.ts` | License 验证接口 | 调用 `callCreemLicenseApi` | validate 要继续校验 product |
| `src/app/api/license/deactivate/route.ts` | License 停用接口 | 调用 `callCreemLicenseApi` | 409 视为已释放的逻辑在 lib 中 |
| `src/app/pricing/page.tsx` | 价格页、Free Demo / Creator Plan 文案、FAQ | 使用 `CreatorCheckoutButton`、`CreatorLicensePanel` | 不要承诺未实现权益 |
| `src/app/success/page.tsx` | 支付成功页 | 引导用户查收 Creem purchase email 和激活 | 不要承诺自动开通账户 |
| `src/app/cancel/page.tsx` | 支付取消页 | 引导返回 Pricing | 不要写成已购买 |
| `src/app/contact/page.tsx` | 联系页面和 metadata | 官方邮箱 | 当前 Git 假 M，不要随意 restore |
| `src/app/privacy/page.tsx` | 隐私政策 | 描述本地图片处理、Creem、License、支持沟通 | AI Caption 上线前必须改写图片处理披露 |
| `src/app/refund/page.tsx` | 退款政策 | 14 天退款申请窗口、Creem 处理 | 不要增加与 Terms 冲突条件 |
| `src/app/terms/page.tsx` | 服务条款 | $9 one-time、License、3 browsers、Acceptable Use | AI 功能计费前必须避免“无限 AI”承诺 |
| `src/app/acceptable-use/page.tsx` | 内容使用限制 | Footer 可达 | 保持禁止成人、NSFW、未成年人性内容等条款 |
| `src/components/site-footer.tsx` | 统一 Footer 和政策链接 | 所有 `SimplePage` 和首页使用 | 不要删除 Acceptable Use、Contact 或 mailto |
| `src/components/site-header.tsx` | 顶部导航 | 首页和 `SimplePage` 使用 | 不要在未上线前添加 AI 导航承诺 |
| `src/components/simple-page.tsx` | 政策/静态页统一布局 | 引入 Header/Footer | 改布局会影响所有政策页 |
| `src/app/layout.tsx` | 全局 metadata、HTML body | 站点标题描述 | 当前描述没有 AI 自动生成承诺 |
| `src/app/globals.css` | Tailwind 和全局字体/颜色 | 全站样式 | 不要无关重构 |
| `public/assets/examples/couple-demo.png` | 首页示例图 | Next Image 使用 | 不要替换为版权不明素材 |
| `eslint.config.mjs` | 根 ESLint 配置 | 当前已忽略 `scripts/day1-validation/**` | 当前修改未提交；不要继续调整除非明确要求 |

特别提醒：AI Caption 应写入现有 `topText` / `bottomText` 状态和 Canvas 渲染流程，不应创建第二套 Caption 编辑器、第二张 Canvas 或第二套图片上传状态。

## 5. Git 和工作区状态

开始前已确认：

```text
branch: main
HEAD: 061d8d3 Align privacy and refund policies with live payments
status:
 M eslint.config.mjs
 M src/app/contact/page.tsx
?? scripts/
```

没有 staged 修改。

已提交状态与当前工作区要分开理解：

- 已提交到 `origin/main` 的最新代码停在 `061d8d3`。
- 当前工作区还包含 Day1 工具整理相关未提交内容。
- 本交接单本身是本轮新增文档，尚未 stage / commit。

### `eslint.config.mjs`

- 修改原因：隔离 Day1 验收工具，防止根 ESLint 扫描 `scripts/day1-validation/**`。
- 当前只忽略 `scripts/day1-validation/**`，没有忽略整个 `scripts`。
- `src` 业务代码仍正常受 ESLint 检查。
- 当前未提交。

### `src/app/contact/page.tsx`

虽然被 Git 标记为 `M`，但已确认：

- `git diff -- src/app/contact/page.tsx` 为空。
- index hash 与 worktree hash 一致。
- hash：`60b3fd7a98727dba53350bafd87a2797d647fdd0`
- index EOL 为 LF，worktree EOL 为 CRLF。
- 这是换行符、文件 stat 或 Git 索引元数据造成的假修改。
- 不存在业务内容差异。
- 不存在联系方式差异。
- 不需要 restore、格式化或重写。
- 后续开发者不要为了清理状态擅自覆盖该文件。

### `scripts/`

- 包含整理后的 `scripts/day1-validation`。
- 当前仍是未跟踪目录。
- 是否提交该工具需要单独决定。
- 生成报告、本地配置、依赖和凭据应保持忽略。

## 6. 联系邮箱状态

当前唯一官方客服邮箱：

```text
support@memephotoai.com
```

公开页面和 Footer 对应链接：

```text
mailto:support@memephotoai.com
```

已确认正确位置包括：

- Contact
- Footer
- Pricing
- Privacy
- Refund
- Terms
- Acceptable Use
- Success
- 首页 FAQ

当前未发现旧客服邮箱、个人邮箱、测试邮箱或邮箱文字与 mailto 不一致的问题。

注意：Creem 后台客服邮箱无法从仓库代码确认，需要人工登录 Creem 后台检查。

## 7. Creem、支付和 License

当前真实状态：

- Creator Plan：`$9 one-time`
- 付款方式：一次性付款，不是订阅
- License 到期：当前文案和 UI 表示 License 不设置到期时间
- 最大激活：最多 3 个浏览器，实际限制需要 Creem License 产品配置配合
- Free Demo：实时预览和 PNG 导出带 MemePhoto AI 水印
- Creator Plan：激活浏览器后实时预览和 PNG 导出无水印
- License Key 获取方式：通过 Creem purchase email 发送

Checkout：

- `src/components/creator-checkout-button.tsx` 读取 `NEXT_PUBLIC_CREEM_CHECKOUT_URL`
- `src/components/creator-license-panel.tsx` 的 Buy Creator Plan 也读取 `NEXT_PUBLIC_CREEM_CHECKOUT_URL`
- 环境变量为空时提示 `Payment link is not available yet.`
- 代码中未硬编码真实 Checkout URL

License 本地数据：

- `memephotoai_license_key`
- `memephotoai_license_instance_id`
- `memephotoai_license_instance_name`
- 同页面同步事件：`memephotoai-license-changed`

License API：

- Activate：客户端传 `licenseKey` 和 `instanceName` 到 `/api/license/activate`
- Validate：客户端传 `licenseKey` 和 `instanceId` 到 `/api/license/validate`
- Deactivate：客户端传 `licenseKey` 和 `instanceId` 到 `/api/license/deactivate`

Creem 服务端调用：

- API Key 仅在服务端 `src/lib/creem-license.ts` 读取
- Base URL 只允许：
  - `https://test-api.creem.io/v1`
  - `https://api.creem.io/v1`
- Product ID 必须以 `prod_` 开头并通过格式校验
- License API 请求设置约 10 秒超时
- Deactivate 409 被视为实例已释放，可返回成功
- Activate 成功创建 instance 后如果本地解析失败，会尝试 deactivate 回滚

本文不得也不会记录：

- 真实 Product ID
- API Key
- Webhook Secret
- License Key
- 真实 Checkout URL
- 任何真实环境变量值

未发现：

- Creem webhook 代码
- 站内订单数据库
- 用户账户系统
- Success / Cancel URL 在仓库中硬编码配置

## 8. 环境变量

当前代码中使用到的环境变量名：

| 名称 | 用途 | 端 | 必须 | 缺失行为 | 敏感 |
|---|---|---|---|---|---|
| `NEXT_PUBLIC_CREEM_CHECKOUT_URL` | Creator Plan Checkout 跳转 | 客户端 | 是，若要购买可用 | 按钮提示付款链接不可用 | 否，但不应随意泄露完整生产链接 |
| `CREEM_API_KEY` | 服务端调用 Creem License API | 服务端 | 是，若要 License 可用 | 返回 License 服务未配置 | 是 |
| `CREEM_API_BASE_URL` | Creem License API base URL | 服务端 | 是 | 返回 License 服务未配置或配置无效 | 否，但不应混用测试/生产 |
| `CREEM_LICENSE_PRODUCT_ID` | 校验 License 是否属于 Creator Plan | 服务端 | 是 | 返回 License 产品配置无效或不匹配 | 视为敏感配置，不输出值 |
| `MEMEPHOTO_TEST_LICENSE_KEY` | Day1 Product 验收工具可选测试 License | 本地工具环境 | 否 | 工具跳过测试 License 激活 | 是 |
| `GOOGLE_APPLICATION_CREDENTIALS` | Day1 SEO/GSC 或 GA4 API 可选凭据路径 | 本地工具环境 | 否 | 工具跳过 API 读取/提交 | 是 |
| `GA4_PROPERTY_ID` | Day1 GA4 realtime API 可选属性 ID | 本地工具环境 | 否 | 工具跳过 GA4 API 读取 | 可能敏感 |

安全结论：

- `.env.local` 不允许提交。
- `.env.local` 已被 `.gitignore` 忽略。
- `.env.local` 未被 Git 跟踪。
- 服务端 Secret 不应改成 `NEXT_PUBLIC_`。
- AI Caption 后续也不得使用 `NEXT_PUBLIC_GEMINI_API_KEY`。

## 9. 当前隐私和法律状态

当前政策页面与手动编辑模式基本一致：

- Privacy：描述 Local Photo Processing、Account-Free Use、Creator License Data、Payments and Creem、Support communications。
- Refund：描述 Creator Plan 为 `$9 one-time`，退款申请窗口为购买后 14 天，退款通过 Creem 处理。
- Terms：描述 Local processing、Free Demo and Creator Plan、Payments、License keys and browser activation、Refunds、Acceptable Use、IP、Disclaimer、Limitation of liability、Suspension。
- Acceptable Use：明确禁止 sexually explicit、pornographic、adult、NSFW、sexual content involving minors、non-consensual intimate content、violence、hate speech、harassment、fraud、impersonation、misleading content、copyright/trademark/privacy infringement、illegal activities。

当前手动编辑模式：

- 图片主要在浏览器本地通过 Canvas 处理。
- 当前无需账户。
- 当前未发现 AI 图片理解服务调用。
- 当前不应把普通手动上传图片发送给服务器。

AI Caption 上线前必须拆分隐私表述：

### Manual Editing

- 继续本地处理。
- 不发送给 AI。

### AI Caption Mode

- 用户主动点击 Generate AI Captions。
- 明确提示图片会被发送给 AI 服务商分析。
- 用户确认后才发送图片。
- 需要披露服务商、保留策略、删除策略、安全限制。
- 需要更新首页提示、上传区提示、Privacy、Terms、Acceptable Use、Pricing、FAQ。

当前不要修改这些页面；本文只记录后续要求。

## 10. 当前 SEO 状态

当前全局 metadata：

- Site title：`MemePhoto AI - Browser-Based Photo Meme Maker`
- Site description：`Create memes from your photos in your browser. Add captions, emojis, and image stickers, choose a format, and export a PNG.`

页面 metadata：

- `/contact`：`Contact | MemePhoto AI`
- `/privacy`：`Privacy Policy | MemePhoto AI`
- `/refund`：`Refund Policy | MemePhoto AI`
- 其他页面多使用全局 metadata 或页面内标题。

当前代码状态：

- `metadataBase`：未发现
- canonical：未发现
- Open Graph：未发现
- Twitter Card：未发现
- robots.ts：未发现
- sitemap.ts：未发现
- favicon：`src/app/favicon.ico` 存在
- success noindex：未发现
- cancel noindex：未发现
- 教程页面：未发现
- `/make-a-meme-from-a-photo`：未发现
- 虚假 AI 自动生成描述：在 `src` 中未发现 `AI-powered`、`AI Meme Generator from Photo`、`AI image generator` 等公开承诺
- 首页 FAQ 明确写明当前不调用 AI API 做图片生成

当前首页主要搜索意图更接近：

```text
browser-based photo meme maker
photo to meme editor
make a meme from a photo
```

在 AI Caption 真正上线前，不应把首页完全改写为已经具备 AI 自动生成文案或 AI 生图。AI Caption 上线并测试后，再考虑强化：

```text
AI Meme Generator From Photo
```

## 11. Day1 验收工具

目录：

```text
scripts/day1-validation
```

模块：

- Product
- SEO / GSC
- GA4
- Report Builder

当前状态：

- 工具此前未进入 Git 历史。
- 当前仍为未跟踪目录。
- 已安装依赖，但 `node_modules` 被工具 `.gitignore` 忽略。
- 已有生成报告，但 `artifacts/*` 被忽略，保留 `artifacts/.gitkeep`。
- `config.json` 被忽略，不应提交。
- `config.example.json` 已脱敏。
- README 已补充安全使用规则。
- 工具有独立 `eslint.config.mjs` 和 `npm run lint`。

默认安全配置：

- GSC API 默认关闭。
- sitemap submit 默认关闭。
- GA4 realtime API 默认关闭。
- 测试 License 激活只有显式配置测试环境变量时才会执行。

不应提交：

- `config.json`
- `node_modules`
- artifacts 真实报告
- screenshots
- logs
- cookies
- service account JSON
- `.env` / `.env.*`
- 任何凭据文件

可以考虑提交：

- 工具源码
- README
- `package.json`
- `package-lock.json`
- `.gitignore`
- `config.example.json`
- 示例 assets
- `artifacts/.gitkeep`
- 工具 ESLint 配置

本交接单不决定是否提交该工具；后续需要单独审查 diff。

## 12. 测试和构建状态

最近已确认结果：

### 根 lint

```text
npm.cmd run lint
```

结果：

```text
通过：0 errors / 4 warnings
```

4 个 warning 均在 `src/components/meme-generator.tsx`：

- `drawStickerEye` defined but never used
- `drawStickerMouth` defined but never used
- `getEmojiMood` defined but never used
- `isFaceStyleSticker` defined but never used

### src lint

```text
npx.cmd eslint src
```

结果：

```text
通过：0 errors / 4 warnings
```

### Day1 工具 lint

在 `scripts/day1-validation` 内执行：

```text
npm.cmd run lint
```

结果：

```text
通过：0 errors
```

### typecheck

根 `package.json` 没有现成 `typecheck` script，因此未运行。

### build

```text
npm.cmd run build
```

结果：

```text
成功
```

build 输出包含：

- `/`
- `/acceptable-use`
- `/api/license/activate`
- `/api/license/deactivate`
- `/api/license/validate`
- `/cancel`
- `/contact`
- `/pricing`
- `/privacy`
- `/refund`
- `/success`
- `/terms`

未执行：

- Product 验收
- SEO/GSC 验收
- GA4 验收
- 真实 License 激活
- sitemap submit
- 真实付款

## 13. 当前风险

### P0

当前检查未确认新的 P0 问题。

重点仍需保持：

- 不泄露 API Key、License Key、Product ID、Webhook Secret。
- 不把服务端 Secret 改成 `NEXT_PUBLIC_`。
- 不绕过 Creem License 校验。
- 不把普通手动编辑图片上传到服务器。

### P1

- AI Caption 接入后，现有“图片仅在浏览器本地处理”的隐私表述会产生冲突，必须拆分 Manual Mode 与 AI Caption Mode。
- AI API 需要限流、超时、错误处理和成本控制，不能公开无限调用。
- `$9 one-time Creator Plan` 不能扩展成“终身无限 AI”。
- AI 图片若进入日志、错误上报或持久化，会产生隐私风险。
- 需要 Provider 抽象，避免被 Gemini / OpenAI / Qwen 任一供应商锁死。
- Success / Cancel 当前代码未发现 noindex，生产 SEO 角度建议后续处理。
- 仓库未发现 robots/sitemap/canonical/OG/Twitter Card，SEO 基础仍弱。

### P2

- `src/components/meme-generator.tsx` 有 4 个既有 unused warning。
- `scripts/day1-validation` 尚未决定是否提交。
- `src/app/contact/page.tsx` 有 Git 假 `M`。
- 教程页面缺失。
- `/make-a-meme-from-a-photo` 缺失。
- 尚无 AI 模型评估工具。

### P3

- UI 可继续优化，但不应在 AI Caption 前做大范围重构。
- Day1 工具 README 原始中文部分存在编码显示问题，可后续单独整理。
- 可以增加更完整的 SEO metadata，但需避免虚假 AI 承诺。

## 14. 下一阶段产品计划

以下内容均为计划中，尚未实施。

### 第一步：Gemini AI Caption MVP

建议接入 Gemini 2.5 Flash，但正式 Model ID 和可用性必须实施前查官方文档确认。

MVP 流程：

```text
上传照片
-> 用户主动点击 Generate AI Captions
-> 显示图片将发送给 AI 服务商的提示
-> 用户确认
-> 选择风格
-> AI 返回 5 组英文 Meme 文案
-> 用户点击其中一组
-> 自动写入现有 Top Text 和 Bottom Text
-> 用户继续手动编辑
-> 下载 PNG
```

第一版风格：

- Funny
- Sarcastic
- Wholesome
- Reaction
- Workplace

第一阶段不做：

- AI 生图
- AI 图片编辑
- AI 换脸
- AI 视频
- 社区
- 大规模 Credits 系统
- 公开无限调用

### 第二步：100 张图片模型对比

候选供应商：

- Gemini
- OpenAI
- Qwen

当前用户计划比较的候选名包括：

- Gemini 2.5 Flash
- GPT-5 mini
- Qwen 视觉 Flash 类模型

注意：具体正式 API Model ID、版本、价格、可用性必须在实施测试时通过官方文档重新确认，不应仅依据产品俗称写死。

测试照片约 100 张，覆盖：

- 自拍
- 宠物
- 情侣
- 家庭
- 办公室
- 产品
- 体育
- 尴尬表情
- 多人合照
- 物品
- 风景

评估维度：

- 图片理解
- 图片相关性
- 英文自然度
- 英文笑点
- 文案长度
- 速度
- JSON 稳定性
- 失败率
- 拒绝率
- Token
- 单次成本

### 第三步：选择正式模型

主要依据：

- 英文笑点
- 生成速度
- 稳定性
- 成本
- 内容安全

### 第四步：保留供应商切换能力

推荐抽象：

```text
CaptionProvider
├── GeminiCaptionProvider
├── OpenAICaptionProvider
└── QwenCaptionProvider
```

建议结构：

```text
src/lib/ai/captions/
├── types.ts
├── schema.ts
├── prompt.ts
├── caption-provider.ts
├── create-caption-provider.ts
└── providers/
```

不要把 Gemini 业务逻辑直接写死在页面组件里。

### 第五步：后期普通 AI 生图

用户计划研究的候选包括：

- Nano Banana 系列的低成本图像模型
- Wan 图像生成模型
- Qwen Image 模型

正式产品名称、API Model ID、价格和可用性需要实施时重新核验。

### 第六步：比较生图模型

比较：

- 画质
- 人物一致性
- 提示词遵循
- 英文提示词理解
- 速度
- 失败率
- API 稳定性
- 单张成本
- 商用权限
- 内容安全

### 第七步：AI 生图独立 Credits

原则：

当前 `$9 one-time Creator Plan`：

- 继续提供永久去水印
- 继续提供手动编辑
- 继续遵守最多 3 个浏览器激活
- 不包含终身无限 AI 生图
- 不包含终身无限 AI 调用

未来 AI 功能建议使用：

- AI Credit Pack
- 或独立 Monthly AI Plan

AI Caption 可以赠送少量试用或初始额度。

AI 生图必须独立计费。

## 15. AI Caption 推荐技术架构

建议数据流：

```text
浏览器上传原图
-> 原图继续供本地编辑器使用
-> 用户主动选择 AI Caption
-> 浏览器创建临时压缩副本
-> Next.js 服务端 API
-> CaptionProvider
-> Gemini / OpenAI / Qwen
-> 固定 JSON
-> 写入现有 Top Text / Bottom Text
```

建议 API：

```text
POST /api/ai-meme-captions
```

建议响应：

```json
{
  "captions": [
    {
      "topText": "WHEN THE MEETING",
      "bottomText": "COULD HAVE BEEN AN EMAIL"
    }
  ]
}
```

建议环境变量名：

```text
GEMINI_API_KEY
AI_CAPTION_PROVIDER
AI_CAPTION_MODEL
AI_CAPTIONS_ENABLED
```

安全要求：

- API Key 仅服务端。
- 不使用 `NEXT_PUBLIC_GEMINI_API_KEY`。
- 图片发送前压缩。
- 不保存原图。
- 不保存 base64。
- 不在日志输出图片、base64 或用户照片内容。
- 服务端 Schema 校验。
- 设置超时。
- 设置限流。
- 加内容安全策略。
- AI 功能开关默认关闭。
- 正式上线前只做隐藏 MVP。

## 16. AI Caption 开发前必须确认

1. Gemini 正式 Model ID。
2. Gemini API 数据保留政策。
3. 图片是否用于训练。
4. 图片通过自己的服务器转发还是直接上传给供应商。
5. 临时图片如何删除。
6. 用户同意文案。
7. 图片压缩尺寸。
8. 图片大小限制。
9. 服务端超时。
10. 重试策略。
11. IP 或用户限流。
12. 免费次数。
13. Creator 是否赠送 AI Credits。
14. 日志策略。
15. 内容安全策略。
16. Provider 抽象。
17. JSON Schema。
18. 错误码。
19. Privacy 更新。
20. Terms 更新。
21. Acceptable Use 更新。
22. Pricing 更新。
23. 测试环境和生产环境隔离。

## 17. 下一位开发者推荐执行顺序

1. 阅读本交接单。
2. 执行 `git status`。
3. 确认当前 HEAD。
4. 识别现有未提交修改。
5. 不处理 `contact/page.tsx` 假 `M`。
6. 不覆盖 Day1 工具。
7. 确认是否先提交 Day1 工具整理。
8. 核验 Gemini 官方 API 文档和数据政策。
9. 设计 `CaptionProvider`。
10. 实现隐藏版 Gemini Caption MVP。
11. 使用 mock 完成测试。
12. 本地使用真实 Gemini Key 验证。
13. 更新 Privacy、Terms、Acceptable Use。
14. 增加限流和 AI Credits。
15. 制作 100 张图片测试集。
16. 对比 Gemini、OpenAI、Qwen。
17. 确定正式 Caption 模型。
18. 更新首页 SEO 和公开文案。
19. 最后再接入 AI 生图。
20. AI 生图独立计费。

## 18. 禁止事项

- 不覆盖 `.env.local`。
- 不提交密钥。
- 不把服务端 Secret 改成 `NEXT_PUBLIC_`。
- 不删除用户未提交修改。
- 不执行 `git reset --hard`。
- 不执行 `git clean`。
- 不批量 restore。
- 不修改 Creem 后台，除非用户明确要求并人工确认。
- 不随意改变 `$9 one-time Creator Plan` 权益。
- 不承诺终身无限 AI。
- 不在未更新隐私条款前公开 AI 上传功能。
- 不保存用户照片。
- 不记录完整 base64。
- 不在开发阶段直接 push。
- 不在没有审核 diff 前 commit。
- 不把具体 AI 模型俗称直接写死为正式 API ID。

## 19. 最终验收检查单

- [ ] 已读取当前 Git 状态。
- [ ] 已区分已提交和未提交状态。
- [ ] 未覆盖 `contact/page.tsx` 假 `M`。
- [ ] 未提交 Day1 本地产物。
- [ ] 未泄露环境变量。
- [ ] 未修改 Creem。
- [ ] 未修改 License 权益。
- [ ] Manual Mode 保持本地。
- [ ] AI Mode 必须主动确认。
- [ ] Provider 可切换。
- [ ] API Key 仅服务端。
- [ ] 图片不进入日志。
- [ ] 返回 JSON 经过校验。
- [ ] AI 功能有关停开关。
- [ ] lint 通过。
- [ ] build 通过。
- [ ] Privacy 已在公开前更新。
- [ ] `$9 one-time` 套餐未包含无限 AI。
- [ ] AI 生图使用独立 Credits。
- [ ] 未 commit。
- [ ] 未 push。
- [ ] 未部署。
