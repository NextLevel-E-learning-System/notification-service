import { Request, Response, NextFunction } from 'express';

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}

export function validateBody(rules: ValidationRule[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];
    
    for (const rule of rules) {
      const value = req.body[rule.field];
      
      // Check required
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${rule.field} is required`);
        continue;
      }
      
      // Skip further validation if field is not provided and not required
      if (value === undefined || value === null) {
        continue;
      }
      
      // Check type
      if (rule.type) {
        let actualType: string;
        if (Array.isArray(value)) {
          actualType = 'array';
        } else if (value === null) {
          actualType = 'null';
        } else if (typeof value === 'object') {
          actualType = 'object';
        } else {
          actualType = typeof value;
        }
        
        if (actualType !== rule.type) {
          errors.push(`${rule.field} must be of type ${rule.type}`);
          continue;
        }
      }
      
      // Check string validations
      if (typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push(`${rule.field} must be at least ${rule.minLength} characters`);
        }
        
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(`${rule.field} must be at most ${rule.maxLength} characters`);
        }
        
        if (rule.pattern && !rule.pattern.test(value)) {
          errors.push(`${rule.field} format is invalid`);
        }
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'validation_failed',
        details: errors
      });
    }
    
    next();
  };
}

// Common validation patterns
export const validationPatterns = {
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  templateCode: /^[a-zA-Z0-9_-]+$/
};

// Predefined validation rules
export const notificationValidation = [
  { field: 'usuario_id', required: true, type: 'string' as const, pattern: validationPatterns.uuid },
  { field: 'titulo', required: true, type: 'string' as const, minLength: 1, maxLength: 200 },
  { field: 'mensagem', required: true, type: 'string' as const, minLength: 1, maxLength: 1000 },
  { field: 'tipo', required: false, type: 'string' as const, maxLength: 50 },
  { field: 'canal', required: false, type: 'string' as const, maxLength: 20 }
];

export const templateValidation = [
  { field: 'codigo', required: true, type: 'string' as const, minLength: 1, maxLength: 50, pattern: validationPatterns.templateCode },
  { field: 'titulo', required: true, type: 'string' as const, minLength: 1, maxLength: 200 },
  { field: 'corpo', required: true, type: 'string' as const, minLength: 1, maxLength: 2000 },
  { field: 'variaveis', required: false, type: 'array' as const },
  { field: 'ativo', required: false, type: 'boolean' as const }
];

export const templateSendValidation = [
  { field: 'usuario_id', required: true, type: 'string' as const, pattern: validationPatterns.uuid },
  { field: 'variables', required: false, type: 'object' as const },
  { field: 'tipo', required: false, type: 'string' as const, maxLength: 50 },
  { field: 'canal', required: false, type: 'string' as const, maxLength: 20 }
];