import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  disabled = false,
  icon,
  iconPosition = 'left',
  className = '',
  onClick,
  type = 'button',
  ...props 
}) => {
  const baseClasses = 'btn';
  
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    success: 'btn-success',
    warning: 'btn-warning',
    error: 'btn-error'
  };
  
  const sizeClasses = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg'
  };
  
  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className
  ].filter(Boolean).join(' ');
  
  const isDisabled = disabled || loading;
  
  return (
    <button
      type={type}
      className={classes}
      disabled={isDisabled}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <Loader2 className="w-4 h-4 animate-spin" />
      )}
      
      {!loading && icon && iconPosition === 'left' && (
        <span className="w-4 h-4">{icon}</span>
      )}
      
      {children}
      
      {!loading && icon && iconPosition === 'right' && (
        <span className="w-4 h-4">{icon}</span>
      )}
    </button>
  );
};

export default Button;
