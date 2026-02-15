import { describe, expect, it } from "vitest";
import { harry_potter_normal_01 } from "@/lib/content/quizzes/harry_potter_normal_01";
import { harry_potter_normal_02 } from "@/lib/content/quizzes/harry_potter_normal_02";
import { harry_potter_normal_03 } from "@/lib/content/quizzes/harry_potter_normal_03";
import { harry_potter_normal_04 } from "@/lib/content/quizzes/harry_potter_normal_04";
import { harry_potter_normal_05 } from "@/lib/content/quizzes/harry_potter_normal_05";
import { harry_potter_expert_01 } from "@/lib/content/quizzes/harry_potter_expert_01";
import { harry_potter_expert_02 } from "@/lib/content/quizzes/harry_potter_expert_02";
import { harry_potter_expert_03 } from "@/lib/content/quizzes/harry_potter_expert_03";
import { harry_potter_expert_04 } from "@/lib/content/quizzes/harry_potter_expert_04";
import { harry_potter_expert_05 } from "@/lib/content/quizzes/harry_potter_expert_05";
import { harry_potter_expert_06 } from "@/lib/content/quizzes/harry_potter_expert_06";
import { allGameContent, allEvents } from "@/lib/content";
import type { GameContent } from "@/lib/content/types";

describe("Harry Potter Quiz Content", () => {
  describe("Normal Difficulty Quizzes", () => {
    const normalQuizzes = [
      harry_potter_normal_01,
      harry_potter_normal_02,
      harry_potter_normal_03,
      harry_potter_normal_04,
      harry_potter_normal_05,
    ];

    it("should have correct structure for all normal quizzes", () => {
      normalQuizzes.forEach((quiz: GameContent) => {
        expect(quiz).toHaveProperty("id");
        expect(quiz).toHaveProperty("type");
        expect(quiz).toHaveProperty("title");
        expect(quiz).toHaveProperty("difficulty");
        expect(quiz).toHaveProperty("points");
        expect(quiz).toHaveProperty("solution");
        expect(quiz).toHaveProperty("acceptedAnswers");
        expect(quiz).toHaveProperty("releaseDate");
        expect(quiz).toHaveProperty("eventId");
        expect(quiz).toHaveProperty("active");
      });
    });

    it("should have type 'quiz' for all normal quizzes", () => {
      normalQuizzes.forEach((quiz) => {
        expect(quiz.type).toBe("quiz");
      });
    });

    it("should have difficulty between 1-2 for normal level", () => {
      normalQuizzes.forEach((quiz) => {
        expect(quiz.difficulty).toBeGreaterThanOrEqual(1);
        expect(quiz.difficulty).toBeLessThanOrEqual(2);
      });
    });

    it("should have eventId 'harry_potter_evening'", () => {
      normalQuizzes.forEach((quiz) => {
        expect(quiz.eventId).toBe("harry_potter_evening");
      });
    });

    it("should have at least one accepted answer", () => {
      normalQuizzes.forEach((quiz) => {
        expect(quiz.acceptedAnswers.length).toBeGreaterThan(0);
      });
    });

    it("should have solution in acceptedAnswers", () => {
      normalQuizzes.forEach((quiz) => {
        expect(quiz.acceptedAnswers).toContain(quiz.solution);
      });
    });
  });

  describe("Expert Difficulty Quizzes", () => {
    const expertQuizzes = [
      harry_potter_expert_01,
      harry_potter_expert_02,
      harry_potter_expert_03,
      harry_potter_expert_04,
      harry_potter_expert_05,
      harry_potter_expert_06,
    ];

    it("should have correct structure for all expert quizzes", () => {
      expertQuizzes.forEach((quiz: GameContent) => {
        expect(quiz).toHaveProperty("id");
        expect(quiz).toHaveProperty("type");
        expect(quiz).toHaveProperty("title");
        expect(quiz).toHaveProperty("difficulty");
        expect(quiz).toHaveProperty("points");
        expect(quiz).toHaveProperty("solution");
        expect(quiz).toHaveProperty("acceptedAnswers");
        expect(quiz).toHaveProperty("releaseDate");
        expect(quiz).toHaveProperty("eventId");
        expect(quiz).toHaveProperty("active");
      });
    });

    it("should have type 'quiz' for all expert quizzes", () => {
      expertQuizzes.forEach((quiz) => {
        expect(quiz.type).toBe("quiz");
      });
    });

    it("should have difficulty between 3-5 for expert level", () => {
      expertQuizzes.forEach((quiz) => {
        expect(quiz.difficulty).toBeGreaterThanOrEqual(3);
        expect(quiz.difficulty).toBeLessThanOrEqual(5);
      });
    });

    it("should have higher points than normal quizzes", () => {
      expertQuizzes.forEach((quiz) => {
        expect(quiz.points).toBeGreaterThanOrEqual(60);
      });
    });

    it("should have eventId 'harry_potter_evening'", () => {
      expertQuizzes.forEach((quiz) => {
        expect(quiz.eventId).toBe("harry_potter_evening");
      });
    });

    it("should have at least one accepted answer", () => {
      expertQuizzes.forEach((quiz) => {
        expect(quiz.acceptedAnswers.length).toBeGreaterThan(0);
      });
    });

    it("should have solution in acceptedAnswers", () => {
      expertQuizzes.forEach((quiz) => {
        expect(quiz.acceptedAnswers).toContain(quiz.solution);
      });
    });
  });

  describe("Integration with allGameContent", () => {
    it("should include all Harry Potter quizzes in allGameContent", () => {
      const harryPotterQuizIds = [
        "harry_potter_normal_01",
        "harry_potter_normal_02",
        "harry_potter_normal_03",
        "harry_potter_normal_04",
        "harry_potter_normal_05",
        "harry_potter_expert_01",
        "harry_potter_expert_02",
        "harry_potter_expert_03",
        "harry_potter_expert_04",
        "harry_potter_expert_05",
        "harry_potter_expert_06",
      ];

      const contentIds = allGameContent.map((c) => c.id);
      harryPotterQuizIds.forEach((id) => {
        expect(contentIds).toContain(id);
      });
    });
  });

  describe("Harry Potter Evening Event", () => {
    it("should include harry_potter_evening event in allEvents", () => {
      const eventIds = allEvents.map((e) => e.id);
      expect(eventIds).toContain("harry_potter_evening");
    });

    it("should have correct event structure", () => {
      const harryPotterEvent = allEvents.find(
        (e) => e.id === "harry_potter_evening"
      );
      expect(harryPotterEvent).toBeDefined();
      expect(harryPotterEvent?.name).toBe(
        "Serata Magica: Harry Potter Quiz Night"
      );
      expect(harryPotterEvent?.puzzles.length).toBe(11);
    });
  });
});
