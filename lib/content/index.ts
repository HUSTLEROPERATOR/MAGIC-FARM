import type { GameContent } from "./types";

import { riddle_001 } from "./riddles/riddle_001";
import { riddle_002 } from "./riddles/riddle_002";
import { quiz_001 } from "./quizzes/quiz_001";
import { quiz_002 } from "./quizzes/quiz_002";
import { puzzle_001 } from "./puzzles/puzzle_001";
import { programming_001 } from "./programming/programming_001";

import { event_2026_02_25 } from "./events/2026_02_25";
import { event_2026_03_11 } from "./events/2026_03_11";
import { event_2026_03_25 } from "./events/2026_03_25";

export const allGameContent: GameContent[] = [
  riddle_001,
  riddle_002,
  quiz_001,
  quiz_002,
  puzzle_001,
  programming_001
];

export const allEvents = [
  event_2026_02_25,
  event_2026_03_11,
  event_2026_03_25
];

export function getActiveContentForDate(date: string): GameContent[] {
  return allGameContent.filter(
    c => c.active === true && c.releaseDate <= date
  );
}
