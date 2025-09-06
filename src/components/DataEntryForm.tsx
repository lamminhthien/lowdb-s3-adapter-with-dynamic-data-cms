'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { ArrowLeft } from 'lucide-react';
import { SchemaDefinition, DataEntry, FieldDefinition } from '@/lib/database';
import { getDefaultValueForField } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface DataEntryFormProps {
  schema: SchemaDefinition;
  initialData?: DataEntry;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  submitLabel?: string;
  isLoading?: boolean;
}

interface FormField {
  [key: string]: unknown;
}

export default function DataEntryForm({
  schema,
  initialData,
  onSubmit,
  submitLabel = 'Save',
  isLoading = false,
}: DataEntryFormProps) {
  const router = useRouter();
  const [error, setError] = useState('');

  // Create default values based on schema fields
  const createDefaultValues = (): FormField => {
    const defaults: FormField = {};
    
    schema.fields.forEach((field) => {
      if (initialData && initialData[field.name] !== undefined) {
        defaults[field.name] = initialData[field.name];
      } else {
        defaults[field.name] = getDefaultValueForField(field);
      }
    });

    return defaults;
  };

  const form = useForm<FormField>({
    defaultValues: createDefaultValues(),
  });

  const handleSubmit = async (data: FormField) => {
    setError('');
    
    try {
      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const renderField = (field: FieldDefinition) => {
    const fieldName = field.name;

    switch (field.type) {
      case 'text':
      case 'email':
      case 'url':
        return (
          <FormField
            control={form.control}
            name={fieldName}
            rules={{
              required: field.required ? `${field.label} is required` : false,
              ...(field.type === 'email' && {
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Please enter a valid email address',
                },
              }),
              ...(field.type === 'url' && {
                validate: (value: unknown) => {
                  if (!value) return !field.required || `${field.label} is required`;
                  try {
                    new URL(value as string);
                    return true;
                  } catch {
                    return 'Please enter a valid URL';
                  }
                },
              }),
              ...(field.validation?.min && {
                minLength: {
                  value: field.validation.min,
                  message: `${field.label} must be at least ${field.validation.min} characters`,
                },
              }),
              ...(field.validation?.max && {
                maxLength: {
                  value: field.validation.max,
                  message: `${field.label} must be no more than ${field.validation.max} characters`,
                },
              }),
            }}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </FormLabel>
                <FormControl>
                  <Input
                    type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    {...formField}
                    value={formField.value as string || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'textarea':
        return (
          <FormField
            control={form.control}
            name={fieldName}
            rules={{
              required: field.required ? `${field.label} is required` : false,
              ...(field.validation?.min && {
                minLength: {
                  value: field.validation.min,
                  message: `${field.label} must be at least ${field.validation.min} characters`,
                },
              }),
              ...(field.validation?.max && {
                maxLength: {
                  value: field.validation.max,
                  message: `${field.label} must be no more than ${field.validation.max} characters`,
                },
              }),
            }}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    className="resize-none"
                    rows={3}
                    {...formField}
                    value={formField.value as string || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'number':
        return (
          <FormField
            control={form.control}
            name={fieldName}
            rules={{
              required: field.required ? `${field.label} is required` : false,
              validate: (value: unknown) => {
                if (!value && !field.required) return true;
                const numValue = Number(value);
                if (isNaN(numValue)) return `${field.label} must be a number`;
                
                if (field.validation?.min !== undefined && numValue < field.validation.min) {
                  return `${field.label} must be at least ${field.validation.min}`;
                }
                if (field.validation?.max !== undefined && numValue > field.validation.max) {
                  return `${field.label} must be no more than ${field.validation.max}`;
                }
                return true;
              },
            }}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    {...formField}
                    value={formField.value as number || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? '' : Number(e.target.value);
                      formField.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'boolean':
        return (
          <FormField
            control={form.control}
            name={fieldName}
            render={({ field: formField }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={formField.value as boolean}
                    onCheckedChange={formField.onChange}
                  />
                </FormControl>
                <FormLabel className="text-sm font-normal">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </FormLabel>
              </FormItem>
            )}
          />
        );

      case 'date':
        return (
          <FormField
            control={form.control}
            name={fieldName}
            rules={{
              required: field.required ? `${field.label} is required` : false,
            }}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...formField}
                    value={formField.value as string || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'select':
        return (
          <FormField
            control={form.control}
            name={fieldName}
            rules={{
              required: field.required ? `${field.label} is required` : false,
            }}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </FormLabel>
                <Select onValueChange={formField.onChange} value={formField.value as string || ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {field.validation?.options?.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="border-b border-gray-200 pb-5">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          {initialData ? 'Edit' : 'Create'} {schema.displayName} Entry
        </h3>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Entry Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {schema.fields.map((field) => (
                  <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                    {renderField(field)}
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : submitLabel}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}