import path from "node:path";
import fs from "node:fs";
import * as cheerio from "cheerio";
import { google } from "googleapis";
import {
  loadConfig, outputDir, ensureDir, writeJson, writeText, nowIso,
  check, mergeUrl, fetchWithTimeout, relativeToOutput, redact
} from "./lib.mjs";

const { config } = loadConfig();
const out = ensureDir(path.join(outputDir(), "seo"));
const checks = [];
const pageResults = [];
const timeout = 25000;

function add(status, name, detail = "", file = "") {
  checks.push(check(status, name, redact(detail), file ? relativeToOutput(file, outputDir()) : ""));
}

function metaContent($, selector) {
  return ($(selector).first().attr("content") || "").trim();
}

async function inspectPage(route, expectedNoindex = false) {
  const url = mergeUrl(config.siteUrl, route);
  try {
    const response = await fetchWithTimeout(url, { redirect: "follow" }, timeout);
    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $("title").first().text().trim();
    const description = metaContent($, 'meta[name="description"]');
    const robots = metaContent($, 'meta[name="robots"]').toLowerCase();
    const googlebot = metaContent($, 'meta[name="googlebot"]').toLowerCase();
    const canonical = ($('link[rel="canonical"]').first().attr("href") || "").trim();
    const ogTitle = metaContent($, 'meta[property="og:title"]');
    const ogDescription = metaContent($, 'meta[property="og:description"]');
    const ogImage = metaContent($, 'meta[property="og:image"]');
    const twitterCard = metaContent($, 'meta[name="twitter:card"]');
    const h1 = $("h1").map((_, el) => $(el).text().trim()).get();
    const h2 = $("h2").map((_, el) => $(el).text().trim()).get();
    const h3 = $("h3").map((_, el) => $(el).text().trim()).get();

    const result = {
      route, url, status: response.status, finalUrl: response.url,
      title, description, robots, googlebot, canonical,
      ogTitle, ogDescription, ogImage, twitterCard,
      h1, h2Count: h2.length, h3Count: h3.length
    };
    pageResults.push(result);

    add(response.status === 200 ? "PASS" : "FAIL", `${route} HTTP 状态`, `HTTP ${response.status}`);
    add(title ? "PASS" : "FAIL", `${route} Title`, title || "缺失");
    add(description ? "PASS" : "WARN", `${route} Meta Description`, description || "缺失");
    add(h1.length === 1 ? "PASS" : "WARN", `${route} H1 数量`, `${h1.length} 个${h1.length ? `：${h1.join(" | ")}` : ""}`);
    add(canonical ? "PASS" : "WARN", `${route} Canonical`, canonical || "缺失");

    if (canonical) {
      let canonicalHost = "";
      try { canonicalHost = new URL(canonical, url).hostname; } catch {}
      add(
        canonicalHost === config.expectedCanonicalHost ? "PASS" : "FAIL",
        `${route} Canonical 主域名`,
        canonical
      );
    }

    const isNoindex = robots.includes("noindex") || googlebot.includes("noindex");
    if (expectedNoindex) {
      add(isNoindex ? "PASS" : "FAIL", `${route} noindex`, isNoindex ? "已设置" : "未检测到 noindex");
    } else {
      add(isNoindex ? "FAIL" : "PASS", `${route} 可索引状态`, isNoindex ? "意外 noindex" : "未设置 noindex");
    }

    add(ogTitle && ogDescription ? "PASS" : "WARN", `${route} Open Graph`, `title=${Boolean(ogTitle)}, description=${Boolean(ogDescription)}, image=${Boolean(ogImage)}`);
    add(twitterCard ? "PASS" : "WARN", `${route} Twitter Card`, twitterCard || "缺失");

    return { html, $ };
  } catch (error) {
    add("FAIL", `${route} 页面抓取`, error.message);
    pageResults.push({ route, url, error: error.message });
    return null;
  }
}

for (const route of config.publicPages || ["/"]) {
  await inspectPage(route, false);
}
for (const route of config.noindexPages || []) {
  await inspectPage(route, true);
}

const titles = new Map();
const descriptions = new Map();
for (const page of pageResults) {
  if (page.title) titles.set(page.title, [...(titles.get(page.title) || []), page.route]);
  if (page.description) descriptions.set(page.description, [...(descriptions.get(page.description) || []), page.route]);
}
for (const [title, routes] of titles) {
  if (routes.length > 1) add("WARN", "重复 Title", `${routes.join(", ")}：${title}`);
}
for (const [, routes] of descriptions) {
  if (routes.length > 1) add("WARN", "重复 Meta Description", `${routes.join(", ")}`);
}

let robotsText = "";
try {
  const response = await fetchWithTimeout(config.robotsUrl, {}, timeout);
  robotsText = await response.text();
  const robotsFile = path.join(out, "robots.txt");
  writeText(robotsFile, robotsText);
  add(response.status === 200 ? "PASS" : "FAIL", "robots.txt HTTP 状态", `HTTP ${response.status}`, robotsFile);
  const blocksAll = /User-agent:\s*\*[\s\S]*?Disallow:\s*\/\s*(?:\r?\n|$)/i.test(robotsText);
  add(blocksAll ? "FAIL" : "PASS", "robots.txt 未全站屏蔽", blocksAll ? "发现 Disallow: /" : "未发现全站屏蔽");
  const sitemapDeclared = /Sitemap:\s*https?:\/\/\S+/i.test(robotsText);
  add(sitemapDeclared ? "PASS" : "WARN", "robots.txt 声明 Sitemap", sitemapDeclared ? robotsText.match(/Sitemap:\s*https?:\/\/\S+/i)?.[0] : "未发现 Sitemap 声明");
} catch (error) {
  add("FAIL", "robots.txt 抓取", error.message);
}

let sitemapUrls = [];
try {
  const response = await fetchWithTimeout(config.sitemapUrl, {}, timeout);
  const xml = await response.text();
  const sitemapFile = path.join(out, "sitemap.xml");
  writeText(sitemapFile, xml);
  add(response.status === 200 ? "PASS" : "FAIL", "sitemap.xml HTTP 状态", `HTTP ${response.status}`, sitemapFile);

  const $xml = cheerio.load(xml, { xmlMode: true });
  sitemapUrls = $xml("url > loc").map((_, el) => $xml(el).text().trim()).get();
  add(sitemapUrls.length ? "PASS" : "FAIL", "sitemap URL 数量", `${sitemapUrls.length} 个`);

  const duplicates = sitemapUrls.filter((url, i) => sitemapUrls.indexOf(url) !== i);
  add(duplicates.length ? "WARN" : "PASS", "sitemap 重复 URL", duplicates.length ? [...new Set(duplicates)].join(", ") : "无重复");

  const badHost = sitemapUrls.filter((url) => {
    try { return new URL(url).hostname !== config.expectedCanonicalHost; } catch { return true; }
  });
  add(badHost.length ? "FAIL" : "PASS", "sitemap 主域名统一", badHost.length ? badHost.join(", ") : config.expectedCanonicalHost);

  for (const route of config.publicPages || []) {
    const url = mergeUrl(config.siteUrl, route);
    add(sitemapUrls.includes(url) ? "PASS" : "WARN", `sitemap 包含 ${route}`, sitemapUrls.includes(url) ? url : "未包含");
  }
  for (const route of config.noindexPages || []) {
    const url = mergeUrl(config.siteUrl, route);
    add(sitemapUrls.includes(url) ? "FAIL" : "PASS", `sitemap 排除 ${route}`, sitemapUrls.includes(url) ? "不应收录但已出现" : "未包含");
  }

  for (const url of sitemapUrls.slice(0, 100)) {
    try {
      const page = await fetchWithTimeout(url, { redirect: "follow" }, timeout);
      add(page.status === 200 ? "PASS" : "FAIL", `sitemap URL 可访问`, `${page.status} ${url}`);
    } catch (error) {
      add("FAIL", "sitemap URL 抓取失败", `${url}：${error.message}`);
    }
  }
} catch (error) {
  add("FAIL", "sitemap.xml 抓取或解析", error.message);
}

async function checkRedirect(source, expectedHost, expectedProtocol = "https:") {
  try {
    const response = await fetchWithTimeout(source, { redirect: "manual" }, timeout);
    const location = response.headers.get("location") || "";
    const redirectOk = [301, 302, 307, 308].includes(response.status) && location;
    if (!redirectOk) {
      add("WARN", `${source} 重定向`, `HTTP ${response.status}，Location=${location || "无"}`);
      return;
    }
    const target = new URL(location, source);
    const ok = target.hostname === expectedHost && target.protocol === expectedProtocol;
    add(ok ? "PASS" : "FAIL", `${source} 重定向`, `${response.status} → ${target.toString()}`);
  } catch (error) {
    add("WARN", `${source} 重定向检查`, error.message);
  }
}
await checkRedirect("http://memephotoai.com/", "memephotoai.com");
await checkRedirect("https://www.memephotoai.com/", "memephotoai.com");

const random404 = mergeUrl(config.siteUrl, `/day1-validation-not-found-${Date.now()}`);
try {
  const response = await fetchWithTimeout(random404, { redirect: "manual" }, timeout);
  add(response.status === 404 ? "PASS" : "FAIL", "随机 URL 返回真实 404", `HTTP ${response.status}`);
} catch (error) {
  add("WARN", "404 检查", error.message);
}

try {
  const homeResponse = await fetchWithTimeout(config.siteUrl, {}, timeout);
  const homeHtml = await homeResponse.text();
  const $ = cheerio.load(homeHtml);
  const internal = new Set();
  $("a[href]").each((_, el) => {
    const href = ($(el).attr("href") || "").trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return;
    try {
      const url = new URL(href, config.siteUrl);
      if (url.hostname === config.expectedCanonicalHost) internal.add(url.toString().split("#")[0]);
    } catch {}
  });

  add(internal.size ? "PASS" : "WARN", "首页可抓取内部链接", `${internal.size} 个`);
  for (const url of [...internal].slice(0, 50)) {
    try {
      const response = await fetchWithTimeout(url, { redirect: "follow" }, timeout);
      add(response.status < 400 ? "PASS" : "FAIL", "内部链接状态", `${response.status} ${url}`);
    } catch (error) {
      add("FAIL", "内部链接抓取失败", `${url}：${error.message}`);
    }
  }
} catch (error) {
  add("WARN", "内部链接检查", error.message);
}

const gsc = config.gsc || {};
if (gsc.apiEnabled) {
  const credentialsPath = process.env[gsc.credentialsEnv || "GOOGLE_APPLICATION_CREDENTIALS"];
  if (!credentialsPath || !fs.existsSync(credentialsPath)) {
    add("FAIL", "GSC API 凭据", `未找到环境变量 ${gsc.credentialsEnv || "GOOGLE_APPLICATION_CREDENTIALS"} 指向的文件`);
  } else {
    try {
      const auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: ["https://www.googleapis.com/auth/webmasters"]
      });
      const searchconsole = google.searchconsole({ version: "v1", auth });
      if (gsc.submitSitemap) {
        await searchconsole.sitemaps.submit({
          siteUrl: gsc.siteUrl,
          feedpath: config.sitemapUrl
        });
        add("PASS", "GSC 提交 Sitemap", `${gsc.siteUrl} ← ${config.sitemapUrl}`);
      }
      const response = await searchconsole.sitemaps.get({
        siteUrl: gsc.siteUrl,
        feedpath: config.sitemapUrl
      });
      const gscFile = path.join(out, "gsc-sitemap-status.json");
      writeJson(gscFile, response.data);
      add("PASS", "GSC Sitemap 状态读取", `errors=${response.data.errors || 0}, warnings=${response.data.warnings || 0}`, gscFile);
    } catch (error) {
      add("FAIL", "GSC API", error.message);
    }
  }
} else {
  add("SKIP", "GSC API 提交与状态读取", "config.json 中 gsc.apiEnabled=false");
}
add("MANUAL", "GSC 域名首次验证", `使用 ${config.googleAccountHint || "你的 Google 账号"} 完成 DNS 验证；只需首次执行`);
add("MANUAL", "GSC 首页请求编入索引", "普通网站首页不能依赖 Indexing API 自动请求；请在 URL 检查中人工操作");

const result = {
  module: "seo",
  project: config.projectName,
  siteUrl: config.siteUrl,
  generatedAt: nowIso(),
  checks,
  pages: pageResults,
  sitemapUrls
};
writeJson(path.join(out, "seo-result.json"), result);
console.log(JSON.stringify(result, null, 2));
process.exit(checks.some((item) => item.status === "FAIL") ? 1 : 0);
