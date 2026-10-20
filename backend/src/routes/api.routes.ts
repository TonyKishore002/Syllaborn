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

    if (!aiService.isConfigured()) {
      res.status(503).json({
        error: 'AI Provider Not Configured',
        message:
          'AI API Key is missing. Please set GEMINI_API_KEY (or OPENAI_API_KEY) in backend/.env to enable automated AI syllabus analysis. You can still manually create and manage courses and quests in Syllaborn!',
      });
      return;
    }

    const extractedData = await aiService.analyzeSyllabus(text);
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

    if (!aiService.isConfigured()) {
      res.status(503).json({
        error: 'AI Provider Not Configured',
        message: 'AI API Key is missing. Please set GEMINI_API_KEY in backend/.env.',
      });
      return;
    }

    const gameConfig = await aiService.generateGameForTopic(parseResult.data);
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
