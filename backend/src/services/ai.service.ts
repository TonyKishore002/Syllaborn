import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import {
  syllabusExtractionResponseSchema,
  SyllabusExtractionResponse,
  questGameConfigSchema,
  QuestGameConfig,
  GenerateGameRequest,
} from '../schemas/syllabus.schema.js';

export class AIService {
  private geminiClient: GoogleGenAI | null = null;
  private openAiClient: OpenAI | null = null;
  private provider: 'gemini' | 'openai' | 'none' = 'none';
  private model: string = 'gemini-3.5-flash-lite';

  constructor() {
    this.initClient();
  }

  private initClient(): void {
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const openAiKey = process.env.OPENAI_API_KEY;

    if (geminiKey && geminiKey.trim() !== '' && geminiKey !== 'your_gemini_api_key_here') {
      this.geminiClient = new GoogleGenAI({ apiKey: geminiKey });
      this.provider = 'gemini';
      this.model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    } else if (openAiKey && openAiKey.trim() !== '' && openAiKey !== 'your_openai_api_key_here') {
      this.openAiClient = new OpenAI({ apiKey: openAiKey });
      this.provider = 'openai';
      this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    } else {
      this.geminiClient = null;
      this.openAiClient = null;
      this.provider = 'none';
    }
  }

  public isConfigured(): boolean {
    if (this.provider === 'none') {
      this.initClient();
    }
    return this.provider !== 'none';
  }

  public getProvider(): string {
    if (this.provider === 'none') {
      this.initClient();
    }
    return this.provider;
  }

  public getModelName(): string {
    if (this.provider === 'none') {
      this.initClient();
    }
    return this.model;
  }

  public async analyzeSyllabus(text: string): Promise<SyllabusExtractionResponse> {
    if (this.provider === 'none') {
      this.initClient();
    }
    if (this.provider === 'none') {
      throw new Error(
        'AI key is not configured on the backend. Please add GEMINI_API_KEY to backend/.env and restart the backend server.'
      );
    }

    const systemPrompt = `You are an expert academic syllabus analyzer and educational game world architect for university courses.
Your job is to read raw extracted text from a course syllabus document and extract structured course, unit, topic, assessment information, and GENERATE PLAYABLE EDUCATIONAL GAME CHALLENGES for each topic and assessment into strict JSON.

CRITICAL ARCHITECTURE RULES:
1. COURSE -> REGION: Extract course_name, course_code, instructor_name, semester, and create an epic RPG fantasy "region_name" (e.g., "Forest of Infinite Loops", "Citadel of Deadlocks", "Spire of Ancient Axioms").
2. UNITS -> LOCATIONS: Extract all units/modules taught in the course into "units". For each unit, generate a thematic RPG "location_name".
3. TOPICS -> QUESTS WITH MINI-GAMES: Inside each unit, extract the covered curriculum topics.
   For EVERY topic, you MUST generate:
   - "title": Clean topic name from syllabus.
   - "quest_title": An engaging RPG quest title (e.g. "Deciphering Pointer Arithmetic", "Taming the Recursive Beast").
   - "description": 1-2 sentence academic summary.
   - "game_mode": Intelligently select one of:
     * "do-or-die": 2D survival platformer checkpoints with multiple choice survival hurdles.
     * "quiz-battle": combat game where correct answers damage a course topic monster.
     * "puzzle-quest": interactive matching or ordering puzzle (use when the topic has clear sequential steps, algorithms, procedures, or term-definition pairs).
   - "difficulty": "easy" | "medium" | "hard"
   - "questions": Array of 3 to 4 challenging multiple-choice questions GROUDED DIRECTLY in the specific subject matter of this topic.
     * Each question MUST have:
       - "id": unique string
       - "question": Direct academic question about this specific syllabus topic.
       - "options": Array of 4 distinct choices.
       - "correctAnswerIndex": Integer (0, 1, 2, or 3) pointing to the single correct option.
       - "explanation": Educational explanation of why the answer is correct and why other options are incorrect.
       - "hint": A helpful academic clue without giving away the direct answer.
   - "puzzle_data": If game_mode is "puzzle-quest", provide:
     * Either "type": "matching" with 3-4 "pairs": [{ "id": "p1", "left": "Concept", "right": "Definition/Behavior" }]
     * Or "type": "ordering" with 3-4 "steps": [{ "id": "s1", "order": 1, "text": "Step description" }]
4. ASSESSMENTS -> BOSS FIGHTS:
   Extract all midterms, final exams, and major projects into "assessments".
   For EVERY assessment:
   - "title": Clean exam title (e.g. "Midterm Exam 1", "Final Examination").
   - "boss_name": Epic boss moniker (e.g. "The Midterm Colossus", "Overlord of Final Synthesis").
   - "type": "midterm" | "final_exam" | "quiz" | "project" | "assignment" | "other"
   - "weight_percent": Number (e.g. 30) or null if not stated.
   - "due_date": "YYYY-MM-DD" or null.
   - "boss_hp": weight_percent * 10 (or 200 default).
   - "questions": Array of 4 to 6 comprehensive exam-level questions spanning the course topics, with 4 options, correctAnswerIndex (0-3), explanation, and hint.
5. NO INVENTED FACTS: Base all questions and topics on the real syllabus subject matter. Do not fabricate dates or weights.
6. BACKWARD COMPATIBILITY: Also populate "grading_structure", "milestones", and "policies".

OUTPUT JSON FORMAT:
{
  "course_name": string | null,
  "course_code": string | null,
  "instructor_name": string | null,
  "semester": string | null,
  "region_name": string,
  "units": [
    {
      "unit_number": number,
      "title": string,
      "location_name": string,
      "description": string,
      "topics": [
        {
          "title": string,
          "quest_title": string,
          "description": string,
          "game_mode": "do-or-die" | "quiz-battle" | "puzzle-quest",
          "difficulty": "easy" | "medium" | "hard",
          "questions": [
            {
              "id": string,
              "question": string,
              "options": [string, string, string, string],
              "correctAnswerIndex": number,
              "explanation": string,
              "hint": string
            }
          ],
          "puzzle_data": {
            "type": "matching" | "ordering",
            "prompt": string,
            "pairs": [{ "id": string, "left": string, "right": string }],
            "steps": [{ "id": string, "order": number, "text": string }]
          } | null
        }
      ]
    }
  ],
  "assessments": [
    {
      "title": string,
      "boss_name": string,
      "type": "midterm" | "final_exam" | "quiz" | "project" | "assignment" | "other",
      "weight_percent": number | null,
      "due_date": string | null,
      "due_time": string | null,
      "boss_hp": number | null,
      "evidence": string | null,
      "questions": [
        {
          "id": string,
          "question": string,
          "options": [string, string, string, string],
          "correctAnswerIndex": number,
          "explanation": string,
          "hint": string
        }
      ]
    }
  ],
  "grading_structure": [
    {
      "name": string,
      "weight_percent": number,
      "source_page": number | null,
      "evidence": string | null
    }
  ],
  "milestones": [
    {
      "title": string,
      "description": string,
      "type": "midterm" | "final_exam" | "quiz" | "project" | "assignment" | "other",
      "weight_percent": number | null,
      "due_date": string | null,
      "due_time": string | null,
      "source_page": number | null,
      "evidence": string | null,
      "confidence": number
    }
  ],
  "policies": [
    {
      "title": string,
      "description": string,
      "source_page": number | null,
      "evidence": string | null
    }
  ],
  "warnings": [string]
}`;

    let responseContent: string | null = null;

    if (this.provider === 'gemini' && this.geminiClient) {
      const response = await this.geminiClient.models.generateContent({
        model: this.model,
        contents: `Here is the extracted text from the syllabus PDF to analyze and forge into games:\n\n---\n${text.slice(0, 100000)}\n---`,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });
      responseContent = response.text || null;
    } else if (this.provider === 'openai' && this.openAiClient) {
      const completion = await this.openAiClient.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Here is the extracted text from the syllabus PDF to analyze and forge into games:\n\n---\n${text.slice(0, 100000)}\n---`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      });
      responseContent = completion.choices[0]?.message?.content || null;
    }

    if (!responseContent) {
      throw new Error('AI returned an empty response.');
    }

    let parsedJson: any;
    try {
      parsedJson = JSON.parse(responseContent);
    } catch {
      throw new Error('Failed to parse AI output as JSON.');
    }

    // Sanitize and validate questions and indices
    this.sanitizeExtractedGames(parsedJson);

    const validation = syllabusExtractionResponseSchema.safeParse(parsedJson);
    if (!validation.success) {
      const issues = validation.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      throw new Error(`AI response failed schema validation: ${issues}`);
    }

    return validation.data;
  }

  /**
   * On-demand game generator for a single quest topic
   */
  public async generateGameForTopic(req: GenerateGameRequest): Promise<QuestGameConfig> {
    if (this.provider === 'none') {
      this.initClient();
    }
    if (this.provider === 'none') {
      throw new Error('AI key is not configured on the backend.');
    }

    const systemPrompt = `You are an educational game designer. Generate a rich, syllabus-grounded mini-game challenge for the university course topic: "${req.topicTitle}" (Course: ${req.courseName || 'Academic Course'}).

Output strict JSON matching:
{
  "topic": "${req.topicTitle}",
  "gameMode": "${req.preferredGameMode || 'quiz-battle'}",
  "difficulty": "easy",
  "questions": [
    {
      "id": "q1",
      "question": "Clear, direct academic question on this topic",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswerIndex": 0,
      "explanation": "Why Option 1 is correct",
      "hint": "Helpful educational hint"
    }
  ],
  "puzzleData": null
}

Rules:
- Generate 3 to 4 high-quality questions specifically about "${req.topicTitle}".
- correctAnswerIndex MUST be 0, 1, 2, or 3.
- Options must be distinct.
- If gameMode is puzzle-quest, provide puzzleData with either matching pairs or sequential steps.`;

    let responseContent: string | null = null;
    if (this.provider === 'gemini' && this.geminiClient) {
      const response = await this.geminiClient.models.generateContent({
        model: this.model,
        contents: `Generate game content for topic: ${req.topicTitle}\nCourse: ${req.courseName || ''}\nExcerpt: ${req.syllabusExcerpt || ''}`,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });
      responseContent = response.text || null;
    } else if (this.provider === 'openai' && this.openAiClient) {
      const completion = await this.openAiClient.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate game content for topic: ${req.topicTitle}` },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });
      responseContent = completion.choices[0]?.message?.content || null;
    }

    if (!responseContent) {
      throw new Error('AI returned an empty response.');
    }

    const parsed = JSON.parse(responseContent);
    if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error('AI failed to generate valid questions.');
    }

    // Sanitize questions
    for (const q of parsed.questions) {
      if (!q.id) q.id = crypto.randomUUID();
      if (typeof q.correctAnswerIndex !== 'number' || q.correctAnswerIndex < 0 || q.correctAnswerIndex >= (q.options?.length || 4)) {
        q.correctAnswerIndex = 0;
      }
    }

    const validation = questGameConfigSchema.safeParse(parsed);
    if (!validation.success) {
      throw new Error('Generated game content failed schema validation: ' + validation.error.message);
    }
    return validation.data;
  }

  /**
   * Helper to ensure all generated questions have valid IDs, bounds-checked answer indices,
   * and fallbacks if a topic lacked questions.
   */
  private sanitizeExtractedGames(data: any): void {
    if (!data || typeof data !== 'object') return;

    if (Array.isArray(data.units)) {
      for (const unit of data.units) {
        if (!Array.isArray(unit.topics)) continue;
        for (const topic of unit.topics) {
          if (!topic.game_mode || !['do-or-die', 'quiz-battle', 'puzzle-quest'].includes(topic.game_mode)) {
            topic.game_mode = 'quiz-battle';
          }
          if (!Array.isArray(topic.questions) || topic.questions.length === 0) {
            // Generate a sensible starter question grounded in the topic title
            topic.questions = [
              {
                id: crypto.randomUUID(),
                question: `What is the primary core concept behind ${topic.title}?`,
                options: [
                  `The foundational methodology and principles of ${topic.title}`,
                  `An obsolete historical convention with no modern application`,
                  `An unregulated arbitrary parameter`,
                  `A purely decorative syntax construct`,
                ],
                correctAnswerIndex: 0,
                explanation: `${topic.title} represents a foundational concept in the course curriculum.`,
                hint: `Focus on the primary definition and core application of ${topic.title}.`,
              },
            ];
          } else {
            for (const q of topic.questions) {
              if (!q.id) q.id = crypto.randomUUID();
              if (!Array.isArray(q.options) || q.options.length < 2) {
                q.options = ['True / Core Concept', 'False / Incorrect Application'];
              }
              if (
                typeof q.correctAnswerIndex !== 'number' ||
                q.correctAnswerIndex < 0 ||
                q.correctAnswerIndex >= q.options.length
              ) {
                q.correctAnswerIndex = 0;
              }
              if (!q.hint) q.hint = `Review the principles of ${topic.title}.`;
              if (!q.explanation) q.explanation = `This is the validated answer according to course principles.`;
            }
          }
        }
      }
    }

    if (Array.isArray(data.assessments)) {
      for (const assessment of data.assessments) {
        if (!Array.isArray(assessment.questions) || assessment.questions.length === 0) {
          assessment.questions = [
            {
              id: crypto.randomUUID(),
              question: `Comprehensive Examination: Which core approach is essential for mastering ${assessment.title}?`,
              options: [
                'Systematic understanding of core definitions and applications',
                'Memorizing trivia without understanding principles',
                'Skipping prerequisites and jumping to conclusions',
                'Relying solely on guesswork',
              ],
              correctAnswerIndex: 0,
              explanation: `Success in ${assessment.title} requires deep conceptual mastery of the course syllabus.`,
              hint: 'Identify the rigorous, systematic approach to course material.',
            },
          ];
        } else {
          for (const q of assessment.questions) {
            if (!q.id) q.id = crypto.randomUUID();
            if (!Array.isArray(q.options) || q.options.length < 2) {
              q.options = ['Primary Valid Solution', 'Alternative Invalid Solution'];
            }
            if (
              typeof q.correctAnswerIndex !== 'number' ||
              q.correctAnswerIndex < 0 ||
              q.correctAnswerIndex >= q.options.length
            ) {
              q.correctAnswerIndex = 0;
            }
          }
        }
      }
    }
  }
}

export const aiService = new AIService();
