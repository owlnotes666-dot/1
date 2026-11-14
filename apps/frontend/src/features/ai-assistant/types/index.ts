export interface ChatRequest {
  message: string;
  conversation_id?: string | null;
}

export interface ChatUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatSource {
  article_id: string;
  article_title: string;
  chunk_index: number;
  similarity: number;
}

export interface WebSource {
  title: string;
  url: string;
  score: number;
}

export interface ChatResponse {
  conversation_id: string | null;
  message: string;
  provider: string;
  model: string;
  usage: ChatUsage | null;
  sources: ChatSource[];
  web_sources: WebSource[];
}
