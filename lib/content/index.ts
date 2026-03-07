import type { GameContent } from "./types";

import { riddle_001 } from "./riddles/riddle_001";
import { riddle_002 } from "./riddles/riddle_002";
import { riddle_003 } from "./riddles/riddle_003";
import { riddle_004 } from "./riddles/riddle_004";
import { riddle_005 } from "./riddles/riddle_005";
import { riddle_006 } from "./riddles/riddle_006";
import { riddle_007 } from "./riddles/riddle_007";
import { riddle_008 } from "./riddles/riddle_008";
import { riddle_009 } from "./riddles/riddle_009";
import { riddle_010 } from "./riddles/riddle_010";
import { riddle_011 } from "./riddles/riddle_011";
import { riddle_012 } from "./riddles/riddle_012";
import { riddle_013 } from "./riddles/riddle_013";
import { riddle_014 } from "./riddles/riddle_014";
import { riddle_015 } from "./riddles/riddle_015";
import { riddle_016 } from "./riddles/riddle_016";
import { riddle_017 } from "./riddles/riddle_017";
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
  riddle_003,
  riddle_004,
  riddle_005,
  riddle_006,
  riddle_007,
  riddle_008,
  riddle_009,
  riddle_010,
  riddle_011,
  riddle_012,
  riddle_013,
  riddle_014,
  riddle_015,
  riddle_016,
  riddle_017,
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
