import { adminDb } from '@/lib/firebase/admin';
import { GetReportsQueryInput } from '@/lib/validators/report.schema';
import { getGeohashRangesForBounds } from '@/lib/utils/geoUtils';
import {
  FirestoreReportDoc,
  mapFirestoreDocForView,
  mapFirestoreDocToReport,
  ReportListItem,
} from './reportMapper';
import { Report } from '@/types/report';

const PUBLIC_REPORT_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=10, stale-while-revalidate=30',
  'CDN-Cache-Control': 'public, max-age=10, stale-while-revalidate=30',
};

export function getPublicReportCacheHeaders() {
  return PUBLIC_REPORT_CACHE_HEADERS;
}

function applyCommonReportFilters(
  query: FirebaseFirestore.Query,
  filters: Pick<GetReportsQueryInput, 'category' | 'timeframe'>
) {
  const { category, timeframe } = filters;
  let nextQuery = query;

  if (category && category.length > 0) {
    nextQuery = nextQuery.where('category', 'in', category);
  }

  nextQuery = nextQuery.where('status', '==', 'ACTIVE');

  if (timeframe && timeframe !== 'all') {
    const hours = timeframe === '24h' ? 24 : timeframe === '7d' ? 7 * 24 : 30 * 24;
    const thresholdDate = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    nextQuery = nextQuery.where('createdAt', '>=', thresholdDate);
  }

  return nextQuery;
}

async function getPublicReportDocs(queryInput: GetReportsQueryInput): Promise<FirestoreReportDoc[]> {
  const { category, limit, timeframe, south, north, west, east, view } = queryInput;
  const maxAllowedLimit = view === 'heatmap' ? 1000 : 500;
  const finalLimit = limit ? Math.min(limit, maxAllowedLimit) : maxAllowedLimit;
  const hasBounds = south !== undefined && north !== undefined && west !== undefined && east !== undefined;

  if (hasBounds) {
    const ranges = getGeohashRangesForBounds(south, north, west, east);
    const snapshots = await Promise.all(
      ranges.map(([start, end]) => {
        let q: FirebaseFirestore.Query = adminDb.collection('reports');
        q = applyCommonReportFilters(q, { category, timeframe });
        return q.orderBy('geohash').startAt(start).endAt(end).get();
      })
    );

    const docMap = new Map<string, FirebaseFirestore.DocumentData>();
    snapshots.forEach((snapshot) => {
      snapshot.docs.forEach((doc) => {
        docMap.set(doc.id, doc.data());
      });
    });

    const docs: FirestoreReportDoc[] = [];
    docMap.forEach((data, id) => {
      const latVal = data.lat as number;
      const lngVal = data.lng as number;
      if (latVal >= south && latVal <= north && lngVal >= west && lngVal <= east) {
        docs.push({ id, data });
      }
    });

    return docs
      .sort((a, b) => b.data.createdAt.localeCompare(a.data.createdAt))
      .slice(0, finalLimit);
  }

  let q: FirebaseFirestore.Query = adminDb.collection('reports');
  q = applyCommonReportFilters(q, { category, timeframe });
  q = q.orderBy('createdAt', 'desc').limit(finalLimit);

  const snapshot = await q.get();
  return snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
}

export async function listPublicReports(queryInput: GetReportsQueryInput): Promise<ReportListItem[]> {
  const docs = await getPublicReportDocs(queryInput);
  return docs.map((doc) => mapFirestoreDocForView(doc.id, doc.data, queryInput.view));
}

export async function listAdminReports(): Promise<Report[]> {
  const snapshot = await adminDb
    .collection('reports')
    .orderBy('createdAt', 'desc')
    .limit(1000)
    .get();

  return snapshot.docs.map((doc) => mapFirestoreDocToReport(doc.id, doc.data()));
}
