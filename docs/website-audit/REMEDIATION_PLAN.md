# REMEDIATION_PLAN（SEO 改造后）

## 当前第一优先级

把“代码层 SEO 已完成”转成“线上可验证”：Windows build/test、线上 robots/sitemap/canonical、GSC、统计、支付和 AI 真实闭环。

## 未来 7 天

### 第 1 天：Windows 验证

- 运行 `npm.cmd run test:ai`
- 运行 `npm.cmd run lint`
- 运行 TypeScript 检查
- 运行 production build
- 修复任何由 SEO 页面或 metadata 引入的构建问题

### 第 2 天：本地浏览器验收

- 检查首页和三个新页面桌面/手机布局
- 检查每页唯一 H1、Title、Description、canonical
- 检查 `/robots.txt`、`/sitemap.xml`、404、success/cancel noindex
- 确认页面加载不自动调用 AI API

### 第 3 天：部署和 GSC

- 部署通过验证的版本
- 验证 HTTPS、主域统一和线上状态码
- 添加 GSC 域名资源
- 提交 sitemap
- 请求检查首页和三个新页面

### 第 4 天：统计

- 选择 GA4、PostHog 或其他单一统计工具
- 加入最小事件：photo_upload、png_download、pricing_view、checkout_click、license_activate
- AI 开启后再加 consent/generate/success/error
- 同步隐私披露

### 第 5 天：支付和 License

- 使用测试产品或可控小额订单
- 验证购买、邮件、License 激活、无水印导出、停用和退款支持入口

### 第 6-7 天：保存证据和复审

- 保存 GSC、统计、支付、移动端截图
- 重新执行审计评分
- 只处理真正阻碍推广的 P0/P1

## 未来 30 天

- 等待 GSC 查询与曝光数据
- 分析首页与三个页面的点击和转化
- 根据真实查询词决定下一个页面
- 优化标题和内部链接，不批量生成薄页
- AI 稳定后再决定是否增加 AI Caption 落地页

## 当前不要做

- 不批量生成几十个换词页面
- 不购买无关外链
- 不在没有数据前重做整站 UI
- 不把 `$9 one-time` 描述成无限 AI 权益
- 不在 AI 未验证前把 AI 作为首页主要承诺
