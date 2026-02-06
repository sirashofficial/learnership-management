// Input sanitization utilities

export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS vectors
    .substring(0, 1000); // Limit length
}

export function sanitizeEmail(email: string): string {
  const sanitized = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(sanitized) ? sanitized : '';
}

export function sanitizeNumber(value: any): number {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

export function sanitizeBoolean(value: any): boolean {
  return value === true || value === 'true';
}

export function sanitizeObject<T extends Record<string, any>>(obj: T, schema: Record<keyof T, 'string' | 'number' | 'boolean' | 'email'>): Partial<T> {
  const sanitized: any = {};
  
  for (const key in schema) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      const type = schema[key];
      
      switch (type) {
        case 'string':
          sanitized[key] = sanitizeString(String(value));
          break;
        case 'email':
          sanitized[key] = sanitizeEmail(String(value));
          break;
        case 'number':
          sanitized[key] = sanitizeNumber(value);
          break;
        case 'boolean':
          sanitized[key] = sanitizeBoolean(value);
          break;
      }
    }
  }
  
  return sanitized;
}

export function preventSQLInjection(input: string): string {
  return input.replace(/['";\\]/g, '');
}
