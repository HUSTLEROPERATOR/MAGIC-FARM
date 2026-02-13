export type ContentType = "quiz" | "riddle" | "puzzle" | "programming";

export interface GameContent {
  id: string;
  type: ContentType;
  title: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  points: number;
  solution: string;
  acceptedAnswers: string[];
  releaseDate: string; // ISO YYYY-MM-DD
  eventId: string;
  active: boolean;
}
