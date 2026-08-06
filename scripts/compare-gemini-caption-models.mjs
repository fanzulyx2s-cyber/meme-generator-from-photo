import { createInterface } from "node:readline/promises";
import { spawn } from "node:child_process";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

export const FIXED_MODELS = ["gemini-3.1-flash-lite", "gemini-3.5-flash-lite", "gemini-3.6-flash"];
export const FIXED_STYLE = "reaction";
export const CONFIRMATION = "RUN REAL GEMINI MODEL COMPARISON";
export const REQUEST_INTERVAL_MS = 13_000;
export const REQUEST_TIMEOUT_MS = 25_000;
export const MAX_COMPARISON_IMAGE_BYTES = 2_000_000;
export const MAX_COMPARISON_COMPRESSED_BYTES = 1_800_000;
export const PAID_TIER_PRICING_PER_MILLION = {
  "gemini-3.1-flash-lite": { input: 0.25, outputAndThinking: 1.5 },
  "gemini-3.5-flash-lite": { input: 0.3, outputAndThinking: 2.5 },
  "gemini-3.6-flash": { input: 1.5, outputAndThinking: 7.5 },
};
const extensions = new Map([[".jpg", "image/jpeg"], [".jpeg", "image/jpeg"], [".png", "image/png"], [".webp", "image/webp"]]);

const sleepFor = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
const idFor = (index) => `Image-${String(index + 1).padStart(2, "0")}`;
const csv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const escapeHtml = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const nonNegativeInteger = (value) => typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : 0;

async function encodeComparisonJpeg({ input, quality }) {
  return sharp(input).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).jpeg({ quality: Math.round(quality * 100), mozjpeg: true }).toBuffer();
}

export async function compressComparisonImage(input, { encode = encodeComparisonJpeg } = {}) {
  for (const quality of [0.82, 0.76, 0.7, 0.64, 0.58]) {
    try {
      const buffer = await encode({ input, quality, maxSide: 1600 });
      if (buffer.byteLength <= MAX_COMPARISON_COMPRESSED_BYTES) return { buffer, quality, byteLength: buffer.byteLength, mimeType: "image/jpeg" };
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export async function prepareComparisonImage(image, { read = readFile, compress = compressComparisonImage } = {}) {
  try {
    const original = await read(image.path);
    if (image.byteLength <= MAX_COMPARISON_IMAGE_BYTES) return { ok: true, imageBase64: original.toString("base64"), mimeType: image.mimeType, byteLength: original.byteLength, wasCompressed: false };
    const compressed = await compress(original);
    if (!compressed || compressed.byteLength > MAX_COMPARISON_COMPRESSED_BYTES) return { ok: false, errorCode: "IMAGE_PREPARATION_FAILED" };
    return { ok: true, imageBase64: compressed.buffer.toString("base64"), mimeType: compressed.mimeType, byteLength: compressed.byteLength, wasCompressed: true };
  } catch {
    return { ok: false, errorCode: "IMAGE_PREPARATION_FAILED" };
  }
}

function usageMetrics(usageMetadata, model) {
  const inputTokens = nonNegativeInteger(usageMetadata?.promptTokenCount);
  const outputTokens = nonNegativeInteger(usageMetadata?.candidatesTokenCount);
  const thinkingTokens = nonNegativeInteger(usageMetadata?.thoughtsTokenCount);
  const totalTokens = nonNegativeInteger(usageMetadata?.totalTokenCount);
  const pricing = PAID_TIER_PRICING_PER_MILLION[model];
  const estimatedCostUsd = Number((((inputTokens * pricing.input) + ((outputTokens + thinkingTokens) * pricing.outputAndThinking)) / 1_000_000).toFixed(8));
  return { inputTokens, outputTokens, thinkingTokens, totalTokens, estimatedCostUsd };
}

export async function discoverImages(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const selected = entries.filter((entry) => entry.isFile()).sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "variant" })).flatMap((entry) => {
    const extension = entry.name.slice(entry.name.lastIndexOf(".")).toLowerCase();
    const mimeType = extensions.get(extension);
    return mimeType ? [{ path: join(directory, entry.name), mimeType }] : [];
  }).slice(0, 10);
  return Promise.all(selected.map(async (image, index) => ({ ...image, id: idFor(index), byteLength: (await stat(image.path)).size })));
}

function captionDiagnostics(captions) {
  const values = Array.isArray(captions) ? captions : [];
  const seen = new Set();
  let emptyCaptionCount = 0;
  let duplicateCaptionCount = 0;
  for (const caption of values) {
    if (!caption || typeof caption.topText !== "string" || typeof caption.bottomText !== "string" || !caption.topText.trim() || !caption.bottomText.trim()) { emptyCaptionCount += 1; continue; }
    const key = `${caption.topText.trim().toLowerCase()}\u0000${caption.bottomText.trim().toLowerCase()}`;
    if (seen.has(key)) { duplicateCaptionCount += 1; continue; }
    seen.add(key);
  }
  return { captionCount: values.length, emptyCaptionCount, duplicateCaptionCount, validation: values.length === 5 && emptyCaptionCount === 0 && duplicateCaptionCount === 0 ? "PASS" : "FAIL" };
}

function markdownCaption(caption, index) {
  return `${index + 1}.\n- Top Text: ${caption.topText}\n- Bottom Text: ${caption.bottomText}\n- 我的选择：[ ]`;
}

function modelOutputsMarkdown(results, imageIds) {
  const tableOfContents = imageIds.map((imageId) => `- [${imageId}](#${imageId.toLowerCase()})`).join("\n");
  const sections = imageIds.map((imageId) => {
    const entries = FIXED_MODELS.map((model) => results.find((result) => result.imageId === imageId && result.model === model) ?? { model, captions: [], responseTimeSeconds: 0, validation: "FAIL" });
    return `## ${imageId}\n\n${entries.map((result) => `### ${result.model}\n\n${result.captions.length ? result.captions.map(markdownCaption).join("\n\n") : "No valid parsed captions were recorded."}\n\n- 生成耗时：${result.responseTimeSeconds} seconds\n- 状态：${result.validation}`).join("\n\n")}`;
  }).join("\n\n");
  return `# AI Meme Caption Model Outputs\n\n## 目录\n\n${tableOfContents}\n\n${sections}\n`;
}

function comparisonSummaryMarkdown(results) {
  const modelSections = FIXED_MODELS.map((model) => {
    const entries = results.filter((result) => result.model === model);
    const timings = entries.map((entry) => entry.responseTimeSeconds);
    const statusDistribution = [...new Set(entries.map((entry) => entry.status))].sort((a, b) => a - b).map((status) => `${status}: ${entries.filter((entry) => entry.status === status).length}`).join(", ") || "No calls";
    const average = timings.length ? (timings.reduce((total, value) => total + value, 0) / timings.length).toFixed(2) : "N/A";
    const complete = entries.length === 10 ? "Yes" : "No";
    const tokenTotal = (field) => entries.reduce((total, entry) => total + entry[field], 0);
    return `### ${model}\n\n- 成功调用次数（HTTP 200）：${entries.filter((entry) => entry.status === 200).length}\n- 失败次数（非 HTTP 200）：${entries.filter((entry) => entry.status !== 200).length}\n- 平均响应时间：${average}${average === "N/A" ? "" : " seconds"}\n- 最快响应时间：${timings.length ? `${Math.min(...timings)} seconds` : "N/A"}\n- 最慢响应时间：${timings.length ? `${Math.max(...timings)} seconds` : "N/A"}\n- 正确返回 5 组 captions 的比例：${entries.length ? `${entries.filter((entry) => entry.validation === "PASS").length}/${entries.length}` : "N/A"}\n- 空文案次数：${entries.reduce((total, entry) => total + entry.emptyCaptionCount, 0)}\n- 完全重复文案次数：${entries.reduce((total, entry) => total + entry.duplicateCaptionCount, 0)}\n- HTTP 状态分布：${statusDistribution}\n- 生成文案总数：${entries.reduce((total, entry) => total + entry.captionCount, 0)}\n- inputTokens：${tokenTotal("inputTokens")}\n- outputTokens：${tokenTotal("outputTokens")}\n- thinkingTokens：${tokenTotal("thinkingTokens")}\n- totalTokens：${tokenTotal("totalTokens")}\n- Estimated cost (Paid Tier rate): $${tokenTotal("estimatedCostUsd").toFixed(8)}\n- 是否完成全部 10 张图片：${complete}`;
  }).join("\n\n");
  return `# AI Meme Caption Model Comparison Summary\n\n${modelSections}\n\nFree Tier: this is an estimate, not an actual charge.\n\n## 需要人工判断的项目\n\n- 图片理解、相关性、英文自然度、幽默度和多样性。\n- 不根据速度自动宣布最终赢家。\n\n## 我的最终评价\n\n- 图片理解最佳：\n- 相关性最佳：\n- 英文自然度最佳：\n- 幽默度最佳：\n- 多样性最佳：\n- 默认模型：\n- 备用模型：\n- 不采用的模型：\n- 备注：\n`;
}

async function assertSafeReports(outputDirectory, originalImagePaths) {
  const reportNames = ["results.json", "comparison.csv", "blind-review.html", "MODEL_CAPTION_OUTPUTS.md", "MODEL_COMPARISON_SUMMARY.md", "run-summary.md", "model-map.json"];
  const reports = await Promise.all(reportNames.map((name) => readFile(join(outputDirectory, name), "utf8")));
  const forbiddenNames = originalImagePaths.filter((imagePath) => typeof imagePath === "string").map((imagePath) => imagePath.slice(Math.max(imagePath.lastIndexOf("/"), imagePath.lastIndexOf("\\")) + 1)).filter((name) => extensions.has(name.slice(name.lastIndexOf(".")).toLowerCase()));
  const unsafe = reports.some((report) => forbiddenNames.some((name) => report.includes(name)) || /AIza[\w-]{20,}/.test(report) || /[A-Za-z0-9+/]{200,}={0,2}/.test(report) || /"candidates"\s*:/.test(report));
  if (unsafe) throw new Error("Safety scan failed: generated reports contain prohibited data.");
}

async function makeReports(results, outputDirectory, originalImagePaths, imageIds) {
  const blinded = results.map(({ model, ...result }) => ({ ...result, model: `Model ${String.fromCharCode(65 + FIXED_MODELS.indexOf(model))}` }));
  const modelMap = Object.fromEntries(FIXED_MODELS.map((model, index) => [`Model ${String.fromCharCode(65 + index)}`, model]));
  const csvRows = ["image,model,status,validation,response_time_seconds,input_tokens,output_tokens,thinking_tokens,total_tokens,estimated_cost_usd,notes", ...blinded.map((result) => [result.imageId, result.model, result.status, result.validation, result.responseTimeSeconds, result.inputTokens, result.outputTokens, result.thinkingTokens, result.totalTokens, result.estimatedCostUsd, result.notes].map(csv).join(","))].join("\n");
  const scoreFields = ["Image understanding", "Relevance", "English naturalness", "Humor", "Variety"].map((label) => `<label>${label} <select><option value=""></option>${[1,2,3,4,5].map((score) => `<option>${score}</option>`).join("")}</select></label>`).join("");
  const imageSections = imageIds.map((imageId) => {
    const cards = FIXED_MODELS.map((_, index) => {
      const model = `Model ${String.fromCharCode(65 + index)}`;
      const result = blinded.find((entry) => entry.imageId === imageId && entry.model === model) ?? { captions: [] };
      return `<article class="card"><h3>${model}</h3><ol>${result.captions.map((caption) => `<li><strong>${escapeHtml(caption.topText)}</strong><br>${escapeHtml(caption.bottomText)}</li>`).join("") || "<li>No valid parsed captions were recorded.</li>"}</ol><fieldset><legend>Human score</legend>${scoreFields}<label>Notes <textarea></textarea></label></fieldset></article>`;
    }).join("");
    return `<section class="image"><h2>${escapeHtml(imageId)}</h2><div class="models">${cards}</div></section>`;
  }).join("\n");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>AI-02 Blind Review</title><style>body{font-family:system-ui;margin:2rem;background:#faf7f0;color:#171717}.image{margin:0 0 2rem}.models{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem}.card{background:white;border:1px solid #ddd;border-radius:12px;padding:1rem;min-width:0}li{margin:.6rem 0}fieldset{display:grid;gap:.5rem}select,textarea{display:block;width:100%;margin-top:.2rem}textarea{height:4rem}@media(max-width:900px){.models{grid-template-columns:1fr}}</style></head><body><h1>AI-02 Blind Review</h1><p>Models are anonymous. No test image is embedded.</p><main>${imageSections}</main></body></html>`;
  const tokenTotal = (field) => results.reduce((total, entry) => total + entry[field], 0);
  const summary = `# AI-02 Run Summary\n\n- Fixed style: ${FIXED_STYLE}\n- Images: ${new Set(results.map((result) => result.imageId)).size}\n- Models: ${FIXED_MODELS.length}\n- Calls attempted: ${results.length}\n- PASS results: ${results.filter((result) => result.validation === "PASS").length}\n- inputTokens: ${tokenTotal("inputTokens")}\n- outputTokens: ${tokenTotal("outputTokens")}\n- thinkingTokens: ${tokenTotal("thinkingTokens")}\n- totalTokens: ${tokenTotal("totalTokens")}\n- estimatedCostUsd: $${tokenTotal("estimatedCostUsd").toFixed(8)} (Paid Tier estimate; Free Tier is not an actual charge)\n- Stopped: ${results.some((result) => result.stopReason) ? "yes" : "no"}\n`;
  await Promise.all([writeFile(join(outputDirectory, "results.json"), JSON.stringify({ style: FIXED_STYLE, results: blinded }, null, 2)), writeFile(join(outputDirectory, "comparison.csv"), csvRows), writeFile(join(outputDirectory, "blind-review.html"), html), writeFile(join(outputDirectory, "MODEL_CAPTION_OUTPUTS.md"), modelOutputsMarkdown(results, imageIds)), writeFile(join(outputDirectory, "MODEL_COMPARISON_SUMMARY.md"), comparisonSummaryMarkdown(results)), writeFile(join(outputDirectory, "run-summary.md"), summary), writeFile(join(outputDirectory, "model-map.json"), JSON.stringify(modelMap, null, 2))]);
  await assertSafeReports(outputDirectory, originalImagePaths);
}

export async function runComparison({ confirmed, images, request, startServer, sleep = sleepFor, outputDirectory }) {
  if (!confirmed) return { status: "cancelled", calls: 0, style: FIXED_STYLE, results: [] };
  const results = []; let stopped = false; let calls = 0;
  for (const model of FIXED_MODELS) {
    if (stopped) break;
    const server = await startServer(model);
    try {
      for (const image of images) {
        if (image.ok === false) {
          const diagnostics = captionDiagnostics([]);
          results.push({ imageId: image.id, model, status: 0, validation: diagnostics.validation, responseTimeSeconds: 0, notes: "Image preparation failed", captions: [], ...diagnostics, ...usageMetrics(undefined, model), errorCode: image.errorCode });
          continue;
        }
        if (calls > 0) await sleep(REQUEST_INTERVAL_MS);
        const started = Date.now(); let response;
        try { response = await request({ model, image, style: FIXED_STYLE }); } catch { response = { status: 0, captions: [] }; }
        calls += 1;
        const stopReason = [401, 403, 429].includes(response.status) ? `HTTP_${response.status}` : response.errorCode === "MISSING_CONFIGURATION" ? "MISSING_CONFIGURATION" : undefined;
        const diagnostics = captionDiagnostics(response.captions);
        results.push({ imageId: image.id, model, status: response.status, validation: diagnostics.validation, responseTimeSeconds: Number(((Date.now() - started) / 1000).toFixed(2)), notes: stopReason ? "Safe stop" : response.status === 200 ? "" : "Request failed", captions: response.status === 200 ? (response.captions ?? []).filter((caption) => caption && typeof caption.topText === "string" && typeof caption.bottomText === "string") : [], ...diagnostics, ...usageMetrics(response.usageMetadata, model), stopReason });
        if (stopReason) { stopped = true; break; }
      }
    } finally { await server.stop(); }
  }
  await mkdir(outputDirectory, { recursive: true }); await makeReports(results, outputDirectory, images.map((image) => image.path), images.map((image) => image.id));
  return { status: stopped ? "stopped" : "completed", calls, style: FIXED_STYLE, results };
}

export async function startRealServer(model, { root, port, timeoutMs = REQUEST_TIMEOUT_MS }) {
  const nextCli = join(root, "node_modules", "next", "dist", "bin", "next");
  const child = spawn(process.execPath, [nextCli, "start", "-p", String(port)], { cwd: root, env: { ...process.env, AI_CAPTION_MODEL: model, AI_CAPTION_TIMEOUT_MS: String(timeoutMs) }, stdio: ["ignore", "ignore", "ignore"] });
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) { try { if ((await fetch(`http://127.0.0.1:${port}`)).ok) break; } catch {} await sleepFor(250); }
  if (Date.now() >= deadline) { child.kill(); throw new Error("Local server did not start in time."); }
  return { stop: async () => { child.kill(); } };
}

export async function postCaptionRequest({ url, body, fetchImpl = fetch, timeoutMs = REQUEST_TIMEOUT_MS }) {
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try { const response = await fetchImpl(url, { method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal, body: JSON.stringify(body) }); const json = await response.json().catch(() => ({})); return { status: response.status, captions: json.captions ?? [], usageMetadata: json.usageMetadata, errorCode: json.error?.code }; } catch { return { status: 0, captions: [] }; } finally { clearTimeout(timeout); }
}

async function requestRealCaption({ port, image }) {
  return postCaptionRequest({ url: `http://127.0.0.1:${port}/api/ai-meme-captions`, body: { imageBase64: image.imageBase64, mimeType: image.mimeType, style: FIXED_STYLE, includeUsageMetadata: true } });
}

async function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), ".."); const images = await discoverImages(join(root, "private-ai-test-images"));
  console.log(`Images: ${images.length}\nModels: ${FIXED_MODELS.length}\nMaximum calls: ${images.length * FIXED_MODELS.length}\nFixed style: ${FIXED_STYLE}\nThis will make real Gemini calls.`);
  const readline = createInterface({ input: process.stdin, output: process.stdout }); const answer = await readline.question("Type the confirmation text exactly: "); readline.close();
  if (answer !== CONFIRMATION) { console.log("Confirmation did not match. No network request was sent."); return; }
  if (!existsSync(join(root, ".next", "BUILD_ID"))) throw new Error("Run npm.cmd run build before the real comparison.");
  const preparedImages = await Promise.all(images.map((image) => prepareComparisonImage(image)));
  const timestamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-"); const port = 3104;
  const result = await runComparison({ confirmed: true, images: preparedImages.map((prepared, index) => ({ ...images[index], ...prepared })), outputDirectory: join(root, "local-ai-comparison-results", timestamp), sleep: sleepFor, startServer: (model) => startRealServer(model, { root, port }), request: ({ image }) => requestRealCaption({ port, image }) });
  console.log(`Comparison ${result.status}. Calls attempted: ${result.calls}.`);
}

const dirname = (value) => value.slice(0, Math.max(value.lastIndexOf("/"), value.lastIndexOf("\\")));
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
