> **状态说明（2026-08-05）：** 本文件主要记录 SEO 改造前的审计证据。改造后的当前状态请以 `SEO_IMPLEMENTATION_SUMMARY.md`、`AUDIT_SUMMARY.md` 和 `SEO_TASK_LIST.md` 为准。

# MANUAL_VERIFICATION_CHECKLIST

以下项目本轮未做破坏性或真实生产操作，必须人工确认。

## 1. Creem 支付与 License

- [ ] 使用 Creem 测试产品或可退款小额订单，从 `/pricing` 点击 `Buy Creator Plan`。
- [ ] 确认 checkout 域名、价格、产品名、退款说明与网站一致。
- [ ] 确认支付成功后跳转 `/success`，取消后跳转 `/cancel`。
- [ ] 确认购买邮箱能收到 License Key。
- [ ] 在网站输入 License Key 激活当前浏览器。
- [ ] 激活后首页和导出 PNG 均无 `memephotoai.com` 水印。
- [ ] 停用当前浏览器后，免费水印恢复。
- [ ] 后台确认最多 3 个浏览器限制真实生效。
- [ ] 不把真实 API Key、Cookie、Token、订单敏感信息写入仓库或报告。

## 2. GSC 与 Sitemap

- [ ] 登录 Google Search Console。
- [ ] 添加或确认 `sc-domain:memephotoai.com`。
- [ ] 确认 `/robots.txt` 可访问。
- [ ] 确认 `/sitemap.xml` 可访问。
- [ ] 提交 sitemap。
- [ ] 手动请求首页编入索引。
- [ ] 记录 sitemap 状态、抓取错误、页面是否被发现。

## 3. GA4 或其他统计

- [ ] 确认是否已接入 GA4/PostHog/Clarity 之一。
- [ ] 打开实时报告，访问首页能看到实时访问。
- [ ] 触发并确认以下事件：`cta_click`、`photo_upload`、`meme_preview_ready`、`download_png`、`pricing_view`、`checkout_click`、`license_activate_success`、`license_activate_error`。
- [ ] Privacy 同步披露统计工具和 cookie/数据处理。

## 4. 浏览器和移动端

- [ ] Chrome 桌面 1440x900：打开首页、上传图片、编辑文字、添加贴纸、下载 PNG。
- [ ] Chrome 手机模拟 390x844：完成同样流程。
- [ ] 360x800 小屏：检查是否横向溢出、按钮遮挡、弹窗超屏。
- [ ] Safari/iOS 真机或模拟器：确认文件上传、Canvas、下载行为。
- [ ] 检查 Console 是否有 error。
- [ ] 检查 Network 是否有大量失败请求。

## 5. 线上公开状态

- [ ] `https://memephotoai.com/` 200。
- [ ] `http://memephotoai.com/` 正确跳转 HTTPS。
- [ ] `https://www.memephotoai.com/` 与非 www 统一。
- [ ] 随机不存在 URL 返回真实 404。
- [ ] `/success`、`/cancel` 不进入 sitemap，或显式 noindex。

## 6. 需要保存的证据

- [ ] 桌面首页截图。
- [ ] 手机首页截图。
- [ ] 手机编辑器上传后截图。
- [ ] 支付 checkout 截图，不含敏感支付信息。
- [ ] GSC sitemap 状态截图。
- [ ] GA4 实时事件截图。
- [ ] 测试订单和 License 结果摘要，隐藏敏感值。
