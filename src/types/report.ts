import { CategoryId } from '@/lib/constants/categories';

export type ReportStatus = 'PENDING' | 'VERIFYING' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED' | 'DUPLICATE';
export type ReportAssignedArea = 'traffic' | 'public_works' | 'lighting' | 'environment' | 'security';
export type ReportPriority = 'high' | 'medium' | 'low';

/**
 * Formato publico serializado a JSON que recibe el cliente.
 */
export interface Report {
  id: string;
  cityId: 'aguilares-tucuman';

  lat: number;
  lng: number;
  locationLabel?: string | null;
  category: CategoryId;
  title: string;
  description: string | null;
  images?: string[];

  status: ReportStatus;
  priority?: ReportPriority | null;
  assignedArea?: ReportAssignedArea | null;
  duplicateOfReportId?: string | null;
  deletedAt?: string | null;

  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;

  verifiedCount?: number;
  confirmedBy?: string[];

  userId?: string;
  userDisplayName?: string;
}
