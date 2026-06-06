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
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <MetricCard
        label="Reportes Activos"
        value={loadingReports ? '...' : activeReports}
        icon={<Activity size={18} />}
        tone="amber"
      />
      <MetricCard
        label="Incidentes Solucionados"
        value={loadingReports ? '...' : resolvedReports}
        icon={<CheckCircle size={18} />}
        tone="emerald"
      />
      <MetricCard
        label="Apoyos Visibles"
        value={loadingReports || loadingPage ? '...' : visibleConfirmations}
        icon={<Users size={18} />}
        tone="indigo"
      />
      <MetricCard
        label="Reportes Archivados"
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
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    slate: 'bg-slate-500/10 border-slate-500/20 text-slate-400',
  }[tone];
  const glowClasses = {
    amber: 'bg-amber-500/5',
    emerald: 'bg-emerald-500/5',
    indigo: 'bg-indigo-500/5',
    slate: 'bg-slate-500/5',
  }[tone];

  return (
    <div className="glass px-4 py-4 flex items-center gap-4 relative overflow-hidden">
      <div className={`absolute -top-6 -left-6 w-20 h-20 ${glowClasses} rounded-full blur-2xl`} />
      <div className={`w-10 h-10 rounded-full border flex items-center justify-center ${toneClasses}`}>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-muted uppercase tracking-wider">{label}</span>
        <span className="font-outfit font-extrabold text-2xl text-foreground mt-0.5">
          {value}
        </span>
      </div>
    </div>
  );
}
