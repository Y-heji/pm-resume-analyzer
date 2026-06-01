const https = require("https");
const fs = require("fs");
const path = require("path");

const FONTS = [
  {
    url: "https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf",
    file: "NotoSansSC.otf",
  },
  {
    url: "https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Bold.otf",
    file: "NotoSansSC-Bold.otf",
  },
];

const OUT_DIR = path.join(__dirname, "..", "public", "fonts");

function download(fontUrl, outFile) {
  const outPath = path.join(OUT_DIR, outFile);

  return new Promise((resolve, reject) => {
    if (fs.existsSync(outPath)) {
      console.log(`${outFile} already exists, skipping.`);
      return resolve();
    }

    console.log(`Downloading ${outFile}...`);
    fs.mkdirSync(OUT_DIR, { recursive: true });

    https.get(fontUrl, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const follow = res.headers.location.startsWith("http")
          ? res.headers.location
          : new URL(res.headers.location, fontUrl).href;
        https.get(follow, (r2) => pipe(r2, outPath, resolve, reject));
        return;
      }
      pipe(res, outPath, resolve, reject);
    }).on("error", reject);
  });
}

function pipe(res, outPath, resolve, reject) {
  const total = parseInt(res.headers["content-length"] || "0", 10);
  let downloaded = 0;
  const file = fs.createWriteStream(outPath);
  res.pipe(file);
  res.on("data", (chunk) => {
    downloaded += chunk.length;
    if (total > 0) process.stdout.write(`\r  ${((downloaded / total) * 100).toFixed(0)}%`);
  });
  file.on("finish", () => {
    console.log(`\n  Saved to ${outPath}`);
    file.close();
    resolve();
  });
  res.on("error", reject);
}

async function main() {
  let downloaded = false;
  for (const f of FONTS) {
    if (!fs.existsSync(path.join(OUT_DIR, f.file))) {
      await download(f.url, f.file);
      downloaded = true;
    }
  }
  if (!downloaded) console.log("All fonts already downloaded.");
}

main().catch((err) => {
  console.error("Font download failed:", err.message);
  process.exit(1);
});
