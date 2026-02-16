import prisma from '@/lib/db/prisma';
import { hashIP } from '@/lib/security/crypto';
import crypto from 'crypto';

interface AuditLogData {
  action: string;
  actorUserId?: string;
  actorRole?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  /** Optional caller-provided requestId; auto-generated if omitted */
  requestId?: string;
}

/**
 * Create an audit log entry.
 *
 * Automatically injects:
 * - requestId   — unique per-request identifier for correlation
 * - ipHash      — SHA-256 of the raw IP (raw IP is NEVER stored)
 *
 * Raw IP addresses are never persisted in the audit log.
 */
export async function createAuditLog({
  action,
  actorUserId,
  actorRole,
  metadata,
  ipAddress,
  userAgent,
  requestId,
}: AuditLogData): Promise<void> {
  try {
    const reqId = requestId || crypto.randomUUID();
    const ipHashValue = ipAddress ? hashIP(ipAddress) : null;

    // Inject requestId and ipHash into metadata for every entry
    const enrichedMeta = {
      ...(metadata || {}),
      requestId: reqId,
      ...(ipHashValue ? { ipHash: ipHashValue } : {}),
    };

    await prisma.auditLog.create({
      data: {
        action,
        actorUserId: actorUserId || null,
        actorRole: actorRole || null,
        metaJson: JSON.parse(JSON.stringify(enrichedMeta)),
        ipHash: ipHashValue,
        userAgent: userAgent || null,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging failures shouldn't break the app
  }
}

/**
 * Common audit log actions
 */
export const AUDIT_ACTIONS = {
  // Authentication
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_REGISTER: 'USER_REGISTER',
  EMAIL_VERIFIED: 'EMAIL_VERIFIED',
  
  // Consent
  PRIVACY_ACCEPTED: 'PRIVACY_ACCEPTED',
  MARKETING_OPT_IN: 'MARKETING_OPT_IN',
  MARKETING_OPT_OUT: 'MARKETING_OPT_OUT',
  
  // Game actions
  GAME_JOIN: 'GAME_JOIN',
  TABLE_JOIN: 'TABLE_JOIN',
  TABLE_LEAVE: 'TABLE_LEAVE',
  ANSWER_SUBMITTED: 'ANSWER_SUBMITTED',
  HINT_REQUESTED: 'HINT_REQUESTED',
  
  // Admin actions
  ADMIN_EVENT_CREATE: 'ADMIN_EVENT_CREATE',
  ADMIN_EVENT_UPDATE: 'ADMIN_EVENT_UPDATE',
  ADMIN_ROUND_CREATE: 'ADMIN_ROUND_CREATE',
  ADMIN_ROUND_UPDATE: 'ADMIN_ROUND_UPDATE',
  ADMIN_PUZZLE_CREATE: 'ADMIN_PUZZLE_CREATE',
  ADMIN_TABLE_CREATE: 'ADMIN_TABLE_CREATE',
  ADMIN_MESSAGE_HIDDEN: 'ADMIN_MESSAGE_HIDDEN',
  ADMIN_USER_BANNED: 'ADMIN_USER_BANNED',
  ADMIN_CONSENT_EXPORT: 'ADMIN_CONSENT_EXPORT',
  
  // Onboarding & Alias
  ONBOARDING_COMPLETED: 'ONBOARDING_COMPLETED',
  CONSENT_UPDATED: 'CONSENT_UPDATED',
  ALIAS_ATTEMPT: 'ALIAS_ATTEMPT',
  ALIAS_SET_SUCCESS: 'ALIAS_SET_SUCCESS',
  ALIAS_SET_CONFLICT: 'ALIAS_SET_CONFLICT',
  ALIAS_SET_FAILURE: 'ALIAS_SET_FAILURE',

  // Magic Link
  AUTH_MAGIC_LINK_REQUESTED: 'AUTH_MAGIC_LINK_REQUESTED',

  // Host operations
  HOST_EXPORT_ATTEMPT: 'HOST_EXPORT_ATTEMPT',
  HOST_INVITE_SENT: 'HOST_INVITE_SENT',
  HOST_INVITE_RATE_LIMIT: 'HOST_INVITE_RATE_LIMIT',
  HOST_INVITE_DUPLICATE: 'HOST_INVITE_DUPLICATE',
  HOST_INVITE_TURNSTILE_FAIL: 'HOST_INVITE_TURNSTILE_FAIL',
  HOST_EXPORT_RATE_LIMIT: 'HOST_EXPORT_RATE_LIMIT',

  // Consent
  CONSENT_REVOKED: 'CONSENT_REVOKED',

  // Anti-cheat
  SUBMISSION_COOLDOWN_BLOCKED: 'SUBMISSION_COOLDOWN_BLOCKED',
  SUBMISSION_IP_PATTERN_BLOCKED: 'SUBMISSION_IP_PATTERN_BLOCKED',

  // Privacy
  USER_DATA_EXPORT: 'USER_DATA_EXPORT',
  USER_DELETE_REQUEST: 'USER_DELETE_REQUEST',
  USER_DELETED: 'USER_DELETED',

  // Magic Modules
  MODULE_ENABLED: 'MODULE_ENABLED',
  MODULE_DISABLED: 'MODULE_DISABLED',
  MODULE_CONFIGURED: 'MODULE_CONFIGURED',
  MODULE_EXECUTED: 'MODULE_EXECUTED',
  MODULE_EXECUTION_BLOCKED: 'MODULE_EXECUTION_BLOCKED',
} as const;

/**
 * Query audit logs with filters
 */
export async function getAuditLogs(params: {
  actorUserId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const { actorUserId, action, startDate, endDate, limit = 100, offset = 0 } = params;

  return prisma.auditLog.findMany({
    where: {
      ...(actorUserId && { actorUserId }),
      ...(action && { action }),
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          }
        : {}),
    },
    include: {
      actorUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          alias: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    skip: offset,
  });
}
