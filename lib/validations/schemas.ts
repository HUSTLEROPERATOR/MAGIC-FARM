import { z } from 'zod';

// User registration schema
export const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address'),
  privacyAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the privacy policy' }),
  }),
  marketingOptIn: z.boolean().optional(),
});

// Alias setting schema
export const aliasSchema = z.object({
  alias: z
    .string()
    .min(3, 'Alias must be at least 3 characters')
    .max(30, 'Alias must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Alias can only contain letters, numbers, underscores, and hyphens'),
});

// Table join schema
export const tableJoinSchema = z.object({
  joinCode: z.string().length(6, 'Join code must be 6 characters'),
});

// Answer submission schema
export const answerSubmissionSchema = z.object({
  puzzleId: z.string().cuid(),
  answer: z.string().min(1, 'Answer is required').max(500),
  tableId: z.string().cuid().optional(),
});

// Clue board message schema
export const clueBoardMessageSchema = z.object({
  tableId: z.string().cuid(),
  body: z.string().min(1, 'Message is required').max(500),
});

// Admin event creation schema
export const eventCreationSchema = z.object({
  name: z.string().min(1, 'Event name is required').max(200),
  description: z.string().optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
});

// Admin round creation schema
export const roundCreationSchema = z.object({
  eventNightId: z.string().cuid(),
  title: z.string().min(1, 'Round title is required').max(200),
  description: z.string().optional(),
  type: z.enum(['SINGLE_TABLE', 'MULTI_TABLE', 'INDIVIDUAL']),
  configJson: z.any().optional(),
});

// Admin puzzle creation schema
export const puzzleCreationSchema = z.object({
  roundId: z.string().cuid(),
  title: z.string().min(1, 'Puzzle title is required').max(200),
  prompt: z.string().min(1, 'Puzzle prompt is required'),
  answer: z.string().min(1, 'Answer is required'),
  scoringJson: z.any().optional(),
  order: z.number().int().min(0).optional(),
});

// Hint creation schema
export const hintCreationSchema = z.object({
  puzzleId: z.string().cuid(),
  text: z.string().min(1, 'Hint text is required'),
  penaltyPoints: z.number().int().min(0),
  order: z.number().int().min(0),
});

// Table creation schema
export const tableCreationSchema = z.object({
  eventNightId: z.string().cuid(),
  name: z.string().min(1, 'Table name is required').max(100),
});

// Request hint schema
export const requestHintSchema = z.object({
  puzzleId: z.string().cuid(),
  hintId: z.string().cuid(),
});

// Alliance creation schema
export const allianceCreationSchema = z.object({
  eventNightId: z.string().cuid(),
  tableAId: z.string().cuid(),
  tableBId: z.string().cuid(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type AliasInput = z.infer<typeof aliasSchema>;
export type TableJoinInput = z.infer<typeof tableJoinSchema>;
export type AnswerSubmissionInput = z.infer<typeof answerSubmissionSchema>;
export type ClueBoardMessageInput = z.infer<typeof clueBoardMessageSchema>;
export type EventCreationInput = z.infer<typeof eventCreationSchema>;
export type RoundCreationInput = z.infer<typeof roundCreationSchema>;
export type PuzzleCreationInput = z.infer<typeof puzzleCreationSchema>;
export type HintCreationInput = z.infer<typeof hintCreationSchema>;
export type TableCreationInput = z.infer<typeof tableCreationSchema>;
export type RequestHintInput = z.infer<typeof requestHintSchema>;
export type AllianceCreationInput = z.infer<typeof allianceCreationSchema>;
