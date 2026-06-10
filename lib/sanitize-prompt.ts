const MAX_PROMPT_LENGTH = 15000;

export function sanitizePrompt(text: string): string {
  return text
    .replace(/<\|/g, "")           // block special delimiter tokens
    .replace(/system[:：]\s*/gi, "SYS_")  // block role switching
    .replace(/\[INST\]/gi, "")     // block instruction tags
    .replace(/\[\/INST\]/gi, "")
    .slice(0, MAX_PROMPT_LENGTH);
}
