'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import { Report } from '@/types/report';

type ReportStatus = 'ACTIVE' | 'RESOLVED' | 'DUPLICATE';
type AdminStatusFilter = 'ALL' | 'ACTIVE' | 'RESOLVED' | 'DUPLICATE' | 'DELETED';
type AdminTimeframeFilter = 'all' | '7d' | '30d';

interface AdminReportFilters {
  search: string;
  status: AdminStatusFilter;
  category: string;
  timeframe: AdminTimeframeFilter;
}

interface AdminReportSummary {
  totalReports: number;
  activeReports: number;
  resolvedReports: number;
  archivedReports: number;
}

interface AdminReportsResponse {
  data?: Report[];
  count?: number;
  summary?: AdminReportSummary;
}

interface UseAdminReportsOptions {
  user: User | null;
  isAdmin: boolean;
  pageSize: number;
  currentPage: number;
  filters: AdminReportFilters;
}

interface ReportRange {
  start: number;
  end: number;
}

const PREFETCH_PAGE_MULTIPLIER = 3;

const EMPTY_SUMMARY: AdminReportSummary = {
  totalReports: 0,
  activeReports: 0,
  resolvedReports: 0,
  archivedReports: 0,
};

function getBlockSize(pageSize: number) {
  return pageSize * PREFETCH_PAGE_MULTIPLIER;
}

function getPageOffset(page: number, pageSize: number) {
  return Math.max(0, (page - 1) * pageSize);
}

function getBlockStart(offset: number, blockSize: number) {
  return Math.floor(offset / blockSize) * blockSize;
}

function isRangeCovered(ranges: ReportRange[], start: number, end: number) {
  if (end <= start) return true;

  return ranges.some((range) => range.start <= start && range.end >= end);
}

function mergeRanges(ranges: ReportRange[], nextRange: ReportRange) {
  const sortedRanges = [...ranges, nextRange].sort((a, b) => a.start - b.start);
  const mergedRanges: ReportRange[] = [];

  for (const range of sortedRanges) {
    const previousRange = mergedRanges[mergedRanges.length - 1];

    if (!previousRange || range.start > previousRange.end) {
      mergedRanges.push({ ...range });
    } else {
      previousRange.end = Math.max(previousRange.end, range.end);
    }
  }

  return mergedRanges;
}

function buildAdminReportsUrl(filters: AdminReportFilters, offset: number, limit: number) {
  const params = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
    status: filters.status,
    category: filters.category,
    timeframe: filters.timeframe,
  });

  const search = filters.search.trim();
  if (search) {
    params.set('search', search);
  }

  return `/api/admin/reports?${params.toString()}`;
}

export function useAdminReports({
  user,
  isAdmin,
  pageSize,
  currentPage,
  filters,
}: UseAdminReportsOptions) {
  const [reportRows, setReportRows] = useState<Record<number, Report>>({});
  const [totalCount, setTotalCount] = useState(0);
  const [summary, setSummary] = useState<AdminReportSummary>(EMPTY_SUMMARY);
  const [loadingReports, setLoadingReports] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const loadedRangesRef = useRef<ReportRange[]>([]);
  const inFlightRangesRef = useRef<ReportRange[]>([]);
  const requestVersionRef = useRef(0);

  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const safeCurrentPage = Math.min(currentPage, pageCount);
  const pageOffset = getPageOffset(safeCurrentPage, pageSize);
  const blockSize = getBlockSize(pageSize);

  const mergeReports = useCallback((offset: number, rows: Report[]) => {
    setReportRows((previousRows) => {
      const nextRows = { ...previousRows };

      rows.forEach((report, index) => {
        nextRows[offset + index] = report;
      });

      return nextRows;
    });
  }, []);

  const fetchAdminReportRange = useCallback(
    async (offset: number, limit: number, version: number) => {
      if (!user || !isAdmin) return null;
      const end = offset + limit;
      if (
        isRangeCovered(loadedRangesRef.current, offset, end) ||
        isRangeCovered(inFlightRangesRef.current, offset, end)
      ) {
        return null;
      }

      inFlightRangesRef.current = [...inFlightRangesRef.current, { start: offset, end }];

      try {
        const token = await user.getIdToken();
        const response = await fetch(buildAdminReportsUrl(filters, offset, limit), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        });

        if (!response.ok) {
          const result = await response.json().catch(() => ({})) as { error?: string };
          throw new Error(result.error || 'No se pudieron cargar los reportes.');
        }

        const result = await response.json() as AdminReportsResponse;
        if (requestVersionRef.current !== version) return null;

        const returnedCount = result.data?.length || 0;
        loadedRangesRef.current = mergeRanges(loadedRangesRef.current, {
          start: offset,
          end: offset + returnedCount,
        });
        setTotalCount(result.count || 0);
        setSummary(result.summary || EMPTY_SUMMARY);
        mergeReports(offset, result.data || []);

        return result;
      } finally {
        inFlightRangesRef.current = inFlightRangesRef.current.filter(
          (range) => range.start !== offset || range.end !== end
        );
      }
    },
    [filters, isAdmin, mergeReports, user]
  );

  const fetchInitialReports = useCallback(async () => {
    if (!user || !isAdmin) {
      setLoadingReports(false);
      return;
    }

    const version = requestVersionRef.current + 1;
    requestVersionRef.current = version;
    loadedRangesRef.current = [];
    inFlightRangesRef.current = [];
    setReportRows({});
    setTotalCount(0);
    setSummary(EMPTY_SUMMARY);
    setLoadingReports(true);

    try {
      const firstBlock = await fetchAdminReportRange(0, blockSize, version);
      const count = firstBlock?.count || 0;
      const lastPageOffset = count > 0 ? getPageOffset(Math.ceil(count / pageSize), pageSize) : 0;

      if (lastPageOffset > 0 && lastPageOffset >= blockSize) {
        await fetchAdminReportRange(lastPageOffset, pageSize, version);
      }
    } catch (err) {
      console.error('Error al cargar reportes de administracion:', err);
    } finally {
      if (requestVersionRef.current === version) {
        setLoadingReports(false);
      }
    }
  }, [blockSize, fetchAdminReportRange, isAdmin, pageSize, user]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchInitialReports();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchInitialReports]);

  useEffect(() => {
    if (!user || !isAdmin || loadingReports || totalCount === 0) return;

    const version = requestVersionRef.current;
    const currentBlockStart = getBlockStart(pageOffset, blockSize);
    const currentBlockEnd = Math.min(currentBlockStart + blockSize, totalCount);
    const previousBlockStart = Math.max(0, currentBlockStart - blockSize);
    const nextBlockStart = currentBlockEnd;
    const expectedPageEnd = Math.min(pageOffset + pageSize, totalCount);
    const pageIsMissing = Array.from({ length: Math.min(pageSize, totalCount - pageOffset) }).some(
      (_, index) => !reportRows[pageOffset + index]
    );
    const currentBlockIsCovered = isRangeCovered(loadedRangesRef.current, currentBlockStart, currentBlockEnd);
    const shouldPrefetchPreviousBlock =
      pageOffset - currentBlockStart <= pageSize && currentBlockStart > 0;
    const shouldPrefetchNextBlock = currentBlockEnd - expectedPageEnd <= pageSize && currentBlockEnd < totalCount;
    const rangesToFetch: ReportRange[] = [];

    if (pageIsMissing || !currentBlockIsCovered) {
      rangesToFetch.push({ start: currentBlockStart, end: currentBlockEnd });
    }

    if (shouldPrefetchPreviousBlock) {
      rangesToFetch.push({ start: previousBlockStart, end: currentBlockStart });
    }

    if (shouldPrefetchNextBlock) {
      rangesToFetch.push({ start: nextBlockStart, end: Math.min(nextBlockStart + blockSize, totalCount) });
    }

    const missingRanges = rangesToFetch.filter((range) => {
      return (
        range.end > range.start &&
        !isRangeCovered(loadedRangesRef.current, range.start, range.end) &&
        !isRangeCovered(inFlightRangesRef.current, range.start, range.end)
      );
    });

    if (missingRanges.length === 0) return;

    void Promise.all(
      missingRanges.map((range) => fetchAdminReportRange(range.start, range.end - range.start, version))
    ).catch((err) => {
        console.error('Error al precargar reportes de administracion:', err);
      });
  }, [
    blockSize,
    fetchAdminReportRange,
    isAdmin,
    loadingReports,
    pageOffset,
    pageSize,
    reportRows,
    totalCount,
    user,
  ]);

  const expectedVisibleCount = Math.min(pageSize, Math.max(0, totalCount - pageOffset));
  const reports = useMemo(() => {
    return Array.from({ length: expectedVisibleCount })
      .map((_, index) => reportRows[pageOffset + index])
      .filter((report): report is Report => Boolean(report));
  }, [expectedVisibleCount, pageOffset, reportRows]);
  const loadingPage = !loadingReports && expectedVisibleCount > reports.length;

  const refreshAdminReports = useCallback(async () => {
    await fetchInitialReports();
  }, [fetchInitialReports]);

  const updateReportStatus = async (reportId: string, status: ReportStatus) => {
    if (!user) return;

    try {
      setActionLoading((prev) => ({ ...prev, [reportId]: true }));
      const token = await user.getIdToken();

      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(result.error || 'Error al actualizar el estado del reporte.');
      }

      await refreshAdminReports();
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      alert('Ocurrio un error al moderar el reporte.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [reportId]: false }));
    }
  };

  const archiveReport = async (reportId: string) => {
    if (!user) return;

    const confirmed = window.confirm(
      'Archivar este reporte? El vecino no podra verlo en el mapa, pero quedara registrado en el sistema y podra restaurarse en cualquier momento.'
    );
    if (!confirmed) return;

    try {
      setActionLoading((prev) => ({ ...prev, [reportId]: true }));
      const token = await user.getIdToken();

      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(result.error || 'Error al archivar el reporte.');
      }

      await refreshAdminReports();
    } catch (error) {
      console.error('Error al archivar reporte:', error);
      alert('Ocurrio un error al archivar el reporte.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [reportId]: false }));
    }
  };

  const restoreReport = async (reportId: string) => {
    if (!user) return;

    try {
      setActionLoading((prev) => ({ ...prev, [reportId]: true }));
      const token = await user.getIdToken();

      const response = await fetch(`/api/reports/${reportId}/restore`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(result.error || 'Error al restaurar el reporte.');
      }

      await refreshAdminReports();
    } catch (error) {
      console.error('Error al restaurar reporte:', error);
      alert('Ocurrio un error al restaurar reporte.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [reportId]: false }));
    }
  };

  return {
    reports,
    totalCount,
    summary,
    loadingReports,
    loadingPage,
    actionLoading,
    updateReportStatus,
    archiveReport,
    restoreReport,
  };
}
