import { Font } from "@react-pdf/renderer";
import path from "path";

const FONT_FAMILY = "Noto Sans SC";
let clientRegistered = false;
let serverRegistered = false;

/** Register fonts for client-side BlobProvider (uses URL paths) */
export function registerClientFonts(): void {
  if (clientRegistered) return;
  try {
    Font.register({
      family: FONT_FAMILY,
      fonts: [
        { src: "/fonts/NotoSansSC.otf" },
        { src: "/fonts/NotoSansSC-Bold.otf", fontWeight: 700 },
      ],
    });
    Font.register({
      family: `${FONT_FAMILY}-Bold`,
      fonts: [{ src: "/fonts/NotoSansSC-Bold.otf" }],
    });
    clientRegistered = true;
  } catch {}
}

/** Register fonts for server-side renderToBuffer (uses filesystem paths) */
export function registerServerFonts(): void {
  if (serverRegistered) return;
  try {
    const dir = path.join(process.cwd(), "public", "fonts");
    const regularPath = path.join(dir, "NotoSansSC.otf");
    const boldPath = path.join(dir, "NotoSansSC-Bold.otf");

    const fs = require("fs");
    if (!fs.existsSync(regularPath)) {
      console.warn("Font not found at", regularPath);
      return;
    }
    const fonts: { src: string; fontWeight?: number }[] = [{ src: regularPath }];
    if (fs.existsSync(boldPath)) fonts.push({ src: boldPath, fontWeight: 700 });

    Font.register({ family: FONT_FAMILY, fonts });
    if (fs.existsSync(boldPath)) {
      Font.register({ family: `${FONT_FAMILY}-Bold`, fonts: [{ src: boldPath }] });
    }
    serverRegistered = true;
  } catch {}
}

export { FONT_FAMILY };
