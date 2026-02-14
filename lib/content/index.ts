import type { GameContent } from "./types";

import { riddle_001 } from "./riddles/riddle_001";
import { riddle_002 } from "./riddles/riddle_002";
import { quiz_001 } from "./quizzes/quiz_001";
import { quiz_002 } from "./quizzes/quiz_002";
import { puzzle_001 } from "./puzzles/puzzle_001";
import { programming_001 } from "./programming/programming_001";

// Harry Potter Quiz - Livello Normale
import { harry_potter_normal_01 } from "./quizzes/harry_potter_normal_01";
import { harry_potter_normal_02 } from "./quizzes/harry_potter_normal_02";
import { harry_potter_normal_03 } from "./quizzes/harry_potter_normal_03";
import { harry_potter_normal_04 } from "./quizzes/harry_potter_normal_04";
import { harry_potter_normal_05 } from "./quizzes/harry_potter_normal_05";

// Harry Potter Quiz - Livello Esperto
import { harry_potter_expert_01 } from "./quizzes/harry_potter_expert_01";
import { harry_potter_expert_02 } from "./quizzes/harry_potter_expert_02";
import { harry_potter_expert_03 } from "./quizzes/harry_potter_expert_03";
import { harry_potter_expert_04 } from "./quizzes/harry_potter_expert_04";
import { harry_potter_expert_05 } from "./quizzes/harry_potter_expert_05";
import { harry_potter_expert_06 } from "./quizzes/harry_potter_expert_06";

import { event_2026_02_25 } from "./events/2026_02_25";
import { event_2026_03_11 } from "./events/2026_03_11";
import { event_2026_03_25 } from "./events/2026_03_25";
import { event_harry_potter_evening } from "./events/harry_potter_evening";

export const allGameContent: GameContent[] = [
  riddle_001,
  riddle_002,
  quiz_001,
  quiz_002,
  puzzle_001,
  programming_001,
  // Harry Potter Quiz - Livello Normale
  harry_potter_normal_01,
  harry_potter_normal_02,
  harry_potter_normal_03,
  harry_potter_normal_04,
  harry_potter_normal_05,
  // Harry Potter Quiz - Livello Esperto
  harry_potter_expert_01,
  harry_potter_expert_02,
  harry_potter_expert_03,
  harry_potter_expert_04,
  harry_potter_expert_05,
  harry_potter_expert_06
];

export const allEvents = [
  event_2026_02_25,
  event_2026_03_11,
  event_2026_03_25,
  event_harry_potter_evening
];

export function getActiveContentForDate(date: string): GameContent[] {
  return allGameContent.filter(
    c => c.active === true && c.releaseDate <= date
  );
}
