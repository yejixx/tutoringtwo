/**
 * Input sanitization utilities for security
 */

/**
 * Sanitize a string by removing potentially dangerous characters
 * Use for text that will be displayed in the UI
 */
export function sanitizeString(input: string): string {
  if (!input) return input;
  
  return input
    .trim()
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove control characters except newlines and tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ');
}

/**
 * Sanitize HTML content to prevent XSS
 * Removes all HTML tags
 */
export function stripHtml(input: string): string {
  if (!input) return input;
  
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Validate and sanitize an email address
 */
export function sanitizeEmail(email: string): string | null {
  if (!email) return null;
  
  const sanitized = email.trim().toLowerCase();
  
  // Basic email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(sanitized)) {
    return null;
  }
  
  return sanitized;
}

/**
 * Validate URL (only allow http/https)
 */
export function sanitizeUrl(url: string): string | null {
  if (!url) return null;
  
  const trimmed = url.trim();
  
  try {
    const parsed = new URL(trimmed);
    
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Validate ID format (UUID v4)
 */
export function isValidUuid(id: string): boolean {
  if (!id) return false;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Validate CUID format (Prisma default IDs)
 */
export function isValidCuid(id: string): boolean {
  if (!id) return false;
  
  // CUID format: starts with 'c', 25 characters
  const cuidRegex = /^c[a-z0-9]{24}$/;
  return cuidRegex.test(id);
}

/**
 * Validate ID format (accepts both UUID and CUID)
 */
export function isValidId(id: string): boolean {
  return isValidUuid(id) || isValidCuid(id);
}

/**
 * Sanitize a booking notes field
 */
export function sanitizeNotes(notes: string | null | undefined): string | null {
  if (!notes) return null;
  
  return stripHtml(sanitizeString(notes)).slice(0, 2000); // Max 2000 chars
}

/**
 * Sanitize a message content
 */
export function sanitizeMessage(message: string): string {
  if (!message) return message;
  
  return stripHtml(sanitizeString(message)).slice(0, 5000); // Max 5000 chars
}

/**
 * Validate numeric input within range
 */
export function validateNumber(
  value: unknown,
  min: number,
  max: number
): number | null {
  const num = Number(value);
  
  if (isNaN(num) || num < min || num > max) {
    return null;
  }
  
  return num;
}

/**
 * Validate price input (positive number, max 2 decimal places)
 */
export function validatePrice(value: unknown): number | null {
  const num = Number(value);
  
  if (isNaN(num) || num < 0 || num > 10000) {
    return null;
  }
  
  // Round to 2 decimal places
  return Math.round(num * 100) / 100;
}
