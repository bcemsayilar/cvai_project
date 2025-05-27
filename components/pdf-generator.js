/**
 * PDF Generator utility for Resume Enhancer
 * This file provides functions to generate PDFs from HTML elements
 */

// Function to generate a PDF from an HTML element
export async function generatePdf(elementId, options = {}) {
  return new Promise((resolve, reject) => {
    // Make sure we're in browser environment
    if (typeof window === 'undefined') {
      reject(new Error('PDF generation can only run in browser environment'));
      return;
    }

    // Check if html2pdf is loaded
    if (typeof window.html2pdf === 'undefined') {
      reject(new Error('html2pdf.js is not loaded'));
      return;
    }

    const element = document.getElementById(elementId);
    if (!element) {
      reject(new Error(`Element with ID "${elementId}" not found`));
      return;
    }

    // Default options for PDF generation
    const defaultOptions = {
      margin: [10, 10, 10, 10],
      filename: 'resume.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        windowWidth: document.documentElement.offsetWidth || window.innerWidth,
        windowHeight: document.documentElement.offsetHeight || window.innerHeight
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
      }
    };

    // Merge provided options with defaults
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Save original styles
    const originalStyles = new Map();
    const elements = [element, ...Array.from(element.querySelectorAll('*'))];
    
    elements.forEach(el => {
      if (el instanceof HTMLElement) {
        originalStyles.set(el, el.style.cssText);
        
        // Apply computed styles inline
        try {
          const computed = window.getComputedStyle(el);
          el.style.color = computed.color;
          el.style.backgroundColor = computed.backgroundColor;
          el.style.fontFamily = computed.fontFamily;
          el.style.fontSize = computed.fontSize;
          el.style.fontWeight = computed.fontWeight;
          el.style.lineHeight = computed.lineHeight;
          el.style.padding = computed.padding;
          el.style.margin = computed.margin;
          el.style.display = computed.display;
          el.style.border = computed.border;
          
          // Force visibility if hidden
          if (computed.visibility === 'hidden' || computed.opacity === '0') {
            el.style.visibility = 'visible';
            el.style.opacity = '1';
          }
        } catch (e) {
          console.error('Error applying styles to element:', e);
        }
      }
    });
    
    console.log('[PDF Generator] Starting PDF generation...');
    console.log('[PDF Generator] Element dimensions:', element.offsetWidth, 'x', element.offsetHeight);
    console.log('[PDF Generator] Using options:', JSON.stringify(mergedOptions));

    // Create a clone of the element to avoid modifying the original
    const clone = element.cloneNode(true);
    document.body.appendChild(clone);
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '0';

    try {
      window.html2pdf()
        .from(clone)
        .set(mergedOptions)
        .outputPdf('blob')
        .then(blob => {
          // Restore original styles
          elements.forEach(el => {
            if (originalStyles.has(el)) {
              el.style.cssText = originalStyles.get(el);
            }
          });
          
          // Remove clone
          if (document.body.contains(clone)) {
            document.body.removeChild(clone);
          }
          
          console.log('[PDF Generator] PDF generated successfully, size:', blob.size);
          resolve(blob);
        })
        .catch(err => {
          console.error('[PDF Generator] PDF generation error:', err);
          
          // Try a simpler fallback approach with fewer options
          console.log('[PDF Generator] Trying fallback approach...');
          const fallbackOptions = {
            margin: 10,
            filename: mergedOptions.filename,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { 
              scale: 1,
              useCORS: true, 
              logging: true,
              backgroundColor: '#ffffff'
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
          };
          
          // Use original element for fallback
          window.html2pdf()
            .from(element)
            .set(fallbackOptions)
            .outputPdf('blob')
            .then(blob => {
              console.log('[PDF Generator] Fallback PDF generated, size:', blob.size);
              
              // Restore original styles
              elements.forEach(el => {
                if (originalStyles.has(el)) {
                  el.style.cssText = originalStyles.get(el);
                }
              });
              
              // Remove clone
              if (document.body.contains(clone)) {
                document.body.removeChild(clone);
              }
              
              resolve(blob);
            })
            .catch(fallbackErr => {
              console.error('[PDF Generator] Fallback PDF generation failed:', fallbackErr);
              
              // Restore original styles
              elements.forEach(el => {
                if (originalStyles.has(el)) {
                  el.style.cssText = originalStyles.get(el);
                }
              });
              
              // Remove clone
              if (document.body.contains(clone)) {
                document.body.removeChild(clone);
              }
              
              reject(fallbackErr);
            });
        });
    } catch (err) {
      console.error('[PDF Generator] Unexpected error:', err);
      
      // Restore original styles
      elements.forEach(el => {
        if (originalStyles.has(el)) {
          el.style.cssText = originalStyles.get(el);
        }
      });
      
      // Remove clone
      if (document.body.contains(clone)) {
        document.body.removeChild(clone);
      }
      
      reject(err);
    }
  });
}

// Helper function to download the PDF
export function downloadPdf(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Revoke object URL after short delay to ensure download starts
  setTimeout(() => URL.revokeObjectURL(url), 100);
  
  return url;
}
