import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  icon,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none touch-card';

  const sizeStyles = {
    sm: 'text-sm px-3 py-2 gap-1.5 min-h-[38px]',
    md: 'text-base px-5 py-2.5 gap-2 min-h-[46px]',
    lg: 'text-lg px-6 py-3.5 gap-2.5 min-h-[54px] font-semibold',
  };

  const variantStyles = {
    primary:
      'bg-krishi-700 hover:bg-krishi-800 active:bg-krishi-900 text-white shadow-sm hover:shadow focus:ring-krishi-500 border border-transparent',
    secondary:
      'bg-earth-100 hover:bg-earth-200 active:bg-earth-300 text-earth-900 border border-earth-300/80 focus:ring-earth-400',
    danger:
      'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-md hover:shadow-lg focus:ring-red-500 border border-red-700 animate-pulse-slow',
    outline:
      'bg-transparent hover:bg-krishi-50 text-krishi-800 border-2 border-krishi-700 focus:ring-krishi-600',
    ghost:
      'bg-transparent hover:bg-gray-100 text-gray-700 border border-transparent focus:ring-gray-400',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${className}`}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
