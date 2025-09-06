'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { schemaDefinitionSchema } from '@/lib/validation';
import { FieldDefinition, FieldType } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface SchemaFormData {
  name: string;
  displayName: string;
  fields: FieldDefinition[];
}

interface SchemaFormProps {
  schemaId?: string;
  initialData?: SchemaFormData;
}

const fieldTypes: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date', label: 'Date' },
  { value: 'email', label: 'Email' },
  { value: 'url', label: 'URL' },
  { value: 'select', label: 'Select' },
];

export default function SchemaForm({ schemaId, initialData }: SchemaFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const form = useForm<SchemaFormData>({
    resolver: zodResolver(schemaDefinitionSchema),
    defaultValues: initialData || {
      name: '',
      displayName: '',
      fields: [
        {
          name: '',
          label: '',
          type: 'text',
          required: false,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'fields',
  });

  const watchedFields = form.watch('fields');

  const onSubmit = async (data: SchemaFormData) => {
    setLoading(true);
    setError('');

    try {
      const url = schemaId ? `/api/admin/schemas/${schemaId}` : '/api/admin/schemas';
      const method = schemaId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        router.push('/admin');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save schema');
      }
    } catch {
      setError('Failed to save schema');
    } finally {
      setLoading(false);
    }
  };

  const addField = () => {
    append({
      name: '',
      label: '',
      type: 'text',
      required: false,
    });
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
          {schemaId ? 'Edit Schema' : 'Create New Schema'}
        </h3>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Schema Name (Internal)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., blog_posts" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Blog Posts" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <div className="flex justify-between items-center mb-4">
              <Label className="text-sm font-medium">Fields</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addField}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Field
              </Button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <Card key={field.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm">Field {index + 1}</CardTitle>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`fields.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Field Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`fields.${index}.label`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Field Label</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`fields.${index}.type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Field Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select field type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {fieldTypes.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`fields.${index}.required`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              Required field
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Show options field for select type */}
                    {watchedFields[index]?.type === 'select' && (
                      <FormField
                        control={form.control}
                        name={`fields.${index}.validation.options`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Options (one per line)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Option 1&#10;Option 2&#10;Option 3"
                                className="resize-none"
                                {...field}
                                value={Array.isArray(field.value) ? field.value.join('\n') : field.value || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(value ? value.split('\n').filter(Boolean) : []);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : schemaId ? 'Update Schema' : 'Create Schema'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}