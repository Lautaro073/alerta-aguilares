import { DEFAULT_CITY_ID } from '@/lib/constants/city';
import { CategoryId } from '@/lib/constants/categories';
import { encodeGeohash } from '@/lib/utils/geoUtils';
import { Report } from '@/types/report';

export interface HeatmapPoint {
  lat: number;
  lng: number;
}

export type ReportView = 'markers' | 'heatmap';
export type ReportListItem = Report | HeatmapPoint;

export interface FirestoreReportDoc {
  id: string;
  data: FirebaseFirestore.DocumentData;
}

export function mapFirestoreDocToReport(
  id: string,
  data: FirebaseFirestore.DocumentData
): Report {
  const lat = data.lat as number;
  const lng = data.lng as number;

  return {
    id,
    cityId: data.cityId || DEFAULT_CITY_ID,
    lat,
    lng,
    geohash: data.geohash || encodeGeohash(lat, lng),
    category: data.category as CategoryId,
    title: data.title as string,
    description: data.description || null,
    images: Array.isArray(data.images) ? data.images as string[] : [],
    status: data.status || 'ACTIVE',
    createdAt: data.createdAt as string,
    updatedAt: data.updatedAt as string,
    resolvedAt: data.resolvedAt || null,
    verifiedCount: data.verifiedCount || 0,
    confirmedBy: Array.isArray(data.confirmedBy) ? data.confirmedBy as string[] : undefined,
    userId: typeof data.userId === 'string' ? data.userId : undefined,
    userDisplayName: typeof data.userDisplayName === 'string' ? data.userDisplayName : undefined,
  } as Report;
}

export function mapFirestoreDocToHeatmapPoint(data: FirebaseFirestore.DocumentData): HeatmapPoint {
  return {
    lat: data.lat as number,
    lng: data.lng as number,
  };
}

export function mapFirestoreDocForView(
  id: string,
  data: FirebaseFirestore.DocumentData,
  view: ReportView
): ReportListItem {
  return view === 'heatmap'
    ? mapFirestoreDocToHeatmapPoint(data)
    : mapFirestoreDocToReport(id, data);
}
