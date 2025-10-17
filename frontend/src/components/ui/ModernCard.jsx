import React from 'react';
import { motion } from 'framer-motion';

const ModernCard = ({ 
  children, 
  className = '', 
  variant = 'default',
  hover = true,
  compact = false,
  ...props 
}) => {
  const baseClasses = "card";
  const variantClasses = {
    default: "bg-card border-border-primary",
    elevated: "bg-card border-border-primary shadow-lg",
    glass: "glass-effect",
    outline: "bg-transparent border-border-accent"
  };
  const compactClasses = compact ? "card-compact" : "";
  const hoverClasses = hover ? "hover-lift" : "";

  return (
    <motion.div
      className={`${baseClasses} ${variantClasses[variant]} ${compactClasses} ${hoverClasses} ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default ModernCard;
