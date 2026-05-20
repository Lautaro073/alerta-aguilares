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
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string; size?: number | string; color?: string | undefined }>>)[name];

  if (!IconComponent) {
    // Icono fallback
    const Fallback = Icons.HelpCircle;
    return <Fallback className={className} size={size} color={color} />;
  }

  return <IconComponent className={className} size={size} color={color} />;
}
