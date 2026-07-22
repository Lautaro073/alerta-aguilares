'use client';

import * as Icons from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number | string;
  color?: string | undefined;
}

/**
 * Componente premium para renderizar de forma segura cualquier icono de Lucide dinámicamente.
 * Cuenta con un fallback a un pin de alerta estándar en caso de que el icono no exista.
 */
export default function CategoryIcon({
  name,
  className = '',
  size = 16,
  color,
}: CategoryIconProps) {
  if (name === 'TrafficLight') {
    return (
      <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color || 'currentColor'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="7" y="2" width="10" height="20" rx="3" />
        <circle cx="12" cy="7" r="1.4" />
        <circle cx="12" cy="12" r="1.4" />
        <circle cx="12" cy="17" r="1.4" />
      </svg>
    );
  }

  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string; size?: number | string; color?: string | undefined }>>)[name];

  if (!IconComponent) {
    // Icono fallback
    const Fallback = Icons.HelpCircle;
    return <Fallback className={className} size={size} color={color} />;
  }

  return <IconComponent className={className} size={size} color={color} />;
}
