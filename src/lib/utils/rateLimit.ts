import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase/admin';
import { env } from '@/lib/server/env';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt?: Date;
}

interface RateLimitKeys {
  fpHash: string;
  ipHash: string;
}

interface LimitState {
  count: number;
  windowStart: Date;
  allowed: boolean;
  resetAt: Date;
}

function evaluateLimit(
  data: FirebaseFirestore.DocumentData | undefined,
  maxReports: number,
  windowMs: number,
  now: Date
): LimitState {
  if (!data) {
    return {
      count: 1,
      windowStart: now,
      allowed: true,
      resetAt: now,
    };
  }

  const windowStart = (data.windowStart as admin.firestore.Timestamp).toDate();
  const timeElapsed = now.getTime() - windowStart.getTime();

  if (timeElapsed >= windowMs) {
    return {
      count: 1,
      windowStart: now,
      allowed: true,
      resetAt: now,
    };
  }

  const currentCount = data.count as number;
  if (currentCount >= maxReports) {
    return {
      count: currentCount,
      windowStart,
      allowed: false,
      resetAt: new Date(windowStart.getTime() + windowMs),
    };
  }

  return {
    count: currentCount + 1,
    windowStart,
    allowed: true,
    resetAt: now,
  };
}

export async function applyRateLimitInTransaction(
  transaction: FirebaseFirestore.Transaction,
  keys: RateLimitKeys
): Promise<RateLimitResult> {
  const { fpHash, ipHash } = keys;
  const fpRef = adminDb.collection('rate_limits').doc(`fp:${fpHash}`);
  const ipRef = adminDb.collection('rate_limits').doc(`ip:${ipHash}`);
  const windowMs = env.RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000;
  const now = new Date();

  const fpSnap = await transaction.get(fpRef);
  const ipSnap = await transaction.get(ipRef);
  const fpData = fpSnap.data();
  const ipData = ipSnap.data();

  const fpLimit = evaluateLimit(fpData, env.MAX_REPORTS_PER_DAY_FP, windowMs, now);
  const ipLimit = evaluateLimit(ipData, env.MAX_REPORTS_PER_DAY_IP, windowMs, now);

  if (!fpLimit.allowed || !ipLimit.allowed) {
    const worstResetAt = fpLimit.resetAt > ipLimit.resetAt ? fpLimit.resetAt : ipLimit.resetAt;
    const remainingFp = Math.max(0, env.MAX_REPORTS_PER_DAY_FP - (fpData?.count || 0));
    const remainingIp = Math.max(0, env.MAX_REPORTS_PER_DAY_IP - (ipData?.count || 0));

    return {
      allowed: false,
      remaining: Math.min(remainingFp, remainingIp),
      resetAt: worstResetAt,
    };
  }

  transaction.set(fpRef, {
    type: 'fp',
    hash: fpHash,
    count: fpLimit.count,
    windowStart: admin.firestore.Timestamp.fromDate(fpLimit.windowStart),
    lastReportAt: admin.firestore.Timestamp.fromDate(now),
  }, { merge: true });

  transaction.set(ipRef, {
    type: 'ip',
    hash: ipHash,
    count: ipLimit.count,
    windowStart: admin.firestore.Timestamp.fromDate(ipLimit.windowStart),
    lastReportAt: admin.firestore.Timestamp.fromDate(now),
  }, { merge: true });

  return {
    allowed: true,
    remaining: Math.min(
      env.MAX_REPORTS_PER_DAY_FP - fpLimit.count,
      env.MAX_REPORTS_PER_DAY_IP - ipLimit.count
    ),
  };
}

export async function checkRateLimit(keys: RateLimitKeys): Promise<RateLimitResult> {
  return adminDb.runTransaction((transaction) => {
    return applyRateLimitInTransaction(transaction, keys);
  });
}
