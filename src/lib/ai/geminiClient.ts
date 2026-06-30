/**
 * Server-only Gemini client.
 * - API key is read from process.env.GEMINI_API_KEY (never shipped to the client).
 * - Model from process.env.GEMINI_MODEL, defaulting to gemini-2.5-flash.
 * - Generates structured JSON, validates with Zod, retries once on failure.
 *
 * This file must only ever be imported by server code (API routes / services).
 */
import { GoogleGenAI } from '@google/genai';
import type { ZodType } from 'zod';
import { SYSTEM_INSTRUCTION, CORRECTION_SUFFIX } from './prompts';

/** Thrown when the API key is missing — surfaced as a safe developer message. */
export class AiConfigError extends Error {
  constructor(message = 'AI is not configured. Set GEMINI_API_KEY in your environment.') {
    super(message);
    this.name = 'AiConfigError';
  }
}

/** Thrown when generation/validation ultimately fails (after one retry). */
export class AiGenerationError extends Error {
  constructor(message = 'AI could not generate a valid response. Please try again.') {
    super(message);
    this.name = 'AiGenerationError';
  }
}

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new AiConfigError();
  if (!client) client = new GoogleGenAI({ apiKey });
  return client;
}

export function getModel(): string {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/** Pull the JSON object out of a model response, tolerating stray fences/text. */
function extractJson(text: string): string {
  let t = text.trim();
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  }
  const first = t.indexOf('{');
  const last = t.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    return t.slice(first, last + 1);
  }
  return t;
}

async function callOnce(prompt: string, temperature: number): Promise<string> {
  const ai = getClient();
  const res = await ai.models.generateContent({
    model: getModel(),
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature,
      responseMimeType: 'application/json',
    },
  });
  return res.text ?? '';
}

function validate<T>(raw: string, schema: ZodType<T>): { ok: true; data: T } | { ok: false } {
  try {
    const json = JSON.parse(extractJson(raw));
    const parsed = schema.safeParse(json);
    if (parsed.success) return { ok: true, data: parsed.data };
  } catch {
    /* fall through to invalid */
  }
  return { ok: false };
}

/**
 * Generate a structured, schema-validated result.
 * NOTE: we deliberately never log the prompt or the raw model response —
 * only generic, body-free messages — so user data and AI bodies stay out of logs.
 */
export async function generateStructured<T>(opts: {
  prompt: string;
  schema: ZodType<T>;
  temperature?: number;
}): Promise<T> {
  const temperature = opts.temperature ?? 0.3;

  // Attempt 1
  const first = await callOnce(opts.prompt, temperature);
  const firstParsed = validate(first, opts.schema);
  if (firstParsed.ok) return firstParsed.data;

  // Retry once with a correction instruction (lower temperature)
  const second = await callOnce(opts.prompt + CORRECTION_SUFFIX, Math.max(0.1, temperature - 0.1));
  const secondParsed = validate(second, opts.schema);
  if (secondParsed.ok) return secondParsed.data;

  throw new AiGenerationError();
}
