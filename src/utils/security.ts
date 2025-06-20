
import { z } from 'zod';

// Input sanitization utility
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>\"'%;()&+]/g, '') // Remove potentially dangerous characters
    .replace(/--/g, '') // Remove SQL comment syntax
    .replace(/\/\*/g, '') // Remove SQL comment start
    .replace(/\*\//g, '') // Remove SQL comment end
    .replace(/xp_/gi, '') // Remove SQL Server extended procedures
    .replace(/sp_/gi, '') // Remove SQL Server stored procedures
    .replace(/union/gi, '') // Remove UNION keyword
    .replace(/select/gi, '') // Remove SELECT keyword
    .replace(/insert/gi, '') // Remove INSERT keyword
    .replace(/update/gi, '') // Remove UPDATE keyword
    .replace(/delete/gi, '') // Remove DELETE keyword
    .replace(/drop/gi, '') // Remove DROP keyword
    .replace(/create/gi, '') // Remove CREATE keyword
    .replace(/alter/gi, '') // Remove ALTER keyword
    .replace(/exec/gi, '') // Remove EXEC keyword
    .replace(/script/gi, '') // Remove script tags
    .substring(0, 1000); // Limit length
};

// Email validation schema
export const emailSchema = z.string()
  .email('Format email tidak valid')
  .min(5, 'Email minimal 5 karakter')
  .max(254, 'Email maksimal 254 karakter')
  .refine((email) => {
    const sanitized = sanitizeInput(email);
    return sanitized === email.trim();
  }, 'Email mengandung karakter tidak diizinkan');

// Name validation schema
export const nameSchema = z.string()
  .min(2, 'Nama minimal 2 karakter')
  .max(100, 'Nama maksimal 100 karakter')
  .regex(/^[a-zA-Z\s.-]+$/, 'Nama hanya boleh mengandung huruf, spasi, titik, dan tanda hubung')
  .refine((name) => {
    const sanitized = sanitizeInput(name);
    return sanitized.length > 0;
  }, 'Nama mengandung karakter berbahaya');

// Phone validation schema
export const phoneSchema = z.string()
  .min(10, 'Nomor telepon minimal 10 digit')
  .max(15, 'Nomor telepon maksimal 15 digit')
  .regex(/^[\+]?[0-9\s\-\(\)]+$/, 'Format nomor telepon tidak valid')
  .refine((phone) => {
    const digitsOnly = phone.replace(/[^\d]/g, '');
    return digitsOnly.length >= 10 && digitsOnly.length <= 15;
  }, 'Nomor telepon harus 10-15 digit');

// Message validation schema
export const messageSchema = z.string()
  .min(10, 'Pesan minimal 10 karakter')
  .max(1000, 'Pesan maksimal 1000 karakter')
  .refine((message) => {
    const sanitized = sanitizeInput(message);
    return sanitized.length >= 10;
  }, 'Pesan mengandung karakter berbahaya atau terlalu pendek setelah sanitasi');

// Complete contact form validation schema
export const contactFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  message: messageSchema,
});

// Rate limiting utility
class RateLimiter {
  private attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) { // 5 attempts per 15 minutes
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const userAttempts = this.attempts.get(identifier);

    if (!userAttempts) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }

    // Reset if window has passed
    if (now - userAttempts.lastAttempt > this.windowMs) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }

    // Check if under limit
    if (userAttempts.count < this.maxAttempts) {
      userAttempts.count++;
      userAttempts.lastAttempt = now;
      return true;
    }

    return false;
  }

  getRemainingTime(identifier: string): number {
    const userAttempts = this.attempts.get(identifier);
    if (!userAttempts) return 0;

    const timeRemaining = this.windowMs - (Date.now() - userAttempts.lastAttempt);
    return Math.max(0, timeRemaining);
  }
}

export const contactFormLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 submissions per 15 minutes

// CSRF token utility
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Secure session storage for CSRF tokens
export const setCSRFToken = (token: string): void => {
  try {
    sessionStorage.setItem('csrf_token', token);
  } catch (error) {
    console.error('Failed to set CSRF token:', error);
  }
};

export const getCSRFToken = (): string | null => {
  try {
    return sessionStorage.getItem('csrf_token');
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
    return null;
  }
};

export const validateCSRFToken = (token: string): boolean => {
  const storedToken = getCSRFToken();
  return storedToken !== null && storedToken === token;
};

// Input validation for admin operations
export const adminInputSchema = z.object({
  name: z.string()
    .min(2, 'Nama minimal 2 karakter')
    .max(100, 'Nama maksimal 100 karakter')
    .regex(/^[a-zA-Z0-9\s.-]+$/, 'Nama hanya boleh mengandung huruf, angka, spasi, titik, dan tanda hubung'),
  
  description: z.string()
    .max(500, 'Deskripsi maksimal 500 karakter')
    .optional()
    .refine((desc) => {
      if (!desc) return true;
      const sanitized = sanitizeInput(desc);
      return sanitized.length > 0;
    }, 'Deskripsi mengandung karakter berbahaya'),
    
  price: z.number()
    .min(0, 'Harga tidak boleh negatif')
    .max(10000000, 'Harga maksimal 10 juta')
    .finite('Harga harus berupa angka valid'),
});

// Secure local storage wrapper
export const secureStorage = {
  setItem: (key: string, value: string): void => {
    try {
      const sanitizedKey = sanitizeInput(key);
      const sanitizedValue = sanitizeInput(value);
      localStorage.setItem(sanitizedKey, sanitizedValue);
    } catch (error) {
      console.error('Secure storage set error:', error);
    }
  },
  
  getItem: (key: string): string | null => {
    try {
      const sanitizedKey = sanitizeInput(key);
      return localStorage.getItem(sanitizedKey);
    } catch (error) {
      console.error('Secure storage get error:', error);
      return null;
    }
  },
  
  removeItem: (key: string): void => {
    try {
      const sanitizedKey = sanitizeInput(key);
      localStorage.removeItem(sanitizedKey);
    } catch (error) {
      console.error('Secure storage remove error:', error);
    }
  }
};
