'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SchemaDefinition } from '@/lib/database';
import DataEntryForm from '@/components/DataEntryForm';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function NewDataEntryPage() {
  const params = useParams();
  const router = useRouter();
  const schemaId = params.schemaId as string;

  const [schema, setSchema] = useState<SchemaDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchSchema = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/schemas/${schemaId}`);
      if (response.ok) {
        const data = await response.json();
        setSchema(data.schema);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Schema not found');
      }
    } catch {
      setError('Failed to fetch schema');
    } finally {
      setLoading(false);
    }
  }, [schemaId]);

  useEffect(() => {
    fetchSchema();
  }, [fetchSchema]);

  const handleSubmit = async (data: Record<string, unknown>) => {
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/data/${schemaId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        router.push(`/admin/content/${schemaId}`);
      } else {
        const errorData = await response.json();
        if (errorData.details) {
          // Validation errors
          const validationErrors = Object.values(errorData.details).join(', ');
          throw new Error(validationErrors);
        } else {
          throw new Error(errorData.error || 'Failed to create entry');
        }
      }
    } catch (err) {
      throw err; // Re-throw to be handled by DataEntryForm
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading schema...</div>
      </div>
    );
  }

  if (error || !schema) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <Alert variant="destructive">
          <AlertDescription>{error || 'Schema not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <DataEntryForm
      schema={schema}
      onSubmit={handleSubmit}
      submitLabel="Create Entry"
      isLoading={submitting}
    />
  );
}