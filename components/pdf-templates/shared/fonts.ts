import { Font } from "@react-pdf/renderer";

const FONT_FAMILY = "Noto Sans SC";
let registered = false;

export function registerClientFonts(): void {
  if (registered) return;
  try {
    // Primary: Noto Sans SC with Bold variant
    Font.register({
      family: FONT_FAMILY,
      fonts: [
        { src: "/fonts/NotoSansSC.otf" },
        { src: "/fonts/NotoSansSC-Bold.otf", fontWeight: 700 },
      ],
    });
    Font.register({
      family: `${FONT_FAMILY}-Bold`,
      fonts: [{ src: "/fonts/NotoSansSC-Bold.otf", fontWeight: 700 }],
    });
    registered = true;
  } catch {}
}

export { FONT_FAMILY };
