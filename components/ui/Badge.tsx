'use client';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'pr' | 'accent';
  accentColor?: string;
}

export function Badge({
  children,
  variant = 'default',
  accentColor,
}: BadgeProps) {
  const baseClasses =
    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium';

  const variantClasses = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-700',
    pr: 'bg-amber-100 text-amber-700',
    accent: '',
  };

  const style =
    variant === 'accent' && accentColor
      ? {
          backgroundColor: `${accentColor}20`,
          color: accentColor,
        }
      : undefined;

  return (
    <span
      className={`${baseClasses} ${variantClasses[variant]}`}
      style={style}
    >
      {children}
    </span>
  );
}
