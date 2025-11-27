import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  children, 
  icon,
  ...props 
}) => {
  
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-nebula-900 text-white hover:bg-nebula-800 dark:bg-white dark:text-nebula-900 dark:hover:bg-nebula-100 shadow-lg shadow-nebula-900/10",
    secondary: "bg-white text-nebula-700 border border-nebula-200 hover:bg-nebula-50 dark:bg-nebula-800 dark:border-nebula-700 dark:text-nebula-100 dark:hover:bg-nebula-700",
    ghost: "text-nebula-600 hover:bg-nebula-100/50 dark:text-nebula-400 dark:hover:bg-nebula-800/50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400",
  };

  const sizes = {
    sm: "h-8 px-3 text-xs gap-1.5",
    md: "h-10 px-4 text-sm gap-2",
    lg: "h-12 px-6 text-base gap-2.5",
  };

  const MotionButton = motion.button as any;

  return (
    <MotionButton
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.02 }}
      className={twMerge(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </MotionButton>
  );
};