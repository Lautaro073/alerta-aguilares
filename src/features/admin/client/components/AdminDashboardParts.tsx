import type { ReactNode } from 'react';
import CategoryIcon from '@/components/ui/CategoryIcon';

export function PageTitle({
  title,
  action,
  description = 'Vista base generada desde Stitch con datos mock.',
}: {
  title: string;
  action: ReactNode;
  description?: string;
}) {
  return (
    <div className="admin-title-row">
      <div><h2>{title}</h2><p>{description}</p></div>
      {typeof action === 'string' ? <button type="button">{action}</button> : action}
    </div>
  );
}

export function Metric({ tone, icon, label, value, active = false, onClick }: { tone: string; icon: ReactNode; label: string; value: string | number; active?: boolean; onClick?: () => void }) {
  const content = (
    <>
      <div className={`admin-metric-icon ${tone}`}>{icon}</div>
      <div><p>{label}</p><strong>{value}</strong></div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={`admin-metric admin-metric-button ${active ? 'active' : ''}`} onClick={onClick}>
        {content}
      </button>
    );
  }

  return (
    <div className="admin-metric">
      {content}
    </div>
  );
}

export function CategoryLabel({ label, color = '#075985', iconName = 'HelpCircle' }: { label: string; color?: string; iconName?: string }) {
  return <div className="admin-category"><CategoryIcon name={iconName} size={18} color={color} /><strong>{label}</strong></div>;
}

export function PriorityBars({ tone, count }: { tone: string; count: number }) {
  return <div className="admin-priority">{[0, 1, 2].map((index) => <span key={index} className={index < count ? tone : ''} />)}</div>;
}

export function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'AM';
}

export function Person({ initials, name, detail }: { initials: string; name: string; detail: string }) {
  return <div className="admin-person"><span>{initials}</span><div><strong>{name}</strong><small>{detail}</small></div></div>;
}

export function SideCard({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return <section className={`admin-panel admin-users ${className}`}><div className="admin-panel-header tight"><h2>{title}</h2></div>{children}</section>;
}

export function Timeline({ rows, className = '' }: { rows: string[]; className?: string }) {
  return <div className={`admin-user-list ${className}`}>{rows.map((row, index) => <p key={`${row}-${index}`} className="admin-timeline-row">{row}</p>)}</div>;
}

export function formatRecentDate(value: string | null) {
  if (!value) return 'Sin datos';
  const date = new Date(value);
  const diffMinutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffMinutes >= 0 && diffMinutes < 60) return `Hace ${Math.max(1, diffMinutes)} min`;
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function getOptionLabel(options: readonly { value: string; label: string }[], value: string | null) {
  return options.find((option) => option.value === value)?.label || null;
}
