import { Router, Request, Response } from 'express';
import { analyzeRequestSchema, generateGameRequestSchema } from '../schemas/syllabus.schema.js';
import { aiService } from '../services/ai.service.js';

export const apiRouter = Router();

// Health check endpoint
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Syllaborn AI Backend',
    serverTime: new Date().toISOString(),
    aiConfigured: aiService.isConfigured(),
    provider: aiService.getProvider(),
    model: aiService.getModelName(),
  });
});

// Helper to extract user-supplied API key from headers or request payload
function extractApiKey(req: Request): string | undefined {
  const headerKey =
    (req.headers['x-gemini-api-key'] as string) ||
    (req.headers['x-ai-api-key'] as string);
  if (headerKey && headerKey.trim() !== '') {
    return headerKey.trim();
  }
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearerKey = authHeader.slice(7).trim();
    if (bearerKey && bearerKey !== 'null' && bearerKey !== 'undefined') {
      return bearerKey;
    }
  }
  if (req.body && typeof req.body.apiKey === 'string' && req.body.apiKey.trim() !== '') {
    return req.body.apiKey.trim();
  }
  return undefined;
}

// Analyze syllabus endpoint
apiRouter.post('/analyze-syllabus', async (req: Request, res: Response) => {
  try {
    const parseResult = analyzeRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      res.status(400).json({
        error: 'Validation Error',
        message: errorMsg,
      });
      return;
    }

    const { text } = parseResult.data;
    const userApiKey = extractApiKey(req);

    if (!aiService.isConfigured(userApiKey)) {
      res.status(503).json({
        error: 'AI Service Unavailable',
        message:
          'AI syllabus analysis is temporarily unavailable. Please retry or create courses and quests manually in Syllaborn!',
      });
      return;
    }

    const extractedData = await aiService.analyzeSyllabus(text, userApiKey);
    res.json({
      success: true,
      data: extractedData,
    });
  } catch (err: any) {
    console.error('Error analyzing syllabus:', err.message || err);
    res.status(500).json({
      error: 'Analysis Failed',
      message: err.message || 'An unexpected error occurred during syllabus analysis.',
    });
  }
});

// Generate game for topic on demand
apiRouter.post('/generate-game', async (req: Request, res: Response) => {
  try {
    const parseResult = generateGameRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      res.status(400).json({
        error: 'Validation Error',
        message: errorMsg,
      });
      return;
    }

    const userApiKey = extractApiKey(req);

    if (!aiService.isConfigured(userApiKey)) {
      res.status(503).json({
        error: 'AI Service Unavailable',
        message: 'AI game generation is temporarily unavailable. Please retry.',
      });
      return;
    }

    const gameConfig = await aiService.generateGameForTopic(parseResult.data, userApiKey);
    res.json({
      success: true,
      data: gameConfig,
    });
  } catch (err: any) {
    console.error('Error generating game:', err.message || err);
    res.status(500).json({
      error: 'Game Generation Failed',
      message: err.message || 'Failed to generate game content for the topic.',
    });
  }
});
