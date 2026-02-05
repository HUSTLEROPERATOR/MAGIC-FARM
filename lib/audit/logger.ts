import prisma from '@/lib/db/prisma';
import { hashIP } from '@/lib/security/crypto';

interface AuditLogData {
  action: string;
  actorUserId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog({
  action,
  actorUserId,
  metadata,
  ipAddress,
  userAgent,
}: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        actorUserId: actorUserId || null,
        metaJson: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
        ipHash: ipAddress ? hashIP(ipAddress) : null,
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

  // Privacy
  USER_DATA_EXPORT: 'USER_DATA_EXPORT',
  USER_DELETE_REQUEST: 'USER_DELETE_REQUEST',
  USER_DELETED: 'USER_DELETED',
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
