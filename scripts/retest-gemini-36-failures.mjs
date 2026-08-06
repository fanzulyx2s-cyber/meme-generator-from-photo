import { createInterface } from "node:readline/promises";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { CONFIRMATION, PAID_TIER_PRICING_PER_MILLION, discoverImages, postCaptionRequest, prepareComparisonImage, startRealServer } from "./compare-gemini-caption-models.mjs";

const model = "gemini-3.6-flash";
const timeoutMs = 45_000;
const retryDelayMs = 3_000;
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const priorDirectory = process.argv[2];
const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
const cost = (usage = {}) => Number((((Number(usage.promptTokenCount || 0) * PAID_TIER_PRICING_PER_MILLION[model].input) + ((Number(usage.candidatesTokenCount || 0) + Number(usage.thoughtsTokenCount || 0)) * PAID_TIER_PRICING_PER_MILLION[model].outputAndThinking)) / 1_000_000).toFixed(8));

async function main() {
  if (!priorDirectory) throw new Error("A prior local result directory is required.");
  const prior = JSON.parse(await readFile(join(priorDirectory, "results.json"), "utf8"));
  const failedIds = prior.results.filter((entry) => entry.model === "Model C" && (entry.status !== 200 || entry.validation !== "PASS")).map((entry) => entry.imageId);
  if (failedIds.length !== 6) throw new Error("Expected exactly six prior anonymous failures.");
  const allImages = await discoverImages(join(root, "private-ai-test-images"));
  const images = allImages.filter((image) => failedIds.includes(image.id));
  const prepared = await Promise.all(images.map(async (image) => ({ id: image.id, ...(await prepareComparisonImage(image)) })));
  if (prepared.some((image) => !image.ok)) throw new Error("Offline preparation failed. No network request was sent.");
  console.log(`Images: ${prepared.length}\nModel: ${model}\nMaximum calls: 12\nProvider timeout: 45 seconds\nThis will make real Gemini calls.`);
  const readline = createInterface({ input: process.stdin, output: process.stdout }); const answer = await readline.question("Type the confirmation text exactly: "); readline.close();
  if (answer !== CONFIRMATION) { console.log("Confirmation did not match. No network request was sent."); return; }
  if (!existsSync(join(root, ".next", "BUILD_ID"))) throw new Error("Run npm.cmd run build before the retest.");
  const timestamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-"); const output = join(root, "local-ai-comparison-results", timestamp); await mkdir(output, { recursive: true });
  const server = await startRealServer(model, { root, port: 3105, timeoutMs }); const results = [];
  try { for (const image of prepared) { const attempt = async () => { const start = Date.now(); const response = await postCaptionRequest({ url: "http://127.0.0.1:3105/api/ai-meme-captions", body: { imageBase64: image.imageBase64, mimeType: image.mimeType, style: "reaction", includeUsageMetadata: true }, timeoutMs }); return { status: response.status, seconds: Number(((Date.now() - start) / 1000).toFixed(2)), usage: response.usageMetadata, estimatedCostUsd: cost(response.usageMetadata) }; }; const first = await attempt(); let retry; if (first.status === 502 || first.status === 0) { await sleep(retryDelayMs); retry = await attempt(); } results.push({ imageId: image.id, first, retry, succeededAfter25Seconds: [first, retry].filter(Boolean).some((entry) => entry.status === 200 && entry.seconds > 25 && entry.seconds <= 45) }); } } finally { await server.stop(); }
  const text = `# Gemini 3.6 Failure Retest\n\n- Model: ${model}\n- Provider timeout: 45 seconds\n- Retry rule: once for HTTP 502 or local no-response only; 3-second wait.\n- First statuses: ${results.map((r) => r.first.status).join(", ")}\n- Retry statuses: ${results.map((r) => r.retry?.status ?? "not retried").join(", ")}\n- Any success after 25 seconds within 45: ${results.some((r) => r.succeededAfter25Seconds) ? "yes" : "no"}\n- Remaining HTTP 502: ${results.flatMap((r) => [r.first, r.retry].filter(Boolean)).filter((r) => r.status === 502).length}\n- Conclusion: inspect per-attempt status and timing; do not declare a winner automatically.\n`;
  await Promise.all([writeFile(join(output, "retest-results.json"), JSON.stringify({ model, timeoutMs, retryDelayMs, results }, null, 2)), writeFile(join(output, "GEMINI_36_RETEST_REPORT.md"), text)]); console.log(`Retest completed. Results: ${output}`);
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
