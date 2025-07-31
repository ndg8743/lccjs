/**
 * Direct tooltip fix for transparency issues
 * This script will find tooltips and forcibly set their background
 */

(function() {
  // Run immediately when loaded
  function fixAllTooltips() {
    console.log("Running direct tooltip fix");
    
    // Get all possible tooltips
    const tooltips = document.querySelectorAll('.cm-tooltip, .cm-tooltip-hover, .lcc-tooltip, .tooltip');
    
    tooltips.forEach(tooltip => {
      console.log("Found tooltip to fix:", tooltip);
      applyNavyBackgroundDirectly(tooltip);
    });
    
    // Also try to find tooltips by content
    const allElements = document.querySelectorAll('div, span');
    allElements.forEach(el => {
      if (el.textContent && (
        el.textContent.includes("Display Output") ||
        el.textContent.includes("Binary format") ||
        el.textContent.includes("Display value")
      )) {
        console.log("Found tooltip by content:", el);
        // Go up the DOM tree to find the container
        let container = el;
        for (let i = 0; i < 3; i++) {
          if (container.parentElement) {
            container = container.parentElement;
            applyNavyBackgroundDirectly(container);
          }
        }
      }
    });
  }
  
  function applyNavyBackgroundDirectly(element) {
    if (!element) return;
    
    // Force navy blue background directly on the element
    element.style.cssText += "; background-color: #1e293b !important; background: #1e293b !important; opacity: 1 !important; backdrop-filter: none !important;";
    
    // Add a custom attribute so we know we've fixed this element
    element.setAttribute('data-fixed-bg', 'true');
    
    // Also set a class that our CSS can target
    element.classList.add('tooltip-fixed');
    
    // If this is a tooltip container, style its children too
    const children = element.children;
    for (let i = 0; i < children.length; i++) {
      children[i].style.cssText += "; opacity: 1 !important;";
      if (children[i].classList.contains('cm-tooltip') || 
          children[i].classList.contains('lcc-tooltip')) {
        applyNavyBackgroundDirectly(children[i]);
      }
    }
  }
  
  // Run on page load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fixAllTooltips);
  } else {
    fixAllTooltips();
  }
  
  // Set up a mutation observer to catch tooltips being added
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            if (node.classList && 
                (node.classList.contains('cm-tooltip') || 
                 node.classList.contains('lcc-tooltip') || 
                 node.classList.contains('tooltip'))) {
              console.log("Mutation observer caught tooltip:", node);
              applyNavyBackgroundDirectly(node);
            }
            
            // Also look for tooltips within the added node
            const tooltipsInNode = node.querySelectorAll('.cm-tooltip, .cm-tooltip-hover, .lcc-tooltip, .tooltip');
            tooltipsInNode.forEach(tooltip => {
              console.log("Found tooltip within added node:", tooltip);
              applyNavyBackgroundDirectly(tooltip);
            });
          }
        });
      }
    });
  });
  
  observer.observe(document.body, { 
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style']
  });
  
  // Also run every 500ms as a fallback
  setInterval(fixAllTooltips, 500);
  
  // Add event listeners to catch hover events that might create tooltips
  document.addEventListener('mouseover', () => {
    setTimeout(fixAllTooltips, 50);
  });
  
  document.addEventListener('mousemove', () => {
    setTimeout(fixAllTooltips, 50);
  });
})();

// Export a function to manually trigger the fix
export function forceFixTooltips() {
  const tooltips = document.querySelectorAll('.cm-tooltip, .cm-tooltip-hover, .lcc-tooltip, .tooltip');
  console.log(`Manually fixing ${tooltips.length} tooltips`);
  tooltips.forEach(tooltip => {
    tooltip.style.cssText += "; background-color: #1e293b !important; background: #1e293b !important; opacity: 1 !important;";
  });
}
