import mammoth from "mammoth";

export async function parseDocx(buffer: ArrayBuffer): Promise<string> {
  if (buffer.byteLength === 0) {
    throw new Error("文件为空，请重新上传");
  }

  try {
    const result = await mammoth.extractRawText({
      buffer: Buffer.from(buffer),
    });

    const text = result.value.trim();

    if (!text || text.length < 10) {
      throw new Error("Word 解析结果为空或过短，请确认文件包含文本内容。");
    }

    return text;
  } catch (err: any) {
    const msg = err?.message || "";
    if (msg.includes("end of central directory") || msg.includes("zip file") || msg.includes("Zip")) {
      throw new Error("文件格式不兼容或已损坏。请确认是有效的 .docx 文件。");
    }
    if (msg.includes("password") || msg.includes("encrypted")) {
      throw new Error("文件已加密或密码保护，请解除保护后重新上传。");
    }
    throw err;
  }
}
