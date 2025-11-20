import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'white';
  size?: 'sm' | 'md' | 'lg';
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95';

  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400 disabled:hover:shadow-none disabled:active:scale-100',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 hover:shadow-lg focus:ring-gray-500 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400 disabled:hover:shadow-none disabled:active:scale-100',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 hover:shadow focus:ring-blue-500 disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:shadow-none disabled:active:scale-100',
    white: 'bg-white text-blue-600 hover:bg-gray-100 hover:shadow-lg focus:ring-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
