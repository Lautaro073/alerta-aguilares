import { DEFAULT_CITY_ID } from '@/lib/constants/city';
import { CategoryId } from '@/lib/constants/categories';
import { Report } from '@/types/report';

export interface HeatmapPoint {
  lat: number;
  lng: number;
}

export type ReportView = 'markers' | 'heatmap';
export type ReportListItem = Report | HeatmapPoint;

export interface SupabaseReportRow {
  id: string;
  city_id: 'aguilares-tucuman' | string | null;
  lat: number;
  lng: number;
  category: CategoryId;
  title: string;
  description: string | null;
  images: string[] | null;
  status: 'ACTIVE' | 'RESOLVED' | 'DUPLICATE';
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  verified_count: number | null;
  user_id: string | null;
  user_display_name: string | null;
}

export function mapSupabaseReportToReport(row: SupabaseReportRow): Report {
  const report: Report = {
    id: row.id,
    cityId: row.city_id === 'aguilares-tucuman' ? row.city_id : DEFAULT_CITY_ID,
    lat: row.lat,
    lng: row.lng,
    category: row.category,
    title: row.title,
    description: row.description,
    images: row.images || [],
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resolvedAt: row.resolved_at,
    verifiedCount: row.verified_count || 0,
  };

  if (row.user_id) {
    report.userId = row.user_id;
  }

  if (row.user_display_name) {
    report.userDisplayName = row.user_display_name;
  }

  return report;
}

export function mapSupabaseReportToHeatmapPoint(row: SupabaseReportRow): HeatmapPoint {
  return {
    lat: row.lat,
    lng: row.lng,
  };
}

export function mapSupabaseReportForView(
  row: SupabaseReportRow,
  view: ReportView
): ReportListItem {
  return view === 'heatmap'
    ? mapSupabaseReportToHeatmapPoint(row)
    : mapSupabaseReportToReport(row);
}
