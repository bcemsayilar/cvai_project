import DOMPurify from 'dompurify';
import validator from 'validator';

// Client-side sanitization utilities
export const sanitizer = {
  // Sanitize HTML content (for browser environments)
  sanitizeHtml: (dirty: string): string => {
    if (typeof window === 'undefined') {
      // Server-side: basic HTML entity encoding
      return dirty
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }
    
    // Client-side: use DOMPurify
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
    });
  },

  // Strip all HTML tags (for plain text)
  stripHtml: (dirty: string): string => {
    if (typeof window === 'undefined') {
      // Server-side: basic tag removal
      return dirty.replace(/<[^>]*>/g, '');
    }
    
    // Client-side: use DOMPurify to strip all tags
    return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
  },

  // Sanitize user input for database storage
  sanitizeUserInput: (input: string): string => {
    if (!input || typeof input !== 'string') return '';
    
    // Normalize whitespace and trim
    let cleaned = input.trim().replace(/\s+/g, ' ');
    
    // Remove potential XSS vectors
    cleaned = cleaned
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
    
    // Limit length to prevent DoS
    if (cleaned.length > 10000) {
      cleaned = cleaned.substring(0, 10000);
    }
    
    return cleaned;
  },

  // Validate and sanitize email
  sanitizeEmail: (email: string): string | null => {
    if (!email || typeof email !== 'string') return null;
    
    const trimmed = email.trim().toLowerCase();
    return validator.isEmail(trimmed) ? trimmed : null;
  },

  // Sanitize file names
  sanitizeFileName: (fileName: string): string => {
    if (!fileName || typeof fileName !== 'string') return 'untitled';
    
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/^[._]+|[._]+$/g, '') // Remove leading/trailing dots and underscores
      .substring(0, 255); // Limit length
  },

  // Sanitize LaTeX content to prevent injection (minimal sanitization)
  sanitizeLatex: (latex: string): string => {
    if (!latex || typeof latex !== 'string') return '';
    
    // Only remove extremely dangerous commands that could access file system
    const dangerousCommands = [
      '\\write18', '\\immediate\\write18', '\\shell', '\\system',
      '\\openin', '\\openout', '\\read', '\\write'
    ];
    
    let sanitized = latex;
    dangerousCommands.forEach(cmd => {
      const regex = new RegExp(`${cmd.replace(/\\/g, '\\\\')}`, 'gi');
      sanitized = sanitized.replace(regex, '');
    });
    
    // Remove only extremely dangerous patterns
    sanitized = sanitized
      .replace(/\\immediate\s*\\write\d+/gi, '') // Block file writes
      .replace(/\\catcode\s*`[^=]*=\s*0/gi, ''); // Block escape character redefinition
    
    return sanitized;
  }
};

// Validation utilities
export const validator_utils = {
  // Validate file upload
  validateFileUpload: (file: File): { valid: boolean; error?: string } => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.' };
    }
    
    if (file.size > maxSize) {
      return { valid: false, error: 'File size too large. Maximum size is 10MB.' };
    }
    
    if (file.size === 0) {
      return { valid: false, error: 'File is empty.' };
    }
    
    return { valid: true };
  },

  // Validate resume ID format
  validateResumeId: (id: string): boolean => {
    return validator.isUUID(id);
  },

  // Validate user input length and content
  validateTextInput: (text: string, maxLength = 1000): { valid: boolean; error?: string } => {
    if (!text || typeof text !== 'string') {
      return { valid: false, error: 'Input is required.' };
    }
    
    if (text.length > maxLength) {
      return { valid: false, error: `Input too long. Maximum ${maxLength} characters allowed.` };
    }
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /data:.*base64/i,
      /vbscript:/i
    ];
    
    if (suspiciousPatterns.some(pattern => pattern.test(text))) {
      return { valid: false, error: 'Input contains prohibited content.' };
    }
    
    return { valid: true };
  }
};

// Server-side safe HTML sanitization (for Node.js environment)
export const serverSanitizer = {
  // Basic HTML entity encoding for server-side
  encodeHtml: (unsafe: string): string => {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  // Remove all HTML tags (server-side)
  stripTags: (html: string): string => {
    return html.replace(/<[^>]*>/g, '');
  }
};
