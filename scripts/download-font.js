const https = require("https");
const fs = require("fs");
const path = require("path");

const FONT_URL =
  "https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf";
const OUT_DIR = path.join(__dirname, "..", "public", "fonts");
const OUT_FILE = path.join(OUT_DIR, "NotoSansSC.otf");

if (fs.existsSync(OUT_FILE)) {
  console.log("Font already downloaded, skipping.");
  process.exit(0);
}

console.log("Downloading Chinese font for PDF rendering...");
fs.mkdirSync(OUT_DIR, { recursive: true });

https
  .get(FONT_URL, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      // Follow redirect
      const follow = res.headers.location.startsWith("http")
        ? res.headers.location
        : new URL(res.headers.location, FONT_URL).href;
      https.get(follow, (r2) => pipe(r2));
      return;
    }
    pipe(res);
  })
  .on("error", (err) => {
    console.error("Font download failed:", err.message);
    process.exit(1);
  });

function pipe(res) {
  const total = parseInt(res.headers["content-length"] || "0", 10);
  let downloaded = 0;
  const file = fs.createWriteStream(OUT_FILE);
  res.pipe(file);
  res.on("data", (chunk) => {
    downloaded += chunk.length;
    if (total > 0) {
      process.stdout.write(`\r  ${((downloaded / total) * 100).toFixed(0)}%`);
    }
  });
  file.on("finish", () => {
    console.log(`\nFont saved to ${OUT_FILE}`);
    file.close();
  });
}
