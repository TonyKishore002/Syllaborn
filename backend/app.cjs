"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/server.ts
var server_exports = {};
__export(server_exports, {
  default: () => server_default
});
module.exports = __toCommonJS(server_exports);
var import_config = require("dotenv/config");
var import_express2 = __toESM(require("express"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_express_rate_limit = __toESM(require("express-rate-limit"), 1);

// src/routes/api.routes.ts
var import_express = require("express");

// src/schemas/syllabus.schema.ts
var import_zod = require("zod");
var gameQuestionSchema = import_zod.z.object({
  id: import_zod.z.string().default(() => crypto.randomUUID()),
  question: import_zod.z.string().min(1, "Question text cannot be empty"),
  options: import_zod.z.array(import_zod.z.string().min(1)).min(2, "Must provide at least 2 options"),
  correctAnswerIndex: import_zod.z.number().int().min(0),
  explanation: import_zod.z.string().min(1, "Explanation cannot be empty"),
  hint: import_zod.z.string().default("Think about the fundamental course principles!"),
  sourceReference: import_zod.z.object({
    page: import_zod.z.number().nullable().optional(),
    excerpt: import_zod.z.string().nullable().optional()
  }).optional()
});
var puzzlePairSchema = import_zod.z.object({
  id: import_zod.z.string().default(() => crypto.randomUUID()),
  left: import_zod.z.string().min(1),
  right: import_zod.z.string().min(1)
});
var puzzleStepSchema = import_zod.z.object({
  id: import_zod.z.string().default(() => crypto.randomUUID()),
  order: import_zod.z.number().int(),
  text: import_zod.z.string().min(1)
});
var puzzleDataSchema = import_zod.z.object({
  type: import_zod.z.enum(["matching", "ordering"]),
  prompt: import_zod.z.string().min(1),
  pairs: import_zod.z.array(puzzlePairSchema).optional(),
  steps: import_zod.z.array(puzzleStepSchema).optional()
});
var questGameConfigSchema = import_zod.z.object({
  questId: import_zod.z.string().optional(),
  topic: import_zod.z.string().min(1),
  gameMode: import_zod.z.enum(["do-or-die", "quiz-battle", "puzzle-quest", "boss-slayer"]),
  difficulty: import_zod.z.enum(["easy", "medium", "hard"]).default("easy"),
  questions: import_zod.z.array(gameQuestionSchema).default([]),
  puzzleData: puzzleDataSchema.nullable().optional()
});
var analyzeRequestSchema = import_zod.z.object({
  text: import_zod.z.string().min(20, "Extracted text is too short to be a valid syllabus").max(3e5, "Document text exceeds maximum allowed character length (300k chars)"),
  options: import_zod.z.object({
    detailLevel: import_zod.z.enum(["standard", "thorough"]).optional()
  }).optional()
});
var generateGameRequestSchema = import_zod.z.object({
  topicTitle: import_zod.z.string().min(1),
  courseName: import_zod.z.string().optional(),
  unitTitle: import_zod.z.string().optional(),
  preferredGameMode: import_zod.z.enum(["do-or-die", "quiz-battle", "puzzle-quest", "boss-slayer"]).optional(),
  syllabusExcerpt: import_zod.z.string().optional()
});
var extractedGradingCategorySchema = import_zod.z.object({
  name: import_zod.z.string(),
  weight_percent: import_zod.z.number().min(0).max(100),
  source_page: import_zod.z.number().nullable().optional(),
  evidence: import_zod.z.string().nullable().optional()
});
var extractedMilestoneSchema = import_zod.z.object({
  title: import_zod.z.string().min(1),
  description: import_zod.z.string().optional(),
  type: import_zod.z.enum([
    "assignment",
    "reading",
    "quiz",
    "lab",
    "project",
    "presentation",
    "midterm",
    "final_exam",
    "other"
  ]),
  weight_percent: import_zod.z.number().min(0).max(100).nullable().optional(),
  due_date: import_zod.z.string().nullable().optional(),
  // YYYY-MM-DD format
  due_time: import_zod.z.string().nullable().optional(),
  source_page: import_zod.z.number().nullable().optional(),
  evidence: import_zod.z.string().nullable().optional(),
  confidence: import_zod.z.number().min(0).max(1).optional()
});
var extractedTopicSchema = import_zod.z.object({
  id: import_zod.z.string().optional(),
  title: import_zod.z.string().min(1),
  quest_title: import_zod.z.string().optional(),
  description: import_zod.z.string().optional(),
  game_mode: import_zod.z.enum(["do-or-die", "quiz-battle", "puzzle-quest"]).optional().default("quiz-battle"),
  difficulty: import_zod.z.enum(["easy", "medium", "hard"]).optional().default("easy"),
  questions: import_zod.z.array(gameQuestionSchema).optional().default([]),
  puzzle_data: puzzleDataSchema.nullable().optional()
});
var extractedUnitSchema = import_zod.z.object({
  unit_number: import_zod.z.number().int().optional(),
  title: import_zod.z.string().min(1),
  location_name: import_zod.z.string().optional(),
  description: import_zod.z.string().optional(),
  topics: import_zod.z.array(extractedTopicSchema).default([])
});
var extractedAssessmentSchema = import_zod.z.object({
  id: import_zod.z.string().optional(),
  title: import_zod.z.string().min(1),
  boss_name: import_zod.z.string().optional(),
  type: import_zod.z.enum([
    "assignment",
    "reading",
    "quiz",
    "lab",
    "project",
    "presentation",
    "midterm",
    "final_exam",
    "other"
  ]),
  weight_percent: import_zod.z.number().min(0).max(100).nullable().optional(),
  due_date: import_zod.z.string().nullable().optional(),
  due_time: import_zod.z.string().nullable().optional(),
  boss_hp: import_zod.z.number().nullable().optional(),
  evidence: import_zod.z.string().nullable().optional(),
  questions: import_zod.z.array(gameQuestionSchema).optional().default([])
});
var extractedPolicySchema = import_zod.z.object({
  title: import_zod.z.string(),
  description: import_zod.z.string(),
  source_page: import_zod.z.number().nullable().optional(),
  evidence: import_zod.z.string().nullable().optional()
});
var syllabusExtractionResponseSchema = import_zod.z.object({
  course_name: import_zod.z.string().nullable().optional(),
  course_code: import_zod.z.string().nullable().optional(),
  instructor_name: import_zod.z.string().nullable().optional(),
  semester: import_zod.z.string().nullable().optional(),
  region_name: import_zod.z.string().optional(),
  units: import_zod.z.array(extractedUnitSchema).default([]),
  assessments: import_zod.z.array(extractedAssessmentSchema).default([]),
  grading_structure: import_zod.z.array(extractedGradingCategorySchema).default([]),
  milestones: import_zod.z.array(extractedMilestoneSchema).default([]),
  policies: import_zod.z.array(extractedPolicySchema).default([]),
  warnings: import_zod.z.array(import_zod.z.string()).default([])
});

// src/services/ai.service.ts
var import_genai = require("@google/genai");
var import_openai = __toESM(require("openai"), 1);
var AIService = class {
  geminiClient = null;
  openAiClient = null;
  provider = "none";
  model = "gemini-3.5-flash-lite";
  constructor() {
    this.initClient();
  }
  initClient() {
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const openAiKey = process.env.OPENAI_API_KEY;
    if (geminiKey && geminiKey.trim() !== "" && geminiKey !== "your_gemini_api_key_here") {
      this.geminiClient = new import_genai.GoogleGenAI({ apiKey: geminiKey });
      this.provider = "gemini";
      this.model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
    } else if (openAiKey && openAiKey.trim() !== "" && openAiKey !== "your_openai_api_key_here") {
      this.openAiClient = new import_openai.default({ apiKey: openAiKey });
      this.provider = "openai";
      this.model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    } else {
      this.geminiClient = null;
      this.openAiClient = null;
      this.provider = "none";
    }
  }
  isConfigured() {
    if (this.provider === "none") {
      this.initClient();
    }
    return this.provider !== "none";
  }
  getProvider() {
    if (this.provider === "none") {
      this.initClient();
    }
    return this.provider;
  }
  getModelName() {
    if (this.provider === "none") {
      this.initClient();
    }
    return this.model;
  }
  async analyzeSyllabus(text) {
    if (this.provider === "none") {
      this.initClient();
    }
    if (this.provider === "none") {
      throw new Error(
        "AI key is not configured on the backend. Please add GEMINI_API_KEY to backend/.env and restart the backend server."
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
    let responseContent = null;
    if (this.provider === "gemini" && this.geminiClient) {
      const response = await this.geminiClient.models.generateContent({
        model: this.model,
        contents: `Here is the extracted text from the syllabus PDF to analyze and forge into games:

---
${text.slice(0, 1e5)}
---`,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          temperature: 0.2
        }
      });
      responseContent = response.text || null;
    } else if (this.provider === "openai" && this.openAiClient) {
      const completion = await this.openAiClient.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Here is the extracted text from the syllabus PDF to analyze and forge into games:

---
${text.slice(0, 1e5)}
---`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
      });
      responseContent = completion.choices[0]?.message?.content || null;
    }
    if (!responseContent) {
      throw new Error("AI returned an empty response.");
    }
    let parsedJson;
    try {
      parsedJson = JSON.parse(responseContent);
    } catch {
      throw new Error("Failed to parse AI output as JSON.");
    }
    this.sanitizeExtractedGames(parsedJson);
    const validation = syllabusExtractionResponseSchema.safeParse(parsedJson);
    if (!validation.success) {
      const issues = validation.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
      throw new Error(`AI response failed schema validation: ${issues}`);
    }
    return validation.data;
  }
  /**
   * On-demand game generator for a single quest topic
   */
  async generateGameForTopic(req) {
    if (this.provider === "none") {
      this.initClient();
    }
    if (this.provider === "none") {
      throw new Error("AI key is not configured on the backend.");
    }
    const systemPrompt = `You are an educational game designer. Generate a rich, syllabus-grounded mini-game challenge for the university course topic: "${req.topicTitle}" (Course: ${req.courseName || "Academic Course"}).

Output strict JSON matching:
{
  "topic": "${req.topicTitle}",
  "gameMode": "${req.preferredGameMode || "quiz-battle"}",
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
    let responseContent = null;
    if (this.provider === "gemini" && this.geminiClient) {
      const response = await this.geminiClient.models.generateContent({
        model: this.model,
        contents: `Generate game content for topic: ${req.topicTitle}
Course: ${req.courseName || ""}
Excerpt: ${req.syllabusExcerpt || ""}`,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          temperature: 0.3
        }
      });
      responseContent = response.text || null;
    } else if (this.provider === "openai" && this.openAiClient) {
      const completion = await this.openAiClient.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate game content for topic: ${req.topicTitle}` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });
      responseContent = completion.choices[0]?.message?.content || null;
    }
    if (!responseContent) {
      throw new Error("AI returned an empty response.");
    }
    const parsed = JSON.parse(responseContent);
    if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error("AI failed to generate valid questions.");
    }
    for (const q of parsed.questions) {
      if (!q.id) q.id = crypto.randomUUID();
      if (typeof q.correctAnswerIndex !== "number" || q.correctAnswerIndex < 0 || q.correctAnswerIndex >= (q.options?.length || 4)) {
        q.correctAnswerIndex = 0;
      }
    }
    const validation = questGameConfigSchema.safeParse(parsed);
    if (!validation.success) {
      throw new Error("Generated game content failed schema validation: " + validation.error.message);
    }
    return validation.data;
  }
  /**
   * Helper to ensure all generated questions have valid IDs, bounds-checked answer indices,
   * and fallbacks if a topic lacked questions.
   */
  sanitizeExtractedGames(data) {
    if (!data || typeof data !== "object") return;
    if (Array.isArray(data.units)) {
      for (const unit of data.units) {
        if (!Array.isArray(unit.topics)) continue;
        for (const topic of unit.topics) {
          if (!topic.game_mode || !["do-or-die", "quiz-battle", "puzzle-quest"].includes(topic.game_mode)) {
            topic.game_mode = "quiz-battle";
          }
          if (!Array.isArray(topic.questions) || topic.questions.length === 0) {
            topic.questions = [
              {
                id: crypto.randomUUID(),
                question: `What is the primary core concept behind ${topic.title}?`,
                options: [
                  `The foundational methodology and principles of ${topic.title}`,
                  `An obsolete historical convention with no modern application`,
                  `An unregulated arbitrary parameter`,
                  `A purely decorative syntax construct`
                ],
                correctAnswerIndex: 0,
                explanation: `${topic.title} represents a foundational concept in the course curriculum.`,
                hint: `Focus on the primary definition and core application of ${topic.title}.`
              }
            ];
          } else {
            for (const q of topic.questions) {
              if (!q.id) q.id = crypto.randomUUID();
              if (!Array.isArray(q.options) || q.options.length < 2) {
                q.options = ["True / Core Concept", "False / Incorrect Application"];
              }
              if (typeof q.correctAnswerIndex !== "number" || q.correctAnswerIndex < 0 || q.correctAnswerIndex >= q.options.length) {
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
                "Systematic understanding of core definitions and applications",
                "Memorizing trivia without understanding principles",
                "Skipping prerequisites and jumping to conclusions",
                "Relying solely on guesswork"
              ],
              correctAnswerIndex: 0,
              explanation: `Success in ${assessment.title} requires deep conceptual mastery of the course syllabus.`,
              hint: "Identify the rigorous, systematic approach to course material."
            }
          ];
        } else {
          for (const q of assessment.questions) {
            if (!q.id) q.id = crypto.randomUUID();
            if (!Array.isArray(q.options) || q.options.length < 2) {
              q.options = ["Primary Valid Solution", "Alternative Invalid Solution"];
            }
            if (typeof q.correctAnswerIndex !== "number" || q.correctAnswerIndex < 0 || q.correctAnswerIndex >= q.options.length) {
              q.correctAnswerIndex = 0;
            }
          }
        }
      }
    }
  }
};
var aiService = new AIService();

// src/routes/api.routes.ts
var apiRouter = (0, import_express.Router)();
apiRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "Syllaborn AI Backend",
    serverTime: (/* @__PURE__ */ new Date()).toISOString(),
    aiConfigured: aiService.isConfigured(),
    provider: aiService.getProvider(),
    model: aiService.getModelName()
  });
});
apiRouter.post("/analyze-syllabus", async (req, res) => {
  try {
    const parseResult = analyzeRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      res.status(400).json({
        error: "Validation Error",
        message: errorMsg
      });
      return;
    }
    const { text } = parseResult.data;
    if (!aiService.isConfigured()) {
      res.status(503).json({
        error: "AI Provider Not Configured",
        message: "AI API Key is missing. Please set GEMINI_API_KEY (or OPENAI_API_KEY) in backend/.env to enable automated AI syllabus analysis. You can still manually create and manage courses and quests in Syllaborn!"
      });
      return;
    }
    const extractedData = await aiService.analyzeSyllabus(text);
    res.json({
      success: true,
      data: extractedData
    });
  } catch (err) {
    console.error("Error analyzing syllabus:", err.message || err);
    res.status(500).json({
      error: "Analysis Failed",
      message: err.message || "An unexpected error occurred during syllabus analysis."
    });
  }
});
apiRouter.post("/generate-game", async (req, res) => {
  try {
    const parseResult = generateGameRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      res.status(400).json({
        error: "Validation Error",
        message: errorMsg
      });
      return;
    }
    if (!aiService.isConfigured()) {
      res.status(503).json({
        error: "AI Provider Not Configured",
        message: "AI API Key is missing. Please set GEMINI_API_KEY in backend/.env."
      });
      return;
    }
    const gameConfig = await aiService.generateGameForTopic(parseResult.data);
    res.json({
      success: true,
      data: gameConfig
    });
  } catch (err) {
    console.error("Error generating game:", err.message || err);
    res.status(500).json({
      error: "Game Generation Failed",
      message: err.message || "Failed to generate game content for the topic."
    });
  }
});

// src/server.ts
var app = (0, import_express2.default)();
var PORT = process.env.PORT || 3001;
var FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
app.use(
  (0, import_cors.default)({
    origin: (origin, callback) => {
      if (!origin || origin === FRONTEND_ORIGIN || origin.startsWith("http://localhost:")) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by Syllaborn CORS policy`));
      }
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
  })
);
app.use(import_express2.default.json({ limit: "5mb" }));
var apiLimiter = (0, import_express_rate_limit.default)({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 60,
  // Limit each IP to 60 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too Many Requests",
    message: "Rate limit exceeded. Please wait a few minutes before submitting another syllabus."
  }
});
app.use("/api/", apiLimiter);
app.use("/api", apiRouter);
app.get("/", (_req, res) => {
  res.json({
    name: "Syllaborn AI Backend",
    version: "1.0.0",
    description: "Secure AI extraction service for university syllabi",
    health: "/api/health"
  });
});
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\u{1F9D9} Syllaborn AI Backend listening on port ${PORT}`);
    console.log(`\u{1F310} Allowed frontend origin: ${FRONTEND_ORIGIN}`);
    console.log(`\u{1F50D} Health endpoint: http://localhost:${PORT}/api/health`);
  });
}
var server_default = app;
module.exports = server_default; module.exports.default = server_default;
