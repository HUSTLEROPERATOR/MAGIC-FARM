import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { hashWithSalt, verifyHash, generateSecureToken } from '@/lib/security/crypto';
import { createAuditLog } from '@/lib/audit/logger';
import type { MagicModuleHandler, ModuleContext } from '../types';

// ─── Constants ────────────────────────────────────────────────────────────────

export const FIRMA_SIGILLATA_KEY = 'FIRMA_SIGILLATA';
/** Sentinel roundId for event-level SYSTEM artifacts (not tied to a specific round). */
const ROUND_EVENT = '_event';

// ─── Config ───────────────────────────────────────────────────────────────────

const configSchema = z.object({
  configVersion: z.literal(1),
  /** The phrase the admin is predicting. Never sent to clients. */
  targetPhrase: z.string().min(1).max(200),
  /**
   * force_first: selects the chronologically first submission as the "winner".
   * force_seed:  selects deterministically based on presentationSeed.
   */
  equivoqueMode: z.enum(['force_first', 'force_seed']).default('force_seed'),
  /** Varies presentation framing per event without affecting the forced outcome. */
  presentationSeed: z.string().min(1).default('default'),
  maxSubmissions: z.number().int().min(1).max(500).default(100),
});
export type FirmaSigillatConfig = z.infer<typeof configSchema>;

// ─── Input ────────────────────────────────────────────────────────────────────

const inputSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('get_commit') }),
  z.object({
    action: z.literal('submit_thought'),
    thought: z.string().min(1).max(200).trim(),
  }),
]);
type FirmaInput = z.infer<typeof inputSchema>;

// ─── Internal Types ───────────────────────────────────────────────────────────

/** Stored in ModuleInteraction.state for the SYSTEM artifact. Never returned to clients. */
interface SystemArtifactState {
  commitHash: string;
  _nonce: string;
  _targetPhrase: string;
  lockedAt: string;
}

/** Stored in ModuleInteraction.state for USER artifacts. */
interface UserSubmissionState {
  thought: string;
}

// ─── Exported Helpers (for admin routes only) ─────────────────────────────────

/**
 * Reads the SYSTEM artifact for this event.
 * Contains commitHash, nonce, and targetPhrase — server-side only.
 * Call only from code that has already verified admin access.
 */
export async function readSystemArtifact(
  eventNightId: string,
): Promise<{ id: string; state: SystemArtifactState } | null> {
  const artifact = await prisma.moduleInteraction.findFirst({
    where: {
      eventNightId,
      moduleKey: FIRMA_SIGILLATA_KEY,
      actor: 'SYSTEM',
      roundId: ROUND_EVENT,
    },
  });
  if (!artifact?.state) return null;
  return { id: artifact.id, state: artifact.state as unknown as SystemArtifactState };
}

/**
 * Reads all completed USER submissions for this event.
 * Call only from code that has already verified admin access.
 */
export async function readSubmissions(eventNightId: string) {
  return prisma.moduleInteraction.findMany({
    where: {
      eventNightId,
      moduleKey: FIRMA_SIGILLATA_KEY,
      actor: 'USER',
      status: 'COMPLETED',
    },
    select: { userId: true, tableId: true, state: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Admin-only: reveal prediction with cryptographic verification.
 *
 * MUST only be called from routes protected by requireAdmin().
 * Returns nonce + targetPhrase + hash — enough for audience-verifiable reveal.
 */
export async function adminReveal(eventNightId: string, config: FirmaSigillatConfig) {
  const artifact = await readSystemArtifact(eventNightId);
  if (!artifact) {
    return { success: false as const, error: 'Sessione non trovata. Riabilita il modulo.' };
  }

  const { commitHash, _nonce, _targetPhrase, lockedAt } = artifact.state;
  const verified = verifyHash(_targetPhrase, commitHash, _nonce);

  const submissions = await readSubmissions(eventNightId);

  let winnerIndex = 0;
  if (config.equivoqueMode === 'force_seed' && submissions.length > 0) {
    const seedNum = parseInt(config.presentationSeed.replace(/\D/g, '') || '1', 10);
    winnerIndex = seedNum % submissions.length;
  }
  const winner = submissions[winnerIndex] ?? null;

  await createAuditLog({
    action: 'MENTALISM_FIRMA_REVEALED',
    metadata: {
      eventNightId,
      commitHash,
      submissionsCount: submissions.length,
      winnerUserId: winner?.userId ?? null,
      verified,
      // _nonce and _targetPhrase intentionally omitted from audit
    },
  });

  return {
    success: true as const,
    data: {
      targetPhrase: _targetPhrase,
      nonce: _nonce,
      commitHash,
      algorithm: 'SHA-256',
      verified,
      lockedAt,
      submissionsCount: submissions.length,
      winner: winner
        ? {
            userId: winner.userId,
            tableId: winner.tableId,
            thought: (winner.state as UserSubmissionState | null)?.thought ?? null,
          }
        : null,
    },
  };
}

// ─── Module Handler ───────────────────────────────────────────────────────────

export const firmaSigillata: MagicModuleHandler<FirmaSigillatConfig, FirmaInput> = {
  key: FIRMA_SIGILLATA_KEY,
  meta: {
    name: 'Firma Sigillata',
    description:
      'Predizione bloccata con commit SHA-256 + nonce prima dello show. Il pubblico invia i propri "pensieri" durante la serata; al reveal il mago dimostra la corrispondenza criptograficamente verificabile.',
    icon: 'Fingerprint',
    difficulty: 'avanzato',
    scope: 'global',
    priority: 60,
    magicianControlled: true,
  },
  ui: {
    fields: {
      targetPhrase: { label: 'Predizione segreta', kind: 'text' },
      equivoqueMode: {
        label: 'Modalità selezione vincitore',
        kind: 'select',
        options: ['force_first', 'force_seed'],
      },
      presentationSeed: { label: 'Seed presentazione (es. "serata3")', kind: 'text' },
      maxSubmissions: { label: 'Max invii', kind: 'number', min: 1, max: 500 },
    },
  },
  defaultConfig: {
    configVersion: 1,
    targetPhrase: 'Sette di Cuori',
    equivoqueMode: 'force_seed',
    presentationSeed: 'serata1',
    maxSubmissions: 100,
  },
  validateConfig: (config) => configSchema.parse(config),
  validateInput: (input) => inputSchema.parse(input),

  /**
   * Called when admin enables the module for an event.
   * Generates nonce + commitHash; stores as SYSTEM artifact.
   * Idempotent: skips if artifact already exists.
   */
  onEnable: async (ctx: ModuleContext, config: FirmaSigillatConfig) => {
    const existing = await prisma.moduleInteraction.findFirst({
      where: {
        eventNightId: ctx.eventNightId,
        moduleKey: FIRMA_SIGILLATA_KEY,
        actor: 'SYSTEM',
        roundId: ROUND_EVENT,
      },
    });
    if (existing) return;

    const nonce = generateSecureToken(16);
    const { hash: commitHash } = hashWithSalt(config.targetPhrase, nonce);

    const state: SystemArtifactState = {
      commitHash,
      _nonce: nonce,
      _targetPhrase: config.targetPhrase,
      lockedAt: new Date().toISOString(),
    };

    await prisma.moduleInteraction.create({
      data: {
        eventNightId: ctx.eventNightId,
        roundId: ROUND_EVENT,
        moduleKey: FIRMA_SIGILLATA_KEY,
        actor: 'SYSTEM',
        status: 'COMPLETED',
        state: state as unknown as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    });

    await createAuditLog({
      action: 'MENTALISM_FIRMA_LOCKED',
      metadata: {
        eventNightId: ctx.eventNightId,
        commitHash,
        // nonce and targetPhrase intentionally NOT logged here
      },
    });
  },

  /** Module is available only after onEnable has created the SYSTEM artifact. */
  isAvailable: async (ctx: ModuleContext) => {
    const artifact = await prisma.moduleInteraction.findFirst({
      where: {
        eventNightId: ctx.eventNightId,
        moduleKey: FIRMA_SIGILLATA_KEY,
        actor: 'SYSTEM',
        roundId: ROUND_EVENT,
      },
      select: { id: true },
    });
    return artifact !== null;
  },

  run: async (ctx: ModuleContext, config: FirmaSigillatConfig, input: FirmaInput) => {
    // ── get_commit ──────────────────────────────────────────────────────────
    if (input.action === 'get_commit') {
      const artifact = await readSystemArtifact(ctx.eventNightId);
      if (!artifact) {
        return {
          success: false,
          code: 'NOT_AVAILABLE' as const,
          error: 'Sessione non ancora inizializzata.',
        };
      }
      // Return ONLY commitHash — no nonce, no targetPhrase
      return {
        success: true,
        data: {
          commitHash: artifact.state.commitHash,
          algorithm: 'SHA-256',
          lockedAt: artifact.state.lockedAt,
          message:
            'Questo hash è stato generato prima della serata. La predizione è sigillata criptograficamente.',
        },
      };
    }

    // ── submit_thought ───────────────────────────────────────────────────────
    if (input.action === 'submit_thought') {
      if (!ctx.userId) {
        return {
          success: false,
          code: 'VALIDATION_ERROR' as const,
          error: 'Autenticazione richiesta.',
        };
      }

      // Check maxSubmissions (approximate — no transaction needed for soft limit)
      const count = await prisma.moduleInteraction.count({
        where: {
          eventNightId: ctx.eventNightId,
          moduleKey: FIRMA_SIGILLATA_KEY,
          actor: 'USER',
        },
      });
      if (count >= config.maxSubmissions) {
        return {
          success: false,
          code: 'NOT_AVAILABLE' as const,
          error: 'Limite invii raggiunto.',
        };
      }

      const roundId = ctx.roundId ?? ROUND_EVENT;
      const state: UserSubmissionState = { thought: input.thought };

      // Safe upsert via findFirst + create/update (handles nullable tableId correctly)
      await prisma.$transaction(async (tx) => {
        const existing = await tx.moduleInteraction.findFirst({
          where: {
            eventNightId: ctx.eventNightId,
            roundId,
            moduleKey: FIRMA_SIGILLATA_KEY,
            actor: 'USER',
            userId: ctx.userId,
          },
          select: { id: true },
        });
        if (existing) {
          await tx.moduleInteraction.update({
            where: { id: existing.id },
            data: {
              state: state as unknown as Prisma.InputJsonValue,
              updatedAt: new Date(),
            },
          });
        } else {
          await tx.moduleInteraction.create({
            data: {
              eventNightId: ctx.eventNightId,
              roundId,
              moduleKey: FIRMA_SIGILLATA_KEY,
              actor: 'USER',
              userId: ctx.userId,
              tableId: ctx.tableId ?? null,
              status: 'COMPLETED',
              state: state as unknown as Prisma.InputJsonValue,
              completedAt: new Date(),
            },
          });
        }
      });

      await createAuditLog({
        action: 'MENTALISM_THOUGHT_SUBMITTED',
        actorUserId: ctx.userId,
        metadata: {
          eventNightId: ctx.eventNightId,
          moduleKey: FIRMA_SIGILLATA_KEY,
          // thought intentionally NOT logged
        },
      });

      return {
        success: true,
        data: {
          received: true,
          message: 'Il tuo pensiero è stato ricevuto.',
        },
      };
    }

    // Unreachable — Zod discriminatedUnion ensures exhaustiveness
    return { success: false, code: 'VALIDATION_ERROR' as const, error: 'Azione non riconosciuta.' };
  },
};
