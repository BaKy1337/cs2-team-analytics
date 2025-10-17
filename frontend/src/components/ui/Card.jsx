import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ 
  children, 
  className = '', 
  hover = true,
  glow = false,
  ...props 
}) => {
  const baseClasses = 'card';
  
  const classes = [
    baseClasses,
    hover ? 'hover-lift' : '',
    glow ? 'ring-2 ring-cs2-primary ring-opacity-50' : '',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <motion.div
      className={classes}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hover ? { y: -4 } : {}}
      {...props}
    >
      {children}
    </motion.div>
  );
};

const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`card-header ${className}`} {...props}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '', ...props }) => (
  <h3 className={`card-title ${className}`} {...props}>
    {children}
  </h3>
);

const CardSubtitle = ({ children, className = '', ...props }) => (
  <p className={`card-subtitle ${className}`} {...props}>
    {children}
  </p>
);

const CardContent = ({ children, className = '', ...props }) => (
  <div className={`card-content ${className}`} {...props}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`card-footer ${className}`} {...props}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Subtitle = CardSubtitle;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
