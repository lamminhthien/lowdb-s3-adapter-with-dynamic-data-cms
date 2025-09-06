'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Database } from 'lucide-react';
import { SchemaDefinition } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminDashboard() {
  const [schemas, setSchemas] = useState<SchemaDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSchemas();
  }, []);

  const fetchSchemas = async () => {
    try {
      const response = await fetch('/api/admin/schemas');
      if (response.ok) {
        const data = await response.json();
        setSchemas(data.schemas);
      } else {
        setError('Failed to fetch schemas');
      }
    } catch {
      setError('Failed to fetch schemas');
    } finally {
      setLoading(false);
    }
  };

  const deleteSchema = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schema? All data will be lost.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/schemas/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSchemas(schemas.filter(s => s.id !== id));
      } else {
        setError('Failed to delete schema');
      }
    } catch {
      setError('Failed to delete schema');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading schemas...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-b border-gray-200 pb-5 sm:flex sm:items-center sm:justify-between">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Content Schemas
        </h3>
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
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {schemas.map((schema) => (
            <Card key={schema.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Database className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <CardTitle className="text-sm font-medium text-gray-500 truncate">
                      {schema.displayName}
                    </CardTitle>
                    <p className="text-lg font-medium text-gray-900">
                      {schema.fields.length} fields
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <Link
                    href={`/admin/content/${schema.id}`}
                    className="font-medium text-primary hover:text-primary/80"
                  >
                    Manage Content
                  </Link>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/schemas/${schema.id}/edit`}>
                        <Edit className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSchema(schema.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
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