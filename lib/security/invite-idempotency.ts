/**
 * Invite idempotency service.
 *
 * Generates a deterministic inviteBatchId from (hostId, eventId, sorted userIds).
 * Stores it in AuditLog and rejects duplicate batches within a 10-minute window.
 */

import crypto from 'crypto';
import { prisma } from '@/lib/db/prisma';

const IDEMPOTENCY_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Generate a deterministic batch ID from the invite parameters.
 * Same host + event + same set of users (order-independent) = same batchId.
 */
export function generateInviteBatchId(
  hostId: string,
  eventId: string,
  userIds: string[]
): string {
  const sortedUsers = [...userIds].sort().join(',');
  const payload = `${hostId}|${eventId}|${sortedUsers}`;
  return crypto.createHash('sha256').update(payload).digest('hex').slice(0, 32);
}

/**
 * Check if an invite batch with the same batchId was already sent
 * within the idempotency window (10 minutes).
 *
 * Looks at AuditLog entries with action HOST_INVITE_SENT.
 */
export async function isDuplicateInviteBatch(batchId: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - IDEMPOTENCY_WINDOW_MS);

  const existing = await prisma.auditLog.findFirst({
    where: {
      action: 'HOST_INVITE_SENT',
      createdAt: { gte: windowStart },
      metaJson: {
        path: ['inviteBatchId'],
        equals: batchId,
      },
    },
    select: { id: true },
  });

  return !!existing;
}
