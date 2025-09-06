import { Low } from 'lowdb';
import { S3Adapter } from './s3-adapter';

// Define the main database schema
export interface DatabaseSchema {
  schemas: SchemaDefinition[];
  data: Record<string, DataEntry[]>;
}

// Define a generic data entry type
export interface DataEntry {
  id: string;
  [key: string]: unknown;
}

// Define field types for dynamic schemas
export type FieldType = 'text' | 'number' | 'boolean' | 'date' | 'email' | 'url' | 'textarea' | 'select';

export interface FieldDefinition {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[]; // For select fields
  };
}

export interface SchemaDefinition {
  id: string;
  name: string;
  displayName: string;
  fields: FieldDefinition[];
  createdAt: string;
  updatedAt: string;
}

// Database initialization
let db: Low<DatabaseSchema> | null = null;

export async function getDatabase(): Promise<Low<DatabaseSchema>> {
  if (db) {
    return db;
  }

  const adapter = new S3Adapter<DatabaseSchema>({
    bucketName: process.env.S3_BUCKET_NAME!,
    key: 'cms-database.json',
  });

  db = new Low(adapter, { schemas: [], data: {} });
  await db.read();

  // Initialize default data if needed
  if (!db.data) {
    db.data = { schemas: [], data: {} };
    await db.write();
  }

  return db;
}

// Helper function to get data for a specific schema
export async function getSchemaData(schemaId: string): Promise<DataEntry[]> {
  const database = await getDatabase();
  return database.data.data[schemaId] || [];
}

// Helper function to save data for a specific schema
export async function saveSchemaData(schemaId: string, data: DataEntry[]): Promise<void> {
  const database = await getDatabase();
  database.data.data[schemaId] = data;
  await database.write();
}

export default getDatabase;