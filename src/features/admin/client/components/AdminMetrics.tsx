import { Activity, Archive, CheckCircle, Users } from 'lucide-react';

type AdminMetricsProps = {
  activeReports: number;
  resolvedReports: number;
  visibleConfirmations: number;
  archivedReports: number;
  loadingReports: boolean;
  loadingPage: boolean;
};

export function AdminMetrics({
  activeReports,
  resolvedReports,
  visibleConfirmations,
  archivedReports,
  loadingReports,
  loadingPage,
}: AdminMetricsProps) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Alertas activas"
        value={loadingReports ? '...' : activeReports}
        icon={<Activity size={18} />}
        tone="amber"
      />
      <MetricCard
        label="Solucionadas"
        value={loadingReports ? '...' : resolvedReports}
        icon={<CheckCircle size={18} />}
        tone="emerald"
      />
      <MetricCard
        label="Confirmaciones"
        value={loadingReports || loadingPage ? '...' : visibleConfirmations}
        icon={<Users size={18} />}
        tone="indigo"
      />
      <MetricCard
        label="Archivadas"
        value={loadingReports ? '...' : archivedReports}
        icon={<Archive size={18} />}
        tone="slate"
      />
    </section>
  );
}

function MetricCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone: 'amber' | 'emerald' | 'indigo' | 'slate';
}) {
  const toneClasses = {
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    indigo: 'bg-sky-50 border-sky-200 text-[#075985]',
    slate: 'bg-slate-100 border-slate-200 text-slate-600',
  }[tone];

  return (
    <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white px-4 py-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-md border ${toneClasses}`}>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
        <span className="font-outfit mt-0.5 text-2xl font-extrabold text-slate-950">
          {value}
        </span>
      </div>
    </div>
  );
}
