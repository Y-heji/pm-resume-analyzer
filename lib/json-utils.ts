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
  return repairJSON(json);
}

export function repairJSON(json: string): string {
  // 1. Strip trailing commas: {"a":1,} → {"a":1}
  json = json.replace(/,(\s*[}\]])/g, '$1');

  // 2. Fix unquoted keys: {key: → {"key": and ,key: → ,"key":
  json = json.replace(/([{,]\s*)([a-zA-Z_一-鿿][a-zA-Z0-9_一-鿿]*)\s*:/g, '$1"$2":');

  // 3. Close any unmatched braces/brackets
  const closeStack: string[] = [];
  let inString = false, escape = false;
  for (const ch of json) {
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"' && !escape) { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') closeStack.push('}');
    if (ch === '[') closeStack.push(']');
    if (ch === '}') { if (closeStack[closeStack.length-1]==='}') closeStack.pop(); }
    if (ch === ']') { if (closeStack[closeStack.length-1]===']') closeStack.pop(); }
  }

  // 4. If truncated mid-string, close it
  let inStr = false, esc = false;
  for (let i = 0; i < json.length; i++) {
    if (esc) { esc = false; continue; }
    if (json[i] === '\\' && inStr) { esc = true; continue; }
    if (json[i] === '"' && !esc) inStr = !inStr;
  }
  const suffix = (inStr ? '"' : '') + closeStack.reverse().join('');

  return json + suffix;
}
