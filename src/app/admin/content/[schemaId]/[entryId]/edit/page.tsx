'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SchemaDefinition, DataEntry } from '@/lib/database';
import DataEntryForm from '@/components/DataEntryForm';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EntryWithSchema {
  entry: DataEntry;
  schema: SchemaDefinition;
}

export default function EditDataEntryPage() {
  const params = useParams();
  const router = useRouter();
  const schemaId = params.schemaId as string;
  const entryId = params.entryId as string;

  const [data, setData] = useState<EntryWithSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchEntryData = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/data/${schemaId}/${entryId}`);
      if (response.ok) {
        const responseData = await response.json();
        setData(responseData);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Entry not found');
      }
    } catch {
      setError('Failed to fetch entry');
    } finally {
      setLoading(false);
    }
  }, [schemaId, entryId]);

  useEffect(() => {
    fetchEntryData();
  }, [fetchEntryData]);

  const handleSubmit = async (formData: Record<string, unknown>) => {
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/data/${schemaId}/${entryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
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
          throw new Error(errorData.error || 'Failed to update entry');
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
        <div className="text-lg">Loading entry...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <Alert variant="destructive">
          <AlertDescription>{error || 'Entry not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <DataEntryForm
      schema={data.schema}
      initialData={data.entry}
      onSubmit={handleSubmit}
      submitLabel="Update Entry"
      isLoading={submitting}
    />
  );
}