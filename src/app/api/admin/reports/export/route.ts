import ExcelJS from 'exceljs';
import { NextRequest } from 'next/server';
import { CATEGORIES, type CategoryId } from '@/lib/constants/categories';
import { verifyAdminRole } from '@/lib/server/adminAuth';
import { badRequest, serverError } from '@/lib/server/response';
import {
  AdminReportFilters,
  AdminReportSort,
  AdminReportStatusFilter,
  AdminReportTimeframeFilter,
  listAdminReportsPage,
} from '@/features/reports/server/reportQueries';
import type { Report, ReportAssignedArea, ReportStatus } from '@/types/report';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const VALID_STATUS_FILTERS = new Set<AdminReportStatusFilter>([
  'ALL',
  'PENDING',
  'VERIFYING',
  'IN_PROGRESS',
  'RESOLVED',
  'DISMISSED',
  'DUPLICATE',
  'DELETED',
]);
const VALID_TIMEFRAME_FILTERS = new Set<AdminReportTimeframeFilter>(['all', '7d', '30d']);
const VALID_SORTS = new Set<AdminReportSort>(['recent', 'priority']);
const EXPORT_LIMIT = 5000;

export async function GET(request: NextRequest) {
  try {
    const { errorResponse } = await verifyAdminRole(request);
    if (errorResponse) return errorResponse;

    const params = request.nextUrl.searchParams;
    const status = (params.get('status') || 'ALL') as AdminReportStatusFilter;
    const timeframe = (params.get('timeframe') || 'all') as AdminReportTimeframeFilter;
    const sort = (params.get('sort') || 'recent') as AdminReportSort;

    if (!VALID_STATUS_FILTERS.has(status)) return badRequest('Filtro de estado invalido.');
    if (!VALID_TIMEFRAME_FILTERS.has(timeframe)) return badRequest('Filtro temporal invalido.');
    if (!VALID_SORTS.has(sort)) return badRequest('Orden invalido.');

    const filters: AdminReportFilters = {
      status,
      category: params.get('category') || 'ALL',
      timeframe,
    };
    const search = params.get('search') || '';
    if (search) filters.search = search;

    const [result, allReports] = await Promise.all([
      listAdminReportsPage(filters, 0, EXPORT_LIMIT, sort),
      listAdminReportsPage({ status: 'ALL', category: 'ALL', timeframe: 'all' }, 0, EXPORT_LIMIT, 'recent'),
    ]);
    const workbook = buildReportsWorkbook(result.data, allReports.data);
    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `alertas-aguilares-${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    return serverError('EXPORT_ADMIN_REPORTS', error);
  }
}

function buildReportsWorkbook(reports: Report[], duplicateLookupReports: Report[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Alerta Aguilares';
  workbook.created = new Date();
  workbook.modified = new Date();

  const sheet = workbook.addWorksheet('Alertas', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  sheet.columns = [
    { header: 'Categoria', key: 'category', width: 24 },
    { header: 'Titulo', key: 'title', width: 34 },
    { header: 'Descripcion', key: 'description', width: 48 },
    { header: 'Direccion / barrio', key: 'location', width: 38 },
    { header: 'Estado', key: 'status', width: 18 },
    { header: 'Area', key: 'area', width: 18 },
    { header: 'Reportes', key: 'reports', width: 12 },
    { header: 'Latitud', key: 'lat', width: 14 },
    { header: 'Longitud', key: 'lng', width: 14 },
    { header: 'Creada', key: 'createdAt', width: 22 },
    { header: 'Actualizada', key: 'updatedAt', width: 22 },
    { header: 'Resuelta', key: 'resolvedAt', width: 22 },
    { header: 'Duplicada de', key: 'duplicateOf', width: 56 },
    { header: 'Oculta', key: 'hidden', width: 16 },
  ];
  const reportById = new Map(duplicateLookupReports.map((report) => [report.id, report]));

  for (const report of reports) {
    const duplicateOf = report.duplicateOfReportId ? reportById.get(report.duplicateOfReportId) : null;

    sheet.addRow({
      category: CATEGORIES[report.category as CategoryId]?.label || report.category,
      title: report.title,
      description: report.description || '',
      location: report.locationLabel || 'Direccion no disponible',
      status: getStatusLabel(report.status),
      area: getAreaLabel(report.assignedArea),
      reports: report.verifiedCount || 0,
      lat: report.lat,
      lng: report.lng,
      createdAt: toExcelDate(report.createdAt),
      updatedAt: toExcelDate(report.updatedAt),
      resolvedAt: toExcelDate(report.resolvedAt),
      duplicateOf: duplicateOf ? `${duplicateOf.title} - ${duplicateOf.locationLabel || 'Direccion no disponible'}` : '',
      hidden: report.deletedAt ? toExcelDate(report.deletedAt) : '',
    });
  }

  sheet.autoFilter = {
    from: 'A1',
    to: 'N1',
  };

  sheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF004163' } };
    cell.alignment = { vertical: 'middle', wrapText: true };
  });
  sheet.getRow(1).height = 22;

  sheet.eachRow((row, rowNumber) => {
    row.alignment = { vertical: 'top', wrapText: rowNumber > 1 };
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFC0C7D0' } },
        bottom: { style: 'thin', color: { argb: 'FFC0C7D0' } },
      };
    });
  });

  sheet.getColumn('reports').numFmt = '0';
  sheet.getColumn('lat').numFmt = '0.000000';
  sheet.getColumn('lng').numFmt = '0.000000';
  sheet.getColumn('createdAt').numFmt = 'dd/mm/yyyy hh:mm';
  sheet.getColumn('updatedAt').numFmt = 'dd/mm/yyyy hh:mm';
  sheet.getColumn('resolvedAt').numFmt = 'dd/mm/yyyy hh:mm';
  sheet.getColumn('hidden').numFmt = 'dd/mm/yyyy hh:mm';

  return workbook;
}

function toExcelDate(value: string | null | undefined) {
  return value ? new Date(value) : '';
}

function getStatusLabel(status: ReportStatus) {
  if (status === 'PENDING') return 'Pendiente';
  if (status === 'VERIFYING') return 'En verificacion';
  if (status === 'IN_PROGRESS') return 'En proceso';
  if (status === 'RESOLVED') return 'Resuelta';
  if (status === 'DISMISSED') return 'Desestimada';
  return 'Duplicada';
}

function getAreaLabel(area: ReportAssignedArea | null | undefined) {
  if (area === 'traffic') return 'Transito';
  if (area === 'public_works') return 'Obras Publicas';
  if (area === 'lighting') return 'Alumbrado';
  if (area === 'environment') return 'Ambiente';
  return 'Sin derivacion';
}
