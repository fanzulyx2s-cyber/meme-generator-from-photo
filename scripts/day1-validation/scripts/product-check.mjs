import path from "node:path";
import fs from "node:fs";
import { chromium, devices } from "playwright";
import {
  loadConfig, outputDir, ensureDir, writeJson, nowIso, check,
  relativeToOutput, redact
} from "./lib.mjs";

const { config } = loadConfig();
const out = ensureDir(path.join(outputDir(), "product"));
const checks = [];
const evidence = [];
const timeout = config.product?.timeoutMs || 30000;
const samplePhoto = path.resolve(config.product?.samplePhoto || "assets/sample-photo.png");
const sampleSticker = path.resolve(config.product?.sampleSticker || "assets/sample-sticker.png");
const testLicense = process.env[config.product?.testLicenseEnv || "MEMEPHOTO_TEST_LICENSE_KEY"] || "";

function add(status, name, detail = "", file = "") {
  checks.push(check(status, name, redact(detail), file ? relativeToOutput(file, outputDir()) : ""));
}

async function firstVisible(locators) {
  for (const locator of locators) {
    try {
      if (await locator.count()) {
        const count = await locator.count();
        for (let i = 0; i < count; i += 1) {
          const item = locator.nth(i);
          if (await item.isVisible().catch(() => false)) return item;
        }
      }
    } catch {}
  }
  return null;
}

async function findTextField(page, kind) {
  const rx = kind === "top" ? /top\s*text|top\s*caption/i : /bottom\s*text|bottom\s*caption/i;
  const nameRx = kind === "top" ? /top/i : /bottom/i;
  const candidates = [
    page.getByLabel(rx),
    page.locator(`input[name*="${kind}" i], textarea[name*="${kind}" i]`),
    page.locator(`input[id*="${kind}" i], textarea[id*="${kind}" i]`),
    page.locator(`input[placeholder*="${kind}" i], textarea[placeholder*="${kind}" i]`)
  ];
  const direct = await firstVisible(candidates);
  if (direct) return direct;

  const generic = page.locator('textarea, input[type="text"]:not([type="hidden"])');
  const visible = [];
  for (let i = 0; i < await generic.count(); i += 1) {
    const item = generic.nth(i);
    if (!(await item.isVisible().catch(() => false))) continue;
    const meta = [
      await item.getAttribute("name"),
      await item.getAttribute("id"),
      await item.getAttribute("placeholder"),
      await item.getAttribute("aria-label")
    ].filter(Boolean).join(" ");
    if (nameRx.test(meta)) return item;
    visible.push(item);
  }
  return kind === "top" ? visible[0] || null : visible[1] || null;
}

async function uploadMainPhoto(page) {
  const inputs = page.locator('input[type="file"]');
  if ((await inputs.count()) < 1) throw new Error("没有找到图片上传 input[type=file]");
  await inputs.first().setInputFiles(samplePhoto);
}

async function addSticker(page) {
  const addLogo = await firstVisible([
    page.getByRole("button", { name: /add logo/i }),
    page.getByRole("button", { name: /add image/i }),
    page.getByText(/add logo/i)
  ]);
  if (addLogo) await addLogo.click().catch(() => {});
  const inputs = page.locator('input[type="file"]');
  if ((await inputs.count()) >= 2) {
    await inputs.last().setInputFiles(sampleSticker);
    return true;
  }
  return false;
}

async function addEmoji(page) {
  const addEmojiButton = await firstVisible([
    page.getByRole("button", { name: /add emoji/i }),
    page.getByText(/add emoji/i)
  ]);
  if (addEmojiButton) await addEmojiButton.click().catch(() => {});
  const emoji = await firstVisible([
    page.getByRole("button", { name: /laugh|fire|heart|reaction/i }),
    page.locator("button").filter({ hasText: /😂|🤣|🔥|❤️|💯/ })
  ]);
  if (emoji && emoji !== addEmojiButton) {
    await emoji.click().catch(() => {});
    return true;
  }
  return false;
}

async function selectPortrait(page) {
  const control = await firstVisible([
    page.getByRole("button", { name: /portrait\s*4:5/i }),
    page.getByText(/portrait\s*4:5/i)
  ]);
  if (control) {
    await control.click().catch(() => {});
    return true;
  }
  return false;
}

async function downloadPng(page, fileName) {
  const button = await firstVisible([
    page.getByRole("button", { name: /^download png$/i }),
    page.getByText(/^download png$/i)
  ]);
  if (!button) throw new Error("没有找到 Download PNG 按钮");

  const downloadPromise = page.waitForEvent("download", { timeout }).catch(() => null);
  await button.click();
  const download = await downloadPromise;
  if (!download) return null;
  const target = path.join(out, fileName);
  await download.saveAs(target);
  return target;
}

async function runViewport(browser, mode) {
  const isMobile = mode === "mobile";
  const contextOptions = isMobile
    ? { ...devices["iPhone 13"], acceptDownloads: true }
    : { viewport: { width: 1440, height: 960 }, acceptDownloads: true };

  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  page.setDefaultTimeout(timeout);

  const consoleErrors = [];
  const failedRequests = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("requestfailed", (request) => {
    failedRequests.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText || "failed"}`);
  });

  try {
    const response = await page.goto(config.siteUrl, { waitUntil: "domcontentloaded" });
    add(response?.status() === 200 ? "PASS" : "FAIL", `${mode} 首页打开`, `HTTP ${response?.status() || "unknown"}`);

    const homeShot = path.join(out, `${mode}-home.png`);
    await page.screenshot({ path: homeShot, fullPage: true });
    evidence.push(homeShot);

    await uploadMainPhoto(page);
    add("PASS", `${mode} 上传测试图片`, path.basename(samplePhoto));

    const top = await findTextField(page, "top");
    const bottom = await findTextField(page, "bottom");
    if (!top || !bottom) {
      add("FAIL", `${mode} 填写 Meme 文案`, "未找到 Top Text 或 Bottom Text 输入框");
    } else {
      await top.fill(config.product?.topText || "DAY 1 TEST");
      await bottom.fill(config.product?.bottomText || "EXPORT CHECK");
      add("PASS", `${mode} 填写 Top/Bottom Text`);
    }

    const emojiAdded = await addEmoji(page);
    add(emojiAdded ? "PASS" : "WARN", `${mode} 添加 Emoji`, emojiAdded ? "已尝试添加 Emoji" : "未可靠定位 Emoji 控件，需人工查看截图");

    const stickerAdded = await addSticker(page);
    add(stickerAdded ? "PASS" : "WARN", `${mode} 添加 Logo/图片贴纸`, stickerAdded ? path.basename(sampleSticker) : "未找到第二个文件上传控件");

    const ratioChanged = await selectPortrait(page);
    add(ratioChanged ? "PASS" : "WARN", `${mode} 切换 4:5 比例`, ratioChanged ? "已点击 Portrait 4:5" : "未定位比例控件");

    const editorShot = path.join(out, `${mode}-editor.png`);
    await page.screenshot({ path: editorShot, fullPage: true });
    evidence.push(editorShot);

    const download = await downloadPng(page, `${mode}-free-export.png`).catch((error) => {
      add("FAIL", `${mode} 下载 PNG`, error.message);
      return null;
    });
    if (download && fs.existsSync(download) && fs.statSync(download).size > 0) {
      add("PASS", `${mode} 下载 PNG`, `${fs.statSync(download).size} bytes`, download);
      evidence.push(download);
    }

    if (!isMobile && testLicense) {
      const licenseInput = await firstVisible([
        page.getByLabel(/license key/i),
        page.locator('input[placeholder*="license" i], input[name*="license" i]')
      ]);
      const activate = await firstVisible([
        page.getByRole("button", { name: /activate license/i }),
        page.getByText(/activate license/i)
      ]);
      if (licenseInput && activate) {
        await licenseInput.fill(testLicense);
        await activate.click();
        await page.waitForTimeout(2500);
        const licenseShot = path.join(out, "desktop-license-activation.png");
        await page.screenshot({ path: licenseShot, fullPage: true });
        evidence.push(licenseShot);
        add("PASS", "测试 License 激活操作", "已执行激活并保存截图；不在报告中记录 License 值", licenseShot);

        const creatorDownload = await downloadPng(page, "desktop-creator-export.png").catch(() => null);
        if (creatorDownload) {
          add("PASS", "Creator 模式 PNG 下载", `${fs.statSync(creatorDownload).size} bytes`, creatorDownload);
          evidence.push(creatorDownload);
        } else {
          add("WARN", "Creator 模式 PNG 下载", "激活后未捕获到下载文件");
        }
      } else {
        add("WARN", "测试 License 激活操作", "设置了测试 License，但未找到激活控件");
      }
    } else if (!isMobile) {
      add("SKIP", "测试 License 激活操作", `未设置环境变量 ${config.product?.testLicenseEnv || "MEMEPHOTO_TEST_LICENSE_KEY"}`);
    }

    if (!isMobile && config.product?.allowExternalCheckout) {
      add("MANUAL", "Creem 测试支付", "已允许打开外部结账，但自动填写支付信息默认不执行，避免误触生产付款");
    } else if (!isMobile) {
      add("MANUAL", "Creem 测试支付", "默认不自动打开或提交外部支付；请仅在 Test Mode 人工完成");
    }

    add("MANUAL", `${mode} 水印视觉确认`, "请打开导出的 PNG，确认免费版存在水印；Creator 版在提供测试 License 后确认无水印");
    if (isMobile) add("MANUAL", "真实手机抽测", "移动设备模拟不能替代真实 iPhone/Android 的相册、键盘、触控与下载测试");

    if (consoleErrors.length) {
      add("WARN", `${mode} 浏览器控制台错误`, consoleErrors.slice(0, 10).join(" | "));
    } else {
      add("PASS", `${mode} 浏览器控制台`, "未捕获 error 级别日志");
    }

    if (failedRequests.length) {
      add("WARN", `${mode} 网络请求失败`, failedRequests.slice(0, 10).join(" | "));
    } else {
      add("PASS", `${mode} 网络请求`, "未捕获 requestfailed");
    }
  } catch (error) {
    add("FAIL", `${mode} 产品流程`, error.stack || error.message);
  } finally {
    await context.close();
  }
}

let browser;
try {
  browser = await chromium.launch({ headless: config.product?.headless !== false });
  await runViewport(browser, "desktop");
  await runViewport(browser, "mobile");
} catch (error) {
  add("FAIL", "启动 Playwright Chromium", error.message);
  add("MANUAL", "安装浏览器运行环境", "请运行“安装运行环境.bat”，或执行 playwright install chromium");
} finally {
  if (browser) await browser.close();
}

const result = {
  module: "product",
  project: config.projectName,
  siteUrl: config.siteUrl,
  generatedAt: nowIso(),
  checks,
  evidence: evidence.map((file) => relativeToOutput(file, outputDir()))
};

writeJson(path.join(out, "product-result.json"), result);
console.log(JSON.stringify(result, null, 2));
process.exit(checks.some((item) => item.status === "FAIL") ? 1 : 0);
