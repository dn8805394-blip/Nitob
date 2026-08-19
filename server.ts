import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '10mb' }));

  let aiClient: GoogleGenAI | null = null;
  function getGenAI(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Chưa thiết lập GEMINI_API_KEY trên máy chủ.');
    }
    if (!aiClient) {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return aiClient;
  }

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', name: 'Nitob AI Service' });
  });

  // Helper to extract human-readable error messages
  function formatErrorMessage(err: unknown): string {
    if (!err) return 'Đã xảy ra lỗi không xác định.';
    const rawMsg = err instanceof Error ? err.message : String(err);

    if (rawMsg.includes('503') || rawMsg.includes('high demand') || rawMsg.includes('UNAVAILABLE')) {
      return 'Máy chủ AI hiện đang tiếp nhận lượng truy cập cao. Nitob đang tự động chuyển kênh xử lý, vui lòng thử lại sau giây lát.';
    }
    if (rawMsg.includes('429') || rawMsg.includes('RESOURCE_EXHAUSTED')) {
      return 'Đã đạt giới hạn yêu cầu tạm thời. Vui lòng đợi vài giây và thử lại.';
    }
    if (rawMsg.includes('API_KEY') || rawMsg.includes('unauthorized') || rawMsg.includes('403')) {
      return 'Khóa API không hợp lệ hoặc chưa được ủy quyền trên máy chủ.';
    }
    return rawMsg;
  }

  // Secure AI Chat API with Automatic Fallback & Resilient Streaming
  app.post('/api/chat', async (req, res) => {
    try {
      const { messages, stream = true } = req.body;
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: 'Nội dung tin nhắn không hợp lệ.' });
        return;
      }

      let ai: GoogleGenAI;
      try {
        ai = getGenAI();
      } catch (err: unknown) {
        const errorMsg = formatErrorMessage(err);
        res.status(500).json({ error: errorMsg });
        return;
      }

      // Thuật toán cắt giảm sâu tài nguyên & nén ngữ cảnh (Deep Context Compression & Token Pruning)
      // 1. Chỉ giữ tối đa 4 lượt tin nhắn gần nhất (2 cặp Q&A)
      const rawRecent = messages.slice(-4);

      // 2. Nén và làm sạch ngữ cảnh để giảm thiểu 60-80% token đầu vào
      const contents = rawRecent.map((m: { role: string; content: string }, index: number) => {
        let text = (m.content || '').trim().replace(/\n{3,}/g, '\n\n');
        
        // Nếu là tin nhắn cũ trong lịch sử và quá dài, cắt tỉa giữ lại phần cốt lõi
        const isLatest = index === rawRecent.length - 1;
        if (!isLatest && text.length > 300) {
          text = text.slice(0, 300) + '... [tóm lược ngữ cảnh]';
        }

        return {
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text }],
        };
      });

      // Chỉ thị mật độ thông tin cao nhất, triệt tiêu hoàn toàn từ ngữ dư thừa
      const systemInstruction = 
        `Bạn là Nitob Lite - AI tinh gọn tối đa.\n` +
        `QUY TẮC BẮT BUỘC:\n` +
        `- Đi thẳng 100% vào câu trả lời, đúng trọng tâm nhất có thể.\n` +
        `- Tuyệt đối KHÔNG chào hỏi, rào đón, giải thích dông dài hoặc kết bài.\n` +
        `- Trình bày dạng bullet points ngắn hoặc câu cô đọng.\n` +
        `- Tiết kiệm tối đa token cho hệ thống.`;

      // Candidate models for high availability fallback
      const candidateModels = [
        'gemini-3.7-flash',
        'gemini-flash-latest',
        'gemini-2.5-flash',
      ];

      const modelConfig = {
        systemInstruction,
        temperature: 0.2, // Nhiệt độ thấp giúp AI trả lời chuẩn xác, không lan man
        topP: 0.8,
        maxOutputTokens: 650, // Giới hạn token đầu ra chặt chẽ để chống lãng phí
      };

      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');

        let streamSuccess = false;
        let lastError: unknown = null;

        for (const model of candidateModels) {
          try {
            const responseStream = await ai.models.generateContentStream({
              model,
              contents,
              config: modelConfig,
            });

            for await (const chunk of responseStream) {
              const textChunk = chunk.text || '';
              if (textChunk) {
                res.write(`data: ${JSON.stringify({ text: textChunk })}\n\n`);
              }
            }

            streamSuccess = true;
            break; // Finished successfully
          } catch (modelErr: unknown) {
            console.warn(`Model ${model} failed, attempting fallback...`, modelErr);
            lastError = modelErr;
            // Short delay before fallback retry
            await new Promise((r) => setTimeout(r, 400));
          }
        }

        if (streamSuccess) {
          res.write('data: [DONE]\n\n');
        } else {
          const formattedErr = formatErrorMessage(lastError);
          res.write(`data: ${JSON.stringify({ error: formattedErr })}\n\n`);
        }
        res.end();
      } else {
        let responseText = '';
        let lastError: unknown = null;

        for (const model of candidateModels) {
          try {
            const response = await ai.models.generateContent({
              model,
              contents,
              config: modelConfig,
            });
            responseText = response.text || '';
            break;
          } catch (modelErr: unknown) {
            console.warn(`Non-stream model ${model} failed, attempting fallback...`, modelErr);
            lastError = modelErr;
            await new Promise((r) => setTimeout(r, 400));
          }
        }

        if (responseText) {
          res.json({ reply: responseText });
        } else {
          res.status(503).json({ error: formatErrorMessage(lastError) });
        }
      }
    } catch (error: unknown) {
      console.error('Lỗi khi gọi API Nitob:', error);
      const errMsg = formatErrorMessage(error);
      if (!res.headersSent) {
        res.status(500).json({ error: errMsg });
      }
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nitob server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
