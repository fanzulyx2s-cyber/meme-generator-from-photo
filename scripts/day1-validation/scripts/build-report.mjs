import path from "node:path";
import fs from "node:fs";
import {
  loadConfig, outputDir, writeJson, writeText, nowIso, statusCounts
} from "./lib.mjs";

const { config } = loadConfig();
const out = outputDir();
const moduleFiles = [
  ["产品与支付", path.join(out, "product", "product-result.json")],
  ["SEO / GSC", path.join(out, "seo", "seo-result.json")],
  ["GA4", path.join(out, "ga4", "ga4-result.json")]
];

const modules = [];
for (const [label, file] of moduleFiles) {
  if (!fs.existsSync(file)) continue;
  try {
    modules.push({ label, file, data: JSON.parse(fs.readFileSync(file, "utf8")) });
  } catch {}
}

const allChecks = modules.flatMap((module) => module.data.checks || []);
const counts = statusCounts(allChecks);
const overall = counts.FAIL > 0 ? "FAIL" : counts.WARN + counts.MANUAL + counts.SKIP > 0 ? "WARN" : "PASS";

function esc(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function mdEscape(value = "") {
  return String(value).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

let md = `# ${config.projectName} 第1天上线验收报告\n\n`;
md += `- 生成时间：${nowIso()}\n`;
md += `- 网站：${config.siteUrl}\n`;
md += `- 总结果：**${overall}**\n`;
md += `- PASS：${counts.PASS}；FAIL：${counts.FAIL}；WARN：${counts.WARN}；MANUAL：${counts.MANUAL}；SKIP：${counts.SKIP}\n\n`;

for (const reportModule of modules) {
  md += `## ${reportModule.label}\n\n`;
  md += `| 状态 | 检查项 | 说明 | 证据 |\n|---|---|---|---|\n`;
  for (const item of reportModule.data.checks || []) {
    const evidence = item.evidence ? `[打开证据](${item.evidence})` : "";
    md += `| ${item.status} | ${mdEscape(item.name)} | ${mdEscape(item.detail)} | ${evidence} |\n`;
  }
  md += "\n";
}
md += `## 人工收尾原则\n\n`;
md += `- MANUAL 项目不会被脚本伪装成自动通过。\n`;
md += `- 生产环境真实付款、真实手机测试和 GSC 首页请求编入索引默认保留人工操作。\n`;
md += `- 报告不会写入 API Key、License Key、Google 凭据或银行卡信息。\n`;

writeText(path.join(out, "REPORT.md"), md);

const badgeClass = (status) => ({
  PASS: "pass", FAIL: "fail", WARN: "warn", MANUAL: "manual", SKIP: "skip"
})[status] || "skip";

let moduleHtml = "";
for (const reportModule of modules) {
  const rows = (reportModule.data.checks || []).map((item) => `
    <tr>
      <td><span class="badge ${badgeClass(item.status)}">${esc(item.status)}</span></td>
      <td>${esc(item.name)}</td>
      <td>${esc(item.detail)}</td>
      <td>${item.evidence ? `<a href="${esc(item.evidence)}">打开</a>` : ""}</td>
    </tr>`).join("");

  moduleHtml += `
    <section class="panel">
      <h2>${esc(reportModule.label)}</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>状态</th><th>检查项</th><th>说明</th><th>证据</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>`;
}

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(config.projectName)} 第1天验收</title>
<style>
:root{--bg:#091120;--panel:#121c31;--line:#263554;--text:#f5f7ff;--muted:#9eb0d8}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,"Segoe UI","Microsoft YaHei",sans-serif}
.wrap{max-width:1280px;margin:auto;padding:34px 22px 70px}.hero{background:linear-gradient(135deg,#13213b,#11182b);border:1px solid var(--line);border-radius:20px;padding:25px;margin-bottom:18px}
h1{margin:0 0 10px}.meta{color:var(--muted);line-height:1.8}.summary{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
.counter{background:#0c1527;border:1px solid var(--line);border-radius:12px;padding:10px 13px}.panel{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:20px;margin-top:16px}
.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse;min-width:820px}th,td{text-align:left;border-bottom:1px solid var(--line);padding:12px;vertical-align:top}th{color:var(--muted)}
.badge{display:inline-block;border-radius:999px;padding:5px 9px;font-weight:800;font-size:12px}.pass{background:#153d32;color:#71edbd}.fail{background:#48202b;color:#ff8497}.warn{background:#483b18;color:#ffd56c}.manual{background:#24365b;color:#90bbff}.skip{background:#2b3040;color:#b5bfd6}
a{color:#52d8ff}.footer{color:var(--muted);margin-top:20px;line-height:1.8}
</style>
</head>
<body><main class="wrap">
<section class="hero">
  <h1>${esc(config.projectName)} 第1天上线验收</h1>
  <div class="meta">网站：${esc(config.siteUrl)}<br>生成时间：${esc(nowIso())}<br>总结果：<strong>${esc(overall)}</strong></div>
  <div class="summary">
    <div class="counter">PASS ${counts.PASS}</div>
    <div class="counter">FAIL ${counts.FAIL}</div>
    <div class="counter">WARN ${counts.WARN}</div>
    <div class="counter">MANUAL ${counts.MANUAL}</div>
    <div class="counter">SKIP ${counts.SKIP}</div>
  </div>
</section>
${moduleHtml}
<section class="panel footer">
  MANUAL 项目不会被伪装成自动通过。生产真实付款、真实手机测试和 GSC 首页请求编入索引默认保留人工操作。报告不会记录密钥或支付信息。
</section>
</main></body></html>`;

writeText(path.join(out, "REPORT.html"), html);
writeJson(path.join(out, "SUMMARY.json"), {
  project: config.projectName,
  siteUrl: config.siteUrl,
  generatedAt: nowIso(),
  overall,
  counts,
  modules: modules.map((module) => module.data.module)
});

console.log(path.join(out, "REPORT.html"));
