'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Database, FileText, Plus } from 'lucide-react';
import { SchemaDefinition } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface SchemaWithCount extends SchemaDefinition {
  entryCount: number;
}

export default function ContentOverview() {
  const [schemas, setSchemas] = useState<SchemaWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSchemasWithCounts();
  }, []);

  const fetchSchemasWithCounts = async () => {
    try {
      const response = await fetch('/api/admin/schemas');
      if (!response.ok) {
        throw new Error('Failed to fetch schemas');
      }
      
      const data = await response.json();
      const schemasWithCounts = await Promise.all(
        data.schemas.map(async (schema: SchemaDefinition) => {
          try {
            const dataResponse = await fetch(`/api/admin/data/${schema.id}`);
            if (dataResponse.ok) {
              const dataResult = await dataResponse.json();
              return {
                ...schema,
                entryCount: dataResult.data?.length || 0
              };
            }
            return { ...schema, entryCount: 0 };
          } catch {
            return { ...schema, entryCount: 0 };
          }
        })
      );
      
      setSchemas(schemasWithCounts);
    } catch {
      setError('Failed to fetch schemas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading content overview...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-b border-gray-200 pb-5 sm:flex sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Content Overview
          </h3>
          <p className="mt-2 max-w-4xl text-sm text-gray-500">
            Manage content entries across all your schemas
          </p>
        </div>
        <div className="mt-3 sm:mt-0 sm:ml-4">
          <Button asChild>
            <Link href="/admin/schemas/new">
              <Plus className="w-4 h-4 mr-2" />
              New Schema
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {schemas.length === 0 ? (
        <div className="text-center py-12">
          <Database className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No schemas</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new content schema.
          </p>
          <div className="mt-6">
            <Button asChild>
              <Link href="/admin/schemas/new">
                <Plus className="w-4 h-4 mr-2" />
                New Schema
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
          {schemas.map((schema) => (
            <Card key={schema.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Database className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-3">
                      <CardTitle className="text-base font-medium text-gray-900">
                        {schema.displayName}
                      </CardTitle>
                      <p className="text-sm text-gray-500">
                        {schema.fields.length} fields defined
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {schema.entryCount} {schema.entryCount === 1 ? 'entry' : 'entries'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <FileText className="h-4 w-4 mr-1" />
                    Content Type: {schema.id}
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/content/${schema.id}`}>
                        Manage Content
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/content/${schema.id}/new`}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add Entry
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}