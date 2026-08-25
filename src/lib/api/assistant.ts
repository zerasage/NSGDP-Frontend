import { getAccessToken } from '@/lib/utils/token-storage';
import { ApiError } from './client';
import type { ApiResponse } from '../types/common';

export interface AssistantChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantSourceLink {
  label: string;
  href: string;
}

export interface AssistantChatRequest {
  messages: AssistantChatMessage[];
  conversationId?: string;
}

export interface AssistantChatResponse {
  reply: string;
  links?: AssistantSourceLink[];
  conversationId?: string;
  unavailable?: boolean;
  reason?: string;
}

export type AssistantChatStreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'status'; text: string }
  | {
      type: 'done';
      reply: string;
      links?: AssistantSourceLink[];
      conversationId?: string;
      unavailable?: boolean;
      reason?: string;
    }
  | { type: 'error'; message: string; conversationId?: string };

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

export async function sendAssistantChat(
  body: AssistantChatRequest,
): Promise<AssistantChatResponse> {
  const accessToken = getAccessToken();
  const res = await fetch(`${BASE_URL}/ai/chat`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json();
      message = data?.message ?? message;
    } catch {
      // non-JSON body
    }
    throw new ApiError(res.status, message);
  }

  const json = (await res.json()) as ApiResponse<AssistantChatResponse>;
  return json.data;
}

export async function streamAssistantChat(
  body: AssistantChatRequest,
  onEvent: (event: AssistantChatStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const accessToken = getAccessToken();
  const res = await fetch(`${BASE_URL}/ai/chat/stream`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json();
      message = data?.message ?? message;
    } catch {
      // non-JSON body
    }
    throw new ApiError(res.status, message);
  }

  const reader = res.body?.getReader();
  if (!reader) {
    throw new ApiError(502, 'Streaming response unavailable');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';

    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith('data:')) continue;
      const payload = line.replace(/^data:\s*/, '');
      if (!payload) continue;
      try {
        onEvent(JSON.parse(payload) as AssistantChatStreamEvent);
      } catch {
        // ignore malformed chunks
      }
    }
  }
}
