/**
 * Comprehensive tooltip transparency fix
 * This script ensures all tooltips have proper navy blue background and are fully opaque
 */

class TooltipTransparencyFixer {
  constructor() {
    this.fixInterval = null;
    this.observerActive = false;
    this.mutationObserver = null;
    
    // Start fixing tooltips
    this.initialize();
  }

  initialize() {
    // Apply initial fix
    this.applyTooltipFix();
    
    // Set up mutation observer to catch dynamically created tooltips
    this.setupMutationObserver();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Periodic check as fallback - more frequent
    this.fixInterval = setInterval(() => {
      this.applyTooltipFix();
    }, 100); // Check every 100ms instead of 500ms
  }

  setupMutationObserver() {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }

    this.mutationObserver = new MutationObserver((mutations) => {
      let shouldFix = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if the added node is a tooltip or contains tooltips
              if (this.isTooltipElement(node) || node.querySelector && this.getTooltipElements(node).length > 0) {
                shouldFix = true;
              }
            }
          });
        }
        
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'class' || mutation.attributeName === 'style')) {
          if (this.isTooltipElement(mutation.target)) {
            shouldFix = true;
          }
        }
      });
      
      if (shouldFix) {
        // Small delay to ensure the element is fully rendered
        setTimeout(() => this.applyTooltipFix(), 10);
      }
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });
  }

  setupEventListeners() {
    // Apply fix on mouse events that might trigger tooltips
    ['mouseover', 'mouseenter', 'focus', 'mousemove'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        setTimeout(() => this.applyTooltipFix(), 10);
        setTimeout(() => this.applyTooltipFix(), 50);
      }, { passive: true });
    });

    // Apply fix when editor content changes
    document.addEventListener('input', () => {
      setTimeout(() => this.applyTooltipFix(), 50);
      setTimeout(() => this.applyTooltipFix(), 100);
    }, { passive: true });
  }

  isTooltipElement(element) {
    if (!element || !element.classList) return false;
    
    const tooltipClasses = [
      'lcc-tooltip', 'cm-tooltip-hover'
    ];
    
    const hasTooltipClass = tooltipClasses.some(cls => element.classList.contains(cls));
    const hasTooltipRole = element.getAttribute('role') === 'tooltip';
    const isLccTooltip = element.classList.contains('lcc-tooltip');
    
    return hasTooltipClass || hasTooltipRole || isLccTooltip;
  }

  getTooltipElements(container = document) {
    const selectors = [
      '.lcc-tooltip',
      '.cm-tooltip.cm-tooltip-hover',
      '.cm-tooltip .lcc-tooltip',
      '.CodeMirror .cm-tooltip',
      '.CodeMirror .lcc-tooltip'
    ];
    
    return container.querySelectorAll(selectors.join(', '));
  }

  applyTooltipFix() {
    // Log all potential tooltip elements for debugging
    const allTooltipLike = document.querySelectorAll('*');
    allTooltipLike.forEach(el => {
      if (el.className && (
          el.className.includes('tooltip') || 
          el.className.includes('cm-tooltip') ||
          el.className.includes('lcc-tooltip') ||
          el.getAttribute('role') === 'tooltip'
        )) {
        console.log('Found tooltip element:', el, el.className, el.style.cssText);
      }
    });

    const tooltips = this.getTooltipElements();
    console.log('Fixing tooltips:', tooltips.length);
    
    tooltips.forEach(tooltip => {
      this.fixTooltipElement(tooltip);
    });

    // Also check for any elements that might contain tooltip content
    const potentialTooltipContainers = document.querySelectorAll('div, span');
    potentialTooltipContainers.forEach(container => {
      if (container.textContent && 
          (container.textContent.includes('Display Output') || 
           container.textContent.includes('Display value') ||
           container.textContent.includes('Binary format') ||
           container.textContent.includes('Add') ||
           container.textContent.includes('Performs'))) {
        console.log('Found tooltip content container:', container);
        this.fixTooltipElement(container);
      }
    });

    // Nuclear option - fix ALL elements that might be tooltips
    const nuclearTooltips = document.querySelectorAll(`
      .tooltip, 
      .cm-tooltip, 
      .cm-tooltip-hover, 
      .lcc-tooltip, 
      [role="tooltip"], 
      [class*="tooltip"], 
      .CodeMirror-hint, 
      .CodeMirror-hints,
      [data-tooltip],
      div[style*="position: absolute"],
      div[style*="z-index"]
    `);
    
    nuclearTooltips.forEach(el => {
      if (el.offsetWidth > 0 && el.offsetHeight > 0) { // Only visible elements
        console.log('Nuclear fixing:', el);
        this.fixTooltipElement(el);
      }
    });
  }

  fixTooltipElement(tooltip) {
    if (!tooltip || !tooltip.style) return;

    // Apply direct styling to force opacity and navy blue background
    const styles = {
      backgroundColor: '#1e293b',
      background: '#1e293b',
      color: 'white',
      opacity: '1',
      backdropFilter: 'none',
      webkitBackdropFilter: 'none',
      filter: 'none',
      border: '1px solid #38bdf8',
      boxShadow: '0 0 10px rgba(0, 0, 0, 0.8)',
      zIndex: '10000',
      backgroundImage: 'none',
      backgroundAttachment: 'scroll',
      backgroundClip: 'border-box',
      backgroundOrigin: 'padding-box',
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'auto',
      visibility: 'visible',
      display: tooltip.style.display === 'none' ? 'block' : tooltip.style.display || 'block'
    };

    // Set the background using multiple methods to ensure it sticks
    Object.assign(tooltip.style, styles);
    tooltip.style.setProperty('background-color', '#1e293b', 'important');
    tooltip.style.setProperty('background', '#1e293b', 'important');
    tooltip.style.setProperty('opacity', '1', 'important');
    tooltip.style.setProperty('filter', 'none', 'important');
    tooltip.style.setProperty('backdrop-filter', 'none', 'important');
    
    // Set attributes as backup
    tooltip.setAttribute('style', 
      tooltip.getAttribute('style') + 
      '; background-color: #1e293b !important; background: #1e293b !important; opacity: 1 !important; filter: none !important;'
    );

    // Also target the parent if it's a cm-tooltip-hover
    if (tooltip.parentElement && tooltip.parentElement.classList.contains('cm-tooltip-hover')) {
      const parent = tooltip.parentElement;
      parent.style.setProperty('background-color', '#1e293b', 'important');
      parent.style.setProperty('background', '#1e293b', 'important');
      parent.style.setProperty('opacity', '1', 'important');
    }

    // Apply to all children as well
    const children = tooltip.querySelectorAll('*');
    children.forEach(child => {
      if (child.style) {
        child.style.opacity = '1';
        child.style.backdropFilter = 'none';
        child.style.webkitBackdropFilter = 'none';
        child.style.filter = 'none';
        child.style.backgroundImage = 'none';
        child.style.setProperty('opacity', '1', 'important');
      }
    });

    // Special handling for LCC tooltip content
    const lccTooltipElements = tooltip.querySelectorAll('.hover-title, .hover-syntax, .hover-description, .hover-binary');
    lccTooltipElements.forEach(el => {
      if (el.style) {
        el.style.backgroundColor = 'transparent';
        el.style.color = 'white';
        el.style.opacity = '1';
        el.style.setProperty('color', 'white', 'important');
        el.style.setProperty('opacity', '1', 'important');
      }
    });
    
    // Force redraw
    tooltip.offsetHeight;
  }

  destroy() {
    if (this.fixInterval) {
      clearInterval(this.fixInterval);
      this.fixInterval = null;
    }
    
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
  }
}

// Initialize the tooltip fixer
let tooltipFixer = null;

function initializeTooltipFixer() {
  if (tooltipFixer) {
    tooltipFixer.destroy();
  }
  tooltipFixer = new TooltipTransparencyFixer();
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeTooltipFixer);
} else {
  initializeTooltipFixer();
}

// Export for manual initialization if needed
export default TooltipTransparencyFixer;
export { initializeTooltipFixer };
