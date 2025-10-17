import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const ModernButton = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  disabled = false,
  icon,
  className = '',
  ...props 
}) => {
  const baseClasses = "btn";
  const variantClasses = {
    primary: "btn-primary",
    secondary: "btn-secondary", 
    ghost: "btn-ghost",
    success: "bg-success-500 hover:bg-success-600 text-white",
    warning: "bg-warning-500 hover:bg-warning-600 text-white",
    error: "bg-error-500 hover:bg-error-600 text-white"
  };
  const sizeClasses = {
    sm: "btn-sm",
    md: "",
    lg: "btn-lg"
  };

  return (
    <motion.button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      transition={{ duration: 0.1 }}
      {...props}
    >
      {loading && (
        <Loader2 className="w-4 h-4 animate-spin" />
      )}
      {icon && !loading && (
        <span className="w-4 h-4">{icon}</span>
      )}
      {children}
    </motion.button>
  );
};

export default ModernButton;
