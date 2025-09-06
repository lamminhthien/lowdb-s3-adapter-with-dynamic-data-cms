'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Database } from 'lucide-react';
import { SchemaDefinition } from '@/lib/database';

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
          <Link
            href="/admin/schemas/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Schema
          </Link>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {schemas.length === 0 ? (
        <div className="text-center py-12">
          <Database className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No schemas</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new content schema.
          </p>
          <div className="mt-6">
            <Link
              href="/admin/schemas/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Schema
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {schemas.map((schema) => (
            <div key={schema.id} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Database className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {schema.displayName}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {schema.fields.length} fields
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-3">
                <div className="text-sm">
                  <div className="flex justify-between items-center">
                    <Link
                      href={`/admin/content/${schema.id}`}
                      className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Manage Content
                    </Link>
                    <div className="flex space-x-2">
                      <Link
                        href={`/admin/schemas/${schema.id}/edit`}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => deleteSchema(schema.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}