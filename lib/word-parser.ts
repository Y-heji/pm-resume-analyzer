import mammoth from "mammoth";

export async function parseWord(buffer: ArrayBuffer): Promise<string> {
  if (buffer.byteLength === 0) {
    throw new Error("Word file is empty");
  }

  const result = await mammoth.extractRawText({
    buffer: Buffer.from(buffer),
  });

  const text = result.value.trim();

  if (!text || text.length < 10) {
    throw new Error(
      "Word 解析结果为空或过短，请确认文件包含文本内容。"
    );
  }

  return text;
}
