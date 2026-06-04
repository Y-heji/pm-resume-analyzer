// Shared JSON extraction — used by all AI response parsers
export function extractJson(text: string): string {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  let json = codeBlockMatch ? codeBlockMatch[1].trim() : "";
  if (!json) {
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1) throw new Error("No JSON found in response");
    json = text.slice(firstBrace, lastBrace + 1);
  }
  // Sanitize: escape unescaped control characters inside strings
  return json.replace(/("(?:[^"\\]|\\.)*")/g, (match) => {
    return match.replace(/[\x00-\x1f\x7f]/g, (ch) => {
      return "\\u" + ("0000" + ch.charCodeAt(0).toString(16)).slice(-4);
    });
  });
}
