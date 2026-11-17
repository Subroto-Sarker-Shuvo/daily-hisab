import React from 'react';
import {
  Utensils,
  ShoppingBag,
  Home,
  Zap,
  Bus,
  HeartPulse,
  Shirt,
  GraduationCap,
  Film,
  Wallet,
  Briefcase,
  Laptop,
  TrendingUp,
  Gift,
  Coins,
  MoreHorizontal,
  DollarSign,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Utensils,
  ShoppingBag,
  Home,
  Zap,
  Bus,
  HeartPulse,
  Shirt,
  GraduationCap,
  Film,
  Wallet,
  Briefcase,
  Laptop,
  TrendingUp,
  Gift,
  Coins,
  MoreHorizontal,
};

interface CategoryIconProps {
  iconName: string;
  color?: string;
  size?: number;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  iconName,
  color = '#10B981',
  size = 20,
  className = '',
}) => {
  const IconComponent = iconMap[iconName] || DollarSign;

  return (
    <div
      className={`flex items-center justify-center rounded-xl p-2 ${className}`}
      style={{ backgroundColor: `${color}18`, color: color }}
    >
      <IconComponent size={size} strokeWidth={2.2} />
    </div>
  );
};
