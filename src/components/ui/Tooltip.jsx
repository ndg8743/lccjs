import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * Tooltip component with positioning and animation
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Tooltip content
 * @param {String} props.position - Position of tooltip (top, bottom, left, right)
 * @param {Boolean} props.isOpen - Whether tooltip is visible
 * @param {Function} props.onClose - Close handler
 * @returns {JSX.Element} Tooltip component
 */
function Tooltip({ children, position = 'bottom', isOpen, onClose }) {
  const tooltipRef = useRef(null);
  const [tooltipPosition, setTooltipPosition] = useState({});
  
  useEffect(() => {
    // Calculate position here if needed
    return () => {
      if (onClose) onClose();
    };
  }, [onClose]);

  // Animation variants
  const variants = {
    hidden: { opacity: 0, y: position === 'top' ? 10 : -10 },
    visible: { opacity: 1, y: 0 },
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      className="lcc-tooltip"
      ref={tooltipRef}
      style={tooltipPosition}
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={variants}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

Tooltip.propTypes = {
  children: PropTypes.node.isRequired,
  position: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
};

export default Tooltip;
