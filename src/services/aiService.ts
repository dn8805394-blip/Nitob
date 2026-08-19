/**
 * Nitob AI Hybrid Service Engine
 * Ưu tiên:
 * 1. Gemini Nano On-Device (Chrome Prompt API) - 100% Không cần API Key, chạy trực tiếp trên máy.
 * 2. Backend Proxy API (/api/chat) - Dành cho trình duyệt chưa kích hoạt Gemini Nano.
 */

export interface ChatMessagePayload {
  role: 'user' | 'assistant';
  content: string;
}

export interface StreamCallbacks {
  onChunk: (textChunk: string) => void;
  onError: (errorMessage: string) => void;
  onDone: () => void;
}

// Kiểm tra xem trình duyệt có hỗ trợ Gemini Nano On-Device không
export async function checkGeminiNanoAvailable(): Promise<{
  available: boolean;
  status: 'readily' | 'after-download' | 'no' | 'unsupported';
}> {
  try {
    const ai = (window as unknown as { ai?: { languageModel?: { capabilities: () => Promise<{ available: string }> } } }).ai;
    if (ai && ai.languageModel) {
      const caps = await ai.languageModel.capabilities();
      if (caps.available === 'readily') {
        return { available: true, status: 'readily' };
      }
      if (caps.available === 'after-download') {
        return { available: true, status: 'after-download' };
      }
      return { available: false, status: 'no' };
    }
  } catch {
    // Không hỗ trợ
  }
  return { available: false, status: 'unsupported' };
}

/**
 * Gửi tin nhắn qua Gemini Nano On-Device (Không tốn token, không cần API Key)
 */
async function streamWithGeminiNano(
  prompt: string,
  systemPrompt: string,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<boolean> {
  try {
    const ai = (window as unknown as { 
      ai?: { 
        languageModel?: { 
          create: (options?: { systemPrompt?: string }) => Promise<{
            promptStreaming: (input: string, options?: { signal?: AbortSignal }) => AsyncIterable<string>;
            destroy?: () => void;
          }> 
        } 
      } 
    }).ai;

    if (!ai?.languageModel) return false;

    const session = await ai.languageModel.create({
      systemPrompt,
    });

    const stream = session.promptStreaming(prompt, { signal });
    let previousText = '';

    for await (const chunk of stream) {
      if (signal?.aborted) break;
      // Prompt API có thể trả về toàn bộ văn bản lũy tích hoặc từng phần
      const newChunk = chunk.startsWith(previousText) ? chunk.slice(previousText.length) : chunk;
      previousText = chunk;
      if (newChunk) {
        callbacks.onChunk(newChunk);
      }
    }

    if (session.destroy) {
      session.destroy();
    }

    callbacks.onDone();
    return true;
  } catch (err: unknown) {
    console.warn('Gemini Nano On-Device stream failed, switching fallback:', err);
    return false;
  }
}

/**
 * Gửi tin nhắn qua Backend Proxy API
 */
async function streamWithBackend(
  messages: ChatMessagePayload[],
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, stream: true }),
    signal,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Máy chủ phản hồi mã lỗi ${response.status}`);
  }

  if (!response.body) {
    throw new Error('Không nhận được dữ liệu phản hồi từ máy chủ.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.replace('data: ', '').trim();
          if (dataStr === '[DONE]') {
            callbacks.onDone();
            return;
          }
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.error) {
              callbacks.onError(parsed.error);
            } else if (parsed.text) {
              callbacks.onChunk(parsed.text);
            }
          } catch {}
        }
      }
    }
  } finally {
    callbacks.onDone();
  }
}

/**
 * Hàm điều phối chính
 */
export async function sendChatMessage(
  messages: ChatMessagePayload[],
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const latestMessage = messages[messages.length - 1]?.content || '';
  const systemInstruction = 
    `Bạn là Nitob Lite - AI tinh gọn tối đa. Trả lời thẳng vào trọng tâm câu hỏi, ngắn gọn, súc tích và chuẩn xác. Không chào hỏi rào đón.`;

  // 1. Thử nghiệm Gemini Nano On-Device trước
  const nanoStatus = await checkGeminiNanoAvailable();
  if (nanoStatus.available) {
    const success = await streamWithGeminiNano(latestMessage, systemInstruction, callbacks, signal);
    if (success) return;
  }

  // 2. Fallback sang backend nếu trình duyệt chưa kích hoạt On-Device
  await streamWithBackend(messages, callbacks, signal);
}
