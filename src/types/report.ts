import { CategoryId } from '@/lib/constants/categories';

/**
 * Formato publico serializado a JSON que recibe el cliente.
 */
export interface Report {
  id: string;
  cityId: 'aguilares-tucuman';

  lat: number;
  lng: number;
  category: CategoryId;
  title: string;
  description: string | null;
  images?: string[];

  status: 'ACTIVE' | 'RESOLVED' | 'DUPLICATE';
  deletedAt?: string | null;

  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;

  verifiedCount?: number;
  confirmedBy?: string[];

  userId?: string;
  userDisplayName?: string;
}
