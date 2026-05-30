import OpenAI from "openai";

const config = {
  baseURL: process.env.AI_BASE_URL || "https://api.deepseek.com/v1",
  apiKey: process.env.AI_API_KEY || process.env.DEEPSEEK_API_KEY || "",
  model: process.env.AI_MODEL || "deepseek-chat",
};

let _client: OpenAI | null = null;

export function getAIClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({ baseURL: config.baseURL, apiKey: config.apiKey });
  }
  return _client;
}

export function getAIModel(): string {
  return config.model;
}
