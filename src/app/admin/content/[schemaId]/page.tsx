'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Edit, Trash2, ArrowLeft, Eye, Search } from 'lucide-react';
import { SchemaDefinition, DataEntry } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SchemaDataResponse {
  data: DataEntry[];
  schema: SchemaDefinition;
}

export default function SchemaDataPage() {
  const params = useParams();
  const router = useRouter();
  const schemaId = params.schemaId as string;

  const [schemaData, setSchemaData] = useState<SchemaDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState<DataEntry[]>([]);

  const fetchSchemaData = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/data/${schemaId}`);
      if (response.ok) {
        const data = await response.json();
        setSchemaData(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch data');
      }
    } catch {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [schemaId]);

  useEffect(() => {
    fetchSchemaData();
  }, [fetchSchemaData]);

  useEffect(() => {
    if (schemaData) {
      const filtered = schemaData.data.filter(entry => {
        return Object.values(entry).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
      setFilteredData(filtered);
    }
  }, [schemaData, searchTerm]);

  const deleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/data/${schemaId}/${entryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSchemaData(prev => prev ? {
          ...prev,
          data: prev.data.filter(entry => entry.id !== entryId)
        } : null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete entry');
      }
    } catch {
      setError('Failed to delete entry');
    }
  };

  const formatValue = (value: unknown, fieldType: string): string => {
    if (value === null || value === undefined) return '';
    
    switch (fieldType) {
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'date':
        try {
          return new Date(value as string).toLocaleDateString();
        } catch {
          return String(value);
        }
      default:
        return String(value);
    }
  };

  const truncateText = (text: string, maxLength: number = 50): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading data...</div>
      </div>
    );
  }

  if (!schemaData) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-medium text-gray-900">Schema not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The requested schema could not be found.
          </p>
          <div className="mt-6">
            <Button asChild>
              <Link href="/admin">
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { schema, data } = schemaData;

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <div className="border-b border-gray-200 pb-5 sm:flex sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {schema.displayName} Data
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Manage content entries for the {schema.displayName} schema.
          </p>
        </div>
        <div className="mt-3 sm:mt-0 sm:ml-4">
          <Button asChild>
            <Link href={`/admin/content/${schemaId}/new`}>
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {data.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No entries</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first content entry.
          </p>
          <div className="mt-6">
            <Button asChild>
              <Link href={`/admin/content/${schemaId}/new`}>
                <Plus className="w-4 h-4 mr-2" />
                Add Entry
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-6 flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-gray-500">
              {filteredData.length} of {data.length} entries
            </div>
          </div>

          <Card className="mt-6">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {schema.fields.slice(0, 4).map((field) => (
                        <TableHead key={field.name} className="font-medium">
                          {field.label}
                        </TableHead>
                      ))}
                      {schema.fields.length > 4 && (
                        <TableHead>...</TableHead>
                      )}
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((entry) => (
                      <TableRow key={entry.id}>
                        {schema.fields.slice(0, 4).map((field) => (
                          <TableCell key={field.name}>
                            {truncateText(formatValue(entry[field.name], field.type))}
                          </TableCell>
                        ))}
                        {schema.fields.length > 4 && (
                          <TableCell className="text-gray-400">
                            +{schema.fields.length - 4} more
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/admin/content/${schemaId}/${entry.id}`}>
                                <Eye className="w-4 h-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/admin/content/${schemaId}/${entry.id}/edit`}>
                                <Edit className="w-4 h-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteEntry(entry.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}