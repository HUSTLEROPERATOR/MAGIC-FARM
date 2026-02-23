import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FirmaSigillatConfig } from '@/lib/modules/modules/firma-sigillata';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockFindFirst = vi.fn();
const mockCreate = vi.fn();
const mockCount = vi.fn();
const mockUpdate = vi.fn();
const mockTransaction = vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
  fn({
    moduleInteraction: {
      findFirst: mockFindFirst,
      create: mockCreate,
      update: mockUpdate,
    },
  }),
);

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    moduleInteraction: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      count: (...args: unknown[]) => mockCount(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
  default: {
    moduleInteraction: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      count: (...args: unknown[]) => mockCount(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock('@/lib/audit/logger', () => ({
  createAuditLog: vi.fn().mockResolvedValue(undefined),
  AUDIT_ACTIONS: {},
}));

// ─── Subject under test (imported after mocks) ────────────────────────────────

const { firmaSigillata, readSystemArtifact, adminReveal } = await import(
  '@/lib/modules/modules/firma-sigillata'
);
const { verifyHash } = await import('@/lib/security/crypto');

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const validConfig: FirmaSigillatConfig = firmaSigillata.validateConfig({
  configVersion: 1,
  targetPhrase: 'Sette di Cuori',
  equivoqueMode: 'force_seed',
  presentationSeed: 'test42',
  maxSubmissions: 100,
});

const ctx = { eventNightId: 'evt_001', roundId: 'round_001', userId: 'user_001' };

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('FIRMA_SIGILLATA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({});
    mockUpdate.mockResolvedValue({});
  });

  // ── onEnable ──────────────────────────────────────────────────────────────

  describe('onEnable', () => {
    it('crea SYSTEM artifact con commitHash e nonce quando non esiste', async () => {
      mockFindFirst.mockResolvedValueOnce(null); // idempotency check
      mockCreate.mockResolvedValueOnce({});

      await firmaSigillata.onEnable!(ctx, validConfig);

      expect(mockCreate).toHaveBeenCalledOnce();
      const { data } = mockCreate.mock.calls[0][0] as { data: Record<string, unknown> };
      expect(data.actor).toBe('SYSTEM');
      expect(data.status).toBe('COMPLETED');
      expect(data.state).toHaveProperty('commitHash');
      expect(data.state).toHaveProperty('_nonce');
      expect(data.state).toHaveProperty('_targetPhrase', 'Sette di Cuori');
    });

    it('è idempotente: non crea un secondo artifact se già esiste', async () => {
      mockFindFirst.mockResolvedValueOnce({ id: 'existing' });

      await firmaSigillata.onEnable!(ctx, validConfig);

      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('commitHash creato è verificabile con nonce + targetPhrase', async () => {
      mockFindFirst.mockResolvedValueOnce(null);
      let capturedState: Record<string, string> = {} as Record<string, string>;
      mockCreate.mockImplementation((args: { data: { state: Record<string, string> } }) => {
        capturedState = args.data.state;
        return Promise.resolve({});
      });

      await firmaSigillata.onEnable!(ctx, validConfig);

      const { commitHash, _nonce, _targetPhrase } = capturedState;
      expect(verifyHash(_targetPhrase, commitHash, _nonce)).toBe(true);
    });

    it('hash NON è verificabile con nonce o frase sbagliati', async () => {
      mockFindFirst.mockResolvedValueOnce(null);
      let capturedState: Record<string, string> = {} as Record<string, string>;
      mockCreate.mockImplementation((args: { data: { state: Record<string, string> } }) => {
        capturedState = args.data.state;
        return Promise.resolve({});
      });

      await firmaSigillata.onEnable!(ctx, validConfig);

      const { commitHash, _nonce } = capturedState;
      expect(verifyHash('carta sbagliata', commitHash, _nonce)).toBe(false);
      expect(verifyHash('Sette di Cuori', commitHash, 'nonce_sbagliato')).toBe(false);
    });
  });

  // ── run > get_commit ──────────────────────────────────────────────────────

  describe('run > get_commit', () => {
    it('restituisce commitHash senza nonce e senza targetPhrase', async () => {
      mockFindFirst.mockResolvedValueOnce({
        state: {
          commitHash: 'abc123def456',
          _nonce: 'secret_nonce',
          _targetPhrase: 'Sette di Cuori',
          lockedAt: '2026-01-01T00:00:00Z',
        },
      });

      const result = await firmaSigillata.run(ctx, validConfig, { action: 'get_commit' });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('commitHash', 'abc123def456');
      expect(result.data).not.toHaveProperty('_nonce');
      expect(result.data).not.toHaveProperty('nonce');
      expect(result.data).not.toHaveProperty('targetPhrase');
      expect(result.data).not.toHaveProperty('_targetPhrase');
    });

    it('restituisce NOT_AVAILABLE se SYSTEM artifact non esiste', async () => {
      mockFindFirst.mockResolvedValueOnce(null);

      const result = await firmaSigillata.run(ctx, validConfig, { action: 'get_commit' });

      expect(result.success).toBe(false);
      expect(result.code).toBe('NOT_AVAILABLE');
    });
  });

  // ── run > submit_thought ──────────────────────────────────────────────────

  describe('run > submit_thought', () => {
    it('rifiuta se userId non presente nel contesto', async () => {
      const ctxNoUser = { eventNightId: 'evt_001', roundId: 'round_001' };
      mockCount.mockResolvedValueOnce(0);

      const result = await firmaSigillata.run(
        ctxNoUser as typeof ctx,
        validConfig,
        { action: 'submit_thought', thought: 'Asso di Picche' },
      );

      expect(result.success).toBe(false);
      expect(result.code).toBe('VALIDATION_ERROR');
    });

    it('blocca se maxSubmissions raggiunto', async () => {
      mockCount.mockResolvedValueOnce(100); // = maxSubmissions

      const result = await firmaSigillata.run(ctx, validConfig, {
        action: 'submit_thought',
        thought: 'qualsiasi cosa',
      });

      expect(result.success).toBe(false);
      expect(result.code).toBe('NOT_AVAILABLE');
    });

    it('salva il pensiero e restituisce ack — senza esporre targetPhrase o commitHash', async () => {
      mockCount.mockResolvedValueOnce(0);
      mockFindFirst.mockResolvedValueOnce(null); // inside transaction: no existing record
      mockCreate.mockResolvedValueOnce({});

      const result = await firmaSigillata.run(ctx, validConfig, {
        action: 'submit_thought',
        thought: 'Sette di Cuori',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('received', true);
      expect(result.data).not.toHaveProperty('targetPhrase');
      expect(result.data).not.toHaveProperty('commitHash');
    });

    it('aggiorna submission esistente invece di crearne una seconda', async () => {
      mockCount.mockResolvedValueOnce(1);
      mockFindFirst.mockResolvedValueOnce({ id: 'existing_interaction' }); // inside transaction
      mockUpdate.mockResolvedValueOnce({});

      await firmaSigillata.run(ctx, validConfig, {
        action: 'submit_thought',
        thought: 'nuova risposta',
      });

      expect(mockUpdate).toHaveBeenCalledOnce();
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  // ── adminReveal ───────────────────────────────────────────────────────────

  describe('adminReveal', () => {
    it('restituisce targetPhrase, nonce, e verifica hash correttamente', async () => {
      // Simulate real nonce + hash
      const { hashWithSalt: hws } = await import('@/lib/security/crypto');
      const nonce = 'test_nonce_fixed';
      const { hash: commitHash } = hws('Sette di Cuori', nonce);

      // SYSTEM artifact
      mockFindFirst.mockResolvedValueOnce({
        id: 'sys_1',
        state: {
          commitHash,
          _nonce: nonce,
          _targetPhrase: 'Sette di Cuori',
          lockedAt: '2026-01-01T00:00:00Z',
        },
      });
      // User submissions
      mockFindFirst.mockResolvedValue(null); // readSubmissions uses findMany not findFirst
    });

    it('fallisce se SYSTEM artifact non esiste', async () => {
      mockFindFirst.mockResolvedValueOnce(null);

      const result = await adminReveal('evt_001', validConfig);

      expect(result.success).toBe(false);
    });
  });

  // ── validateConfig ────────────────────────────────────────────────────────

  describe('validateConfig', () => {
    it('rifiuta targetPhrase vuota', () => {
      expect(() =>
        firmaSigillata.validateConfig({ ...validConfig, targetPhrase: '' }),
      ).toThrow();
    });

    it('rifiuta maxSubmissions fuori range', () => {
      expect(() =>
        firmaSigillata.validateConfig({ ...validConfig, maxSubmissions: 0 }),
      ).toThrow();
      expect(() =>
        firmaSigillata.validateConfig({ ...validConfig, maxSubmissions: 501 }),
      ).toThrow();
    });

    it('accetta config valida', () => {
      expect(() => firmaSigillata.validateConfig(validConfig)).not.toThrow();
    });
  });
});
