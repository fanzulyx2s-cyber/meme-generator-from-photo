import path from "node:path";
import fs from "node:fs";
import { chromium } from "playwright";
import { google } from "googleapis";
import {
  loadConfig, outputDir, ensureDir, writeJson, nowIso, check,
  relativeToOutput, redact
} from "./lib.mjs";

const { config } = loadConfig();
const out = ensureDir(path.join(outputDir(), "ga4"));
const checks = [];
const requests = [];
const testEvent = config.ga4?.testEventName || "day1_validation";

function add(status, name, detail = "", file = "") {
  checks.push(check(status, name, redact(detail), file ? relativeToOutput(file, outputDir()) : ""));
}

function findMeasurementIds(text) {
  return [...new Set((String(text).match(/G-[A-Z0-9]{6,}/gi) || []).map((id) => id.toUpperCase()))];
}

let browser;
let detectedIds = [];
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on("request", (request) => {
    const url = request.url();
    if (
      /googletagmanager\.com|google-analytics\.com|analytics\.google\.com|\/g\/collect/i.test(url)
    ) {
      requests.push({ method: request.method(), url: redact(url) });
    }
  });

  const response = await page.goto(config.siteUrl, { waitUntil: "networkidle", timeout: 45000 });
  add(response?.status() === 200 ? "PASS" : "FAIL", "GA4 检查页面打开", `HTTP ${response?.status() || "unknown"}`);

  const html = await page.content();
  detectedIds = findMeasurementIds(html + "\n" + requests.map((r) => r.url).join("\n"));
  add(detectedIds.length ? "PASS" : "FAIL", "检测 GA4 Measurement ID", detectedIds.length ? detectedIds.join(", ") : "未检测到 G- 开头的 Measurement ID");

  const tagLoaded = requests.some((item) => /googletagmanager\.com\/gtag\/js/i.test(item.url));
  add(tagLoaded ? "PASS" : "WARN", "Google Tag 脚本加载", tagLoaded ? "检测到 gtag.js 请求" : "未捕获 gtag.js；也可能通过 GTM 或同意模式延迟加载");

  const pageViewRequest = requests.some((item) => /google-analytics\.com\/g\/collect/i.test(item.url) || /[?&]en=page_view(?:&|$)/i.test(item.url));
  add(pageViewRequest ? "PASS" : "WARN", "GA4 page_view 网络请求", pageViewRequest ? "已捕获 collect 请求" : "未捕获；可能受同意模式、广告拦截或配置影响");

  const customRequestPromise = page.waitForRequest(
    (request) => /google-analytics\.com\/g\/collect/i.test(request.url()) && request.url().includes(`en=${testEvent}`),
    { timeout: 12000 }
  ).catch(() => null);

  const triggered = await page.evaluate((eventName) => {
    try {
      if (typeof window.gtag === "function") {
        window.gtag("event", eventName, {
          test_run: true,
          transport_type: "beacon"
        });
        return "gtag";
      }
      if (Array.isArray(window.dataLayer)) {
        window.dataLayer.push({
          event: eventName,
          test_run: true
        });
        return "dataLayer";
      }
      return "";
    } catch {
      return "";
    }
  }, testEvent);

  const customRequest = await customRequestPromise;
  add(
    customRequest ? "PASS" : triggered ? "WARN" : "FAIL",
    "发送 GA4 测试事件",
    customRequest
      ? `${testEvent} 已产生 collect 请求`
      : triggered
        ? `已通过 ${triggered} 触发，但未捕获对应 collect 请求`
        : "页面不存在可用的 gtag 或 dataLayer"
  );

  const shot = path.join(out, "ga4-page.png");
  await page.screenshot({ path: shot, fullPage: true });
  add("PASS", "GA4 页面证据截图", "已保存", shot);

  await context.close();
} catch (error) {
  add("FAIL", "GA4 浏览器检查", error.message);
} finally {
  if (browser) await browser.close();
}

const requestsFile = path.join(out, "analytics-requests.json");
writeJson(requestsFile, requests);
add(requests.length ? "PASS" : "WARN", "Analytics 请求记录", `${requests.length} 条`, requestsFile);

const ga4 = config.ga4 || {};
if (ga4.realtimeApiEnabled) {
  const credentialsPath = process.env[ga4.credentialsEnv || "GOOGLE_APPLICATION_CREDENTIALS"];
  const propertyId = process.env[ga4.propertyIdEnv || "GA4_PROPERTY_ID"];
  if (!credentialsPath || !fs.existsSync(credentialsPath) || !propertyId) {
    add("FAIL", "GA4 Realtime API 配置", `需要 ${ga4.credentialsEnv || "GOOGLE_APPLICATION_CREDENTIALS"} 和 ${ga4.propertyIdEnv || "GA4_PROPERTY_ID"}`);
  } else {
    try {
      const auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: ["https://www.googleapis.com/auth/analytics.readonly"]
      });
      const analyticsdata = google.analyticsdata({ version: "v1beta", auth });
      const waitMs = Math.max(10, ga4.realtimeWaitSeconds || 90) * 1000;
      const deadline = Date.now() + waitMs;
      let report = null;
      let found = false;

      while (Date.now() < deadline && !found) {
        const response = await analyticsdata.properties.runRealtimeReport({
          property: `properties/${propertyId}`,
          requestBody: {
            dimensions: [{ name: "eventName" }],
            metrics: [{ name: "eventCount" }],
            minuteRanges: [{ startMinutesAgo: 29, endMinutesAgo: 0 }]
          }
        });
        report = response.data;
        const rows = report.rows || [];
        found = rows.some((row) => row.dimensionValues?.[0]?.value === testEvent);
        if (!found) await new Promise((resolve) => setTimeout(resolve, 10000));
      }

      const reportFile = path.join(out, "ga4-realtime.json");
      writeJson(reportFile, report || {});
      add(found ? "PASS" : "WARN", "GA4 Realtime API", found ? `实时报告已看到 ${testEvent}` : `等待后仍未看到 ${testEvent}`, reportFile);
    } catch (error) {
      add("FAIL", "GA4 Realtime API", error.message);
    }
  }
} else {
  add("SKIP", "GA4 Realtime API", "config.json 中 ga4.realtimeApiEnabled=false");
  add("MANUAL", "GA4 实时报告人工确认", `登录 ${config.googleAccountHint || "Google 账号"}，确认自己访问及 ${testEvent} 事件`);
}

const result = {
  module: "ga4",
  project: config.projectName,
  siteUrl: config.siteUrl,
  generatedAt: nowIso(),
  detectedMeasurementIds: detectedIds,
  checks,
  requestCount: requests.length
};
writeJson(path.join(out, "ga4-result.json"), result);
console.log(JSON.stringify(result, null, 2));
process.exit(checks.some((item) => item.status === "FAIL") ? 1 : 0);
