import { z } from 'zod';
import { FieldDefinition, SchemaDefinition } from '@/lib/database';

// Zod schema for field validation
export const fieldValidationSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  options: z.array(z.string()).optional(),
});

export const fieldDefinitionSchema = z.object({
  name: z.string().min(1, 'Field name is required').regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Field name must be a valid identifier'),
  label: z.string().min(1, 'Field label is required'),
  type: z.enum(['text', 'number', 'boolean', 'date', 'email', 'url', 'textarea', 'select'] as const),
  required: z.boolean(),
  validation: fieldValidationSchema.optional(),
});

export const schemaDefinitionSchema = z.object({
  name: z.string().min(1, 'Schema name is required').regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Schema name must be a valid identifier'),
  displayName: z.string().min(1, 'Display name is required'),
  fields: z.array(fieldDefinitionSchema).min(1, 'At least one field is required'),
});

// Utility functions for validation
export function validateFieldValue(value: unknown, field: FieldDefinition): string | null {
  // Required field validation
  if (field.required && (value === null || value === undefined || value === '')) {
    return `${field.label} is required`;
  }

  // Skip validation for empty optional fields
  if (!field.required && (value === null || value === undefined || value === '')) {
    return null;
  }

  // Type-specific validation
  switch (field.type) {
    case 'text':
    case 'textarea':
      if (typeof value !== 'string') {
        return `${field.label} must be text`;
      }
      if (field.validation?.min && value.length < field.validation.min) {
        return `${field.label} must be at least ${field.validation.min} characters`;
      }
      if (field.validation?.max && value.length > field.validation.max) {
        return `${field.label} must be no more than ${field.validation.max} characters`;
      }
      if (field.validation?.pattern) {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(value)) {
          return `${field.label} format is invalid`;
        }
      }
      break;

    case 'number':
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (typeof numValue !== 'number' || isNaN(numValue)) {
        return `${field.label} must be a number`;
      }
      if (field.validation?.min !== undefined && numValue < field.validation.min) {
        return `${field.label} must be at least ${field.validation.min}`;
      }
      if (field.validation?.max !== undefined && numValue > field.validation.max) {
        return `${field.label} must be no more than ${field.validation.max}`;
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        return `${field.label} must be true or false`;
      }
      break;

    case 'date':
      if (typeof value !== 'string' || isNaN(Date.parse(value))) {
        return `${field.label} must be a valid date`;
      }
      break;

    case 'email':
      if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return `${field.label} must be a valid email address`;
      }
      break;

    case 'url':
      if (typeof value !== 'string') {
        return `${field.label} must be a valid URL`;
      }
      try {
        new URL(value);
      } catch {
        return `${field.label} must be a valid URL`;
      }
      break;

    case 'select':
      if (!field.validation?.options?.includes(value as string)) {
        return `${field.label} must be one of the available options`;
      }
      break;
  }

  return null;
}

export function validateDataEntry(data: Record<string, unknown>, schema: SchemaDefinition): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of schema.fields) {
    const error = validateFieldValue(data[field.name], field);
    if (error) {
      errors[field.name] = error;
    }
  }

  return errors;
}

export function getDefaultValueForField(field: FieldDefinition): unknown {
  switch (field.type) {
    case 'text':
    case 'textarea':
    case 'email':
    case 'url':
      return '';
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'date':
      return new Date().toISOString().split('T')[0];
    case 'select':
      return field.validation?.options?.[0] || '';
    default:
      return '';
  }
}

const validationUtils = {
  fieldDefinitionSchema,
  schemaDefinitionSchema,
  validateFieldValue,
  validateDataEntry,
  getDefaultValueForField,
};

export default validationUtils;