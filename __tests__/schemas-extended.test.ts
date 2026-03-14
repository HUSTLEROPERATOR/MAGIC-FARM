import { describe, it, expect } from 'vitest';
import {
  tableJoinSchema,
  answerSubmissionSchema,
  clueBoardMessageSchema,
  eventCreationSchema,
  roundCreationSchema,
  puzzleCreationSchema,
  hintCreationSchema,
  tableCreationSchema,
  requestHintSchema,
  allianceCreationSchema,
  moduleToggleSchema,
  moduleConfigSchema,
  moduleExecuteSchema,
} from '@/lib/validations/schemas';

// Reusable valid CUID for tests
const VALID_CUID = 'cjld2cjxh0000qzrmn831i7rn';
const VALID_CUID_2 = 'cld9p1vjf0000fz18n3c4l2n1';
const VALID_CUID_3 = 'cm1234abcd0000xyz56789efg';

// ---------------------------------------------------------------------------
// tableJoinSchema
// ---------------------------------------------------------------------------
describe('tableJoinSchema', () => {
  it('accetta un codice di 6 caratteri valido', () => {
    expect(tableJoinSchema.safeParse({ joinCode: 'ABC123' }).success).toBe(true);
  });

  it('rifiuta un codice troppo corto', () => {
    expect(tableJoinSchema.safeParse({ joinCode: 'AB123' }).success).toBe(false);
  });

  it('rifiuta un codice troppo lungo', () => {
    expect(tableJoinSchema.safeParse({ joinCode: 'ABCD1234' }).success).toBe(false);
  });

  it('rifiuta un codice vuoto', () => {
    expect(tableJoinSchema.safeParse({ joinCode: '' }).success).toBe(false);
  });

  it('rifiuta se joinCode è assente', () => {
    expect(tableJoinSchema.safeParse({}).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// answerSubmissionSchema
// ---------------------------------------------------------------------------
describe('answerSubmissionSchema', () => {
  it('accetta dati validi senza tableId opzionale', () => {
    expect(
      answerSubmissionSchema.safeParse({ puzzleId: VALID_CUID, answer: 'Risposta corretta' }).success
    ).toBe(true);
  });

  it('accetta dati validi con tableId opzionale', () => {
    expect(
      answerSubmissionSchema.safeParse({
        puzzleId: VALID_CUID,
        answer: 'Risposta',
        tableId: VALID_CUID_2,
      }).success
    ).toBe(true);
  });

  it('rifiuta puzzleId non CUID', () => {
    expect(
      answerSubmissionSchema.safeParse({ puzzleId: 'not-a-cuid', answer: 'Risposta' }).success
    ).toBe(false);
  });

  it('rifiuta risposta vuota', () => {
    expect(
      answerSubmissionSchema.safeParse({ puzzleId: VALID_CUID, answer: '' }).success
    ).toBe(false);
  });

  it('rifiuta risposta troppo lunga (> 500 caratteri)', () => {
    expect(
      answerSubmissionSchema.safeParse({ puzzleId: VALID_CUID, answer: 'a'.repeat(501) }).success
    ).toBe(false);
  });

  it('rifiuta tableId non CUID se fornito', () => {
    expect(
      answerSubmissionSchema.safeParse({
        puzzleId: VALID_CUID,
        answer: 'Risposta',
        tableId: 'invalido',
      }).success
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// clueBoardMessageSchema
// ---------------------------------------------------------------------------
describe('clueBoardMessageSchema', () => {
  it('accetta dati validi', () => {
    expect(
      clueBoardMessageSchema.safeParse({ tableId: VALID_CUID, body: 'Messaggio' }).success
    ).toBe(true);
  });

  it('rifiuta tableId non CUID', () => {
    expect(
      clueBoardMessageSchema.safeParse({ tableId: 'invalido', body: 'Messaggio' }).success
    ).toBe(false);
  });

  it('rifiuta body vuoto', () => {
    expect(
      clueBoardMessageSchema.safeParse({ tableId: VALID_CUID, body: '' }).success
    ).toBe(false);
  });

  it('rifiuta body troppo lungo (> 500 caratteri)', () => {
    expect(
      clueBoardMessageSchema.safeParse({ tableId: VALID_CUID, body: 'x'.repeat(501) }).success
    ).toBe(false);
  });

  it('accetta body di esattamente 500 caratteri', () => {
    expect(
      clueBoardMessageSchema.safeParse({ tableId: VALID_CUID, body: 'x'.repeat(500) }).success
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// eventCreationSchema
// ---------------------------------------------------------------------------
describe('eventCreationSchema', () => {
  it('accetta dati validi completi', () => {
    expect(
      eventCreationSchema.safeParse({
        name: 'Serata Magica',
        description: 'Una serata di magia',
        startsAt: '2026-06-01T20:00:00Z',
        endsAt: '2026-06-01T23:00:00Z',
      }).success
    ).toBe(true);
  });

  it('accetta dati senza description (opzionale)', () => {
    expect(
      eventCreationSchema.safeParse({
        name: 'Serata Magica',
        startsAt: '2026-06-01T20:00:00Z',
        endsAt: '2026-06-01T23:00:00Z',
      }).success
    ).toBe(true);
  });

  it('converte stringhe di date in oggetti Date (coerce)', () => {
    const result = eventCreationSchema.safeParse({
      name: 'Serata',
      startsAt: '2026-06-01T20:00:00Z',
      endsAt: '2026-06-01T23:00:00Z',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startsAt).toBeInstanceOf(Date);
      expect(result.data.endsAt).toBeInstanceOf(Date);
    }
  });

  it('rifiuta name vuoto', () => {
    expect(
      eventCreationSchema.safeParse({
        name: '',
        startsAt: '2026-06-01T20:00:00Z',
        endsAt: '2026-06-01T23:00:00Z',
      }).success
    ).toBe(false);
  });

  it('rifiuta name più lungo di 200 caratteri', () => {
    expect(
      eventCreationSchema.safeParse({
        name: 'a'.repeat(201),
        startsAt: '2026-06-01T20:00:00Z',
        endsAt: '2026-06-01T23:00:00Z',
      }).success
    ).toBe(false);
  });

  it('rifiuta data non valida', () => {
    expect(
      eventCreationSchema.safeParse({
        name: 'Serata',
        startsAt: 'non-una-data',
        endsAt: '2026-06-01T23:00:00Z',
      }).success
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// roundCreationSchema
// ---------------------------------------------------------------------------
describe('roundCreationSchema', () => {
  it('accetta dati validi con tipo SINGLE_TABLE', () => {
    expect(
      roundCreationSchema.safeParse({
        eventNightId: VALID_CUID,
        title: 'Round 1',
        type: 'SINGLE_TABLE',
      }).success
    ).toBe(true);
  });

  it('accetta tipo MULTI_TABLE', () => {
    expect(
      roundCreationSchema.safeParse({
        eventNightId: VALID_CUID,
        title: 'Round 2',
        type: 'MULTI_TABLE',
      }).success
    ).toBe(true);
  });

  it('accetta tipo INDIVIDUAL', () => {
    expect(
      roundCreationSchema.safeParse({
        eventNightId: VALID_CUID,
        title: 'Round 3',
        type: 'INDIVIDUAL',
      }).success
    ).toBe(true);
  });

  it('rifiuta tipo non valido', () => {
    expect(
      roundCreationSchema.safeParse({
        eventNightId: VALID_CUID,
        title: 'Round',
        type: 'INVALID_TYPE',
      }).success
    ).toBe(false);
  });

  it('rifiuta eventNightId non CUID', () => {
    expect(
      roundCreationSchema.safeParse({
        eventNightId: 'invalido',
        title: 'Round',
        type: 'INDIVIDUAL',
      }).success
    ).toBe(false);
  });

  it('rifiuta title vuoto', () => {
    expect(
      roundCreationSchema.safeParse({
        eventNightId: VALID_CUID,
        title: '',
        type: 'INDIVIDUAL',
      }).success
    ).toBe(false);
  });

  it('accetta description e configJson opzionali', () => {
    expect(
      roundCreationSchema.safeParse({
        eventNightId: VALID_CUID,
        title: 'Round',
        description: 'Descrizione',
        type: 'INDIVIDUAL',
        configJson: { key: 'value' },
      }).success
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// puzzleCreationSchema
// ---------------------------------------------------------------------------
describe('puzzleCreationSchema', () => {
  it('accetta dati validi', () => {
    expect(
      puzzleCreationSchema.safeParse({
        roundId: VALID_CUID,
        title: 'Enigma 1',
        prompt: 'Qual è la risposta?',
        answer: 'La risposta',
      }).success
    ).toBe(true);
  });

  it('rifiuta roundId non CUID', () => {
    expect(
      puzzleCreationSchema.safeParse({
        roundId: 'invalido',
        title: 'Enigma',
        prompt: 'Prompt',
        answer: 'Risposta',
      }).success
    ).toBe(false);
  });

  it('rifiuta title vuoto', () => {
    expect(
      puzzleCreationSchema.safeParse({
        roundId: VALID_CUID,
        title: '',
        prompt: 'Prompt',
        answer: 'Risposta',
      }).success
    ).toBe(false);
  });

  it('rifiuta prompt vuoto', () => {
    expect(
      puzzleCreationSchema.safeParse({
        roundId: VALID_CUID,
        title: 'Enigma',
        prompt: '',
        answer: 'Risposta',
      }).success
    ).toBe(false);
  });

  it('rifiuta answer vuota', () => {
    expect(
      puzzleCreationSchema.safeParse({
        roundId: VALID_CUID,
        title: 'Enigma',
        prompt: 'Prompt',
        answer: '',
      }).success
    ).toBe(false);
  });

  it('accetta order e scoringJson opzionali', () => {
    expect(
      puzzleCreationSchema.safeParse({
        roundId: VALID_CUID,
        title: 'Enigma',
        prompt: 'Prompt',
        answer: 'Risposta',
        order: 0,
        scoringJson: { basePoints: 100 },
      }).success
    ).toBe(true);
  });

  it('rifiuta order negativo', () => {
    expect(
      puzzleCreationSchema.safeParse({
        roundId: VALID_CUID,
        title: 'Enigma',
        prompt: 'Prompt',
        answer: 'Risposta',
        order: -1,
      }).success
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// hintCreationSchema
// ---------------------------------------------------------------------------
describe('hintCreationSchema', () => {
  it('accetta dati validi', () => {
    expect(
      hintCreationSchema.safeParse({
        puzzleId: VALID_CUID,
        text: 'Suggerimento',
        penaltyPoints: 10,
        order: 1,
      }).success
    ).toBe(true);
  });

  it('accetta penaltyPoints pari a 0', () => {
    expect(
      hintCreationSchema.safeParse({
        puzzleId: VALID_CUID,
        text: 'Suggerimento',
        penaltyPoints: 0,
        order: 0,
      }).success
    ).toBe(true);
  });

  it('rifiuta puzzleId non CUID', () => {
    expect(
      hintCreationSchema.safeParse({
        puzzleId: 'invalido',
        text: 'Suggerimento',
        penaltyPoints: 10,
        order: 0,
      }).success
    ).toBe(false);
  });

  it('rifiuta text vuoto', () => {
    expect(
      hintCreationSchema.safeParse({
        puzzleId: VALID_CUID,
        text: '',
        penaltyPoints: 10,
        order: 0,
      }).success
    ).toBe(false);
  });

  it('rifiuta penaltyPoints negativi', () => {
    expect(
      hintCreationSchema.safeParse({
        puzzleId: VALID_CUID,
        text: 'Suggerimento',
        penaltyPoints: -5,
        order: 0,
      }).success
    ).toBe(false);
  });

  it('rifiuta order negativo', () => {
    expect(
      hintCreationSchema.safeParse({
        puzzleId: VALID_CUID,
        text: 'Suggerimento',
        penaltyPoints: 10,
        order: -1,
      }).success
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// tableCreationSchema
// ---------------------------------------------------------------------------
describe('tableCreationSchema', () => {
  it('accetta dati validi', () => {
    expect(
      tableCreationSchema.safeParse({ eventNightId: VALID_CUID, name: 'Tavolo 1' }).success
    ).toBe(true);
  });

  it('rifiuta eventNightId non CUID', () => {
    expect(
      tableCreationSchema.safeParse({ eventNightId: 'invalido', name: 'Tavolo 1' }).success
    ).toBe(false);
  });

  it('rifiuta name vuoto', () => {
    expect(
      tableCreationSchema.safeParse({ eventNightId: VALID_CUID, name: '' }).success
    ).toBe(false);
  });

  it('rifiuta name più lungo di 100 caratteri', () => {
    expect(
      tableCreationSchema.safeParse({ eventNightId: VALID_CUID, name: 'a'.repeat(101) }).success
    ).toBe(false);
  });

  it('accetta name di esattamente 100 caratteri', () => {
    expect(
      tableCreationSchema.safeParse({ eventNightId: VALID_CUID, name: 'a'.repeat(100) }).success
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// requestHintSchema
// ---------------------------------------------------------------------------
describe('requestHintSchema', () => {
  it('accetta puzzleId e hintId validi', () => {
    expect(
      requestHintSchema.safeParse({ puzzleId: VALID_CUID, hintId: VALID_CUID_2 }).success
    ).toBe(true);
  });

  it('rifiuta puzzleId non CUID', () => {
    expect(
      requestHintSchema.safeParse({ puzzleId: 'invalido', hintId: VALID_CUID_2 }).success
    ).toBe(false);
  });

  it('rifiuta hintId non CUID', () => {
    expect(
      requestHintSchema.safeParse({ puzzleId: VALID_CUID, hintId: 'invalido' }).success
    ).toBe(false);
  });

  it('rifiuta se entrambi i campi sono assenti', () => {
    expect(requestHintSchema.safeParse({}).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// allianceCreationSchema
// ---------------------------------------------------------------------------
describe('allianceCreationSchema', () => {
  it('accetta dati validi', () => {
    expect(
      allianceCreationSchema.safeParse({
        eventNightId: VALID_CUID,
        tableAId: VALID_CUID_2,
        tableBId: VALID_CUID_3,
      }).success
    ).toBe(true);
  });

  it('rifiuta eventNightId non CUID', () => {
    expect(
      allianceCreationSchema.safeParse({
        eventNightId: 'invalido',
        tableAId: VALID_CUID_2,
        tableBId: VALID_CUID_3,
      }).success
    ).toBe(false);
  });

  it('rifiuta tableAId non CUID', () => {
    expect(
      allianceCreationSchema.safeParse({
        eventNightId: VALID_CUID,
        tableAId: 'invalido',
        tableBId: VALID_CUID_3,
      }).success
    ).toBe(false);
  });

  it('rifiuta tableBId non CUID', () => {
    expect(
      allianceCreationSchema.safeParse({
        eventNightId: VALID_CUID,
        tableAId: VALID_CUID_2,
        tableBId: 'invalido',
      }).success
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// moduleToggleSchema
// ---------------------------------------------------------------------------
describe('moduleToggleSchema', () => {
  it('accetta enabled: true', () => {
    expect(moduleToggleSchema.safeParse({ enabled: true }).success).toBe(true);
  });

  it('accetta enabled: false', () => {
    expect(moduleToggleSchema.safeParse({ enabled: false }).success).toBe(true);
  });

  it('rifiuta una stringa al posto di boolean', () => {
    expect(moduleToggleSchema.safeParse({ enabled: 'true' }).success).toBe(false);
  });

  it('rifiuta se enabled è assente', () => {
    expect(moduleToggleSchema.safeParse({}).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// moduleConfigSchema
// ---------------------------------------------------------------------------
describe('moduleConfigSchema', () => {
  it('accetta un configJson con chiavi arbitrarie', () => {
    expect(
      moduleConfigSchema.safeParse({ configJson: { key: 'valore', numero: 42 } }).success
    ).toBe(true);
  });

  it('accetta un configJson vuoto', () => {
    expect(moduleConfigSchema.safeParse({ configJson: {} }).success).toBe(true);
  });

  it('rifiuta se configJson è una stringa', () => {
    expect(moduleConfigSchema.safeParse({ configJson: 'non-un-oggetto' }).success).toBe(false);
  });

  it('rifiuta se configJson è assente', () => {
    expect(moduleConfigSchema.safeParse({}).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// moduleExecuteSchema
// ---------------------------------------------------------------------------
describe('moduleExecuteSchema', () => {
  it('accetta roundId valido senza input opzionale', () => {
    expect(moduleExecuteSchema.safeParse({ roundId: VALID_CUID }).success).toBe(true);
  });

  it('accetta roundId con input opzionale', () => {
    expect(
      moduleExecuteSchema.safeParse({ roundId: VALID_CUID, input: { scelta: 'carta' } }).success
    ).toBe(true);
  });

  it('rifiuta roundId non CUID', () => {
    expect(moduleExecuteSchema.safeParse({ roundId: 'invalido' }).success).toBe(false);
  });

  it('rifiuta se roundId è assente', () => {
    expect(moduleExecuteSchema.safeParse({}).success).toBe(false);
  });

  it('accetta input di qualsiasi tipo (unknown)', () => {
    expect(moduleExecuteSchema.safeParse({ roundId: VALID_CUID, input: 42 }).success).toBe(true);
    expect(moduleExecuteSchema.safeParse({ roundId: VALID_CUID, input: null }).success).toBe(true);
    expect(
      moduleExecuteSchema.safeParse({ roundId: VALID_CUID, input: ['a', 'b'] }).success
    ).toBe(true);
  });
});
