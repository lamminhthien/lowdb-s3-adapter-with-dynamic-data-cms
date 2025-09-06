'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { SchemaDefinition, DataEntry } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface EntryWithSchema {
  entry: DataEntry;
  schema: SchemaDefinition;
}

export default function DataEntryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const schemaId = params.schemaId as string;
  const entryId = params.entryId as string;

  const [data, setData] = useState<EntryWithSchema | null>(null);
  const [loading, setLoading] = useState(true);
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

  const deleteEntry = async () => {
    if (!confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/data/${schemaId}/${entryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push(`/admin/content/${schemaId}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete entry');
      }
    } catch {
      setError('Failed to delete entry');
    }
  };

  const formatValue = (value: unknown, fieldType: string): React.ReactNode => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400 italic">Not set</span>;
    }

    switch (fieldType) {
      case 'boolean':
        return (
          <Badge variant={value ? 'default' : 'secondary'}>
            {value ? 'Yes' : 'No'}
          </Badge>
        );
      case 'date':
        try {
          return new Date(value as string).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        } catch {
          return String(value);
        }
      case 'email':
        return (
          <a href={`mailto:${value}`} className="text-blue-600 hover:underline">
            {String(value)}
          </a>
        );
      case 'url':
        return (
          <a 
            href={String(value)} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-600 hover:underline"
          >
            {String(value)}
          </a>
        );
      case 'textarea':
        return (
          <div className="whitespace-pre-wrap">
            {String(value)}
          </div>
        );
      default:
        return String(value);
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

  const { entry, schema } = data;

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/admin/content/${schemaId}`)}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to {schema.displayName} List
        </Button>
      </div>

      <div className="border-b border-gray-200 pb-5 sm:flex sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {schema.displayName} Entry
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            ID: {entry.id}
          </p>
        </div>
        <div className="mt-3 sm:mt-0 sm:ml-4 flex space-x-3">
          <Button variant="outline" asChild>
            <Link href={`/admin/content/${schemaId}/${entryId}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button variant="destructive" onClick={deleteEntry}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mt-6 grid gap-6">
        {schema.fields.map((field) => (
          <Card key={field.name}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
                <Badge variant="outline" className="ml-2 text-xs">
                  {field.type}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-900">
                {formatValue(entry[field.name], field.type)}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Metadata */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-500">Created:</span>
                <div className="text-gray-900">
                  {entry.createdAt 
                    ? new Date(entry.createdAt as string).toLocaleString()
                    : 'Not available'
                  }
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-500">Updated:</span>
                <div className="text-gray-900">
                  {entry.updatedAt 
                    ? new Date(entry.updatedAt as string).toLocaleString()
                    : 'Not available'
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}