import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * Reusable button component with consistent styling and animations
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.variant - Button style variant
 * @param {string} props.size - Button size
 * @param {string} props.icon - Font Awesome icon class
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {Function} props.onClick - Click handler
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.title - Tooltip text
 * @returns {JSX.Element} Button component
 */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  onClick,
  className = '',
  title,
  ...props
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const tooltipRef = useRef(null);

  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500 disabled:bg-primary-400',
    secondary: 'bg-secondary-600 hover:bg-secondary-700 text-secondary-100 focus:ring-secondary-500 disabled:bg-secondary-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 disabled:bg-red-400',
    ghost: 'bg-transparent hover:bg-secondary-700 text-secondary-300 hover:text-secondary-100 focus:ring-secondary-500',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  
  const disabledClasses = disabled 
    ? 'opacity-50 cursor-not-allowed' 
    : 'cursor-pointer';

  const buttonClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${disabledClasses}
    ${className}
  `.trim();

  // Handle tooltip positioning
  const handleMouseEnter = () => {
    if (title && !disabled) {
      setShowTooltip(true);
      // Position tooltip after a short delay to ensure button is rendered
      setTimeout(() => {
        if (buttonRef.current && tooltipRef.current) {
          const buttonRect = buttonRef.current.getBoundingClientRect();
          const tooltipRect = tooltipRef.current.getBoundingClientRect();
          
          let top = buttonRect.bottom + 8;
          let left = buttonRect.left + (buttonRect.width / 2) - (tooltipRect.width / 2);
          
          // Adjust if tooltip would go off screen
          if (left < 8) left = 8;
          if (left + tooltipRect.width > window.innerWidth - 8) {
            left = window.innerWidth - tooltipRect.width - 8;
          }
          if (top + tooltipRect.height > window.innerHeight - 8) {
            top = buttonRect.top - tooltipRect.height - 8;
          }
          
          setTooltipPosition({ top, left });
        }
      }, 100);
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  // Clean up tooltip on unmount
  useEffect(() => {
    return () => {
      setShowTooltip(false);
    };
  }, []);

  return (
    <>
      <motion.button
        ref={buttonRef}
        className={buttonClasses}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        whileHover={disabled ? {} : { scale: 1.02 }}
        whileTap={disabled ? {} : { scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        {...props}
      >
        {icon && (
          <i className={`${icon} ${children ? 'mr-2' : ''}`} />
        )}
        {children}
      </motion.button>
      
      {/* Tooltip */}
      {title && (
        <motion.div
          ref={tooltipRef}
          className="fixed z-50 px-3 py-2 text-sm text-white bg-secondary-800 border border-secondary-600 rounded-lg shadow-lg pointer-events-none max-w-xs"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
          initial={{ opacity: 0, y: 5 }}
          animate={showTooltip ? { opacity: 1, y: 0 } : { opacity: 0, y: 5 }}
          transition={{ duration: 0.2 }}
        >
          {title}
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-secondary-800 border-l border-t border-secondary-600 rotate-45"></div>
        </motion.div>
      )}
    </>
  );
}

Button.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'ghost']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  icon: PropTypes.string,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
  title: PropTypes.string,
};

export default Button;