import { Icon as IconifyIcon } from '@iconify/react';

interface IconProps {
  icon: string;
  className?: string;
  width?: number | string;
}

export function Icon({ icon, className, width = 16 }: IconProps) {
  return <IconifyIcon icon={icon} className={className} width={width} />;
}
