import { Low } from 'lowdb';
import { S3Adapter } from './s3-adapter';

// Define the schemas list structure (separate from data)
export interface SchemasListData {
  schemas: SchemaDefinition[];
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

// Database management class
class DatabaseManager {
  private schemasDb: Low<SchemasListData> | null = null;
  private schemaDataDbs: Map<string, Low<DataEntry[]>> = new Map();

  async getSchemasDatabase(): Promise<Low<SchemasListData>> {
    if (this.schemasDb) {
      return this.schemasDb;
    }

    const adapter = new S3Adapter<SchemasListData>({
      bucketName: process.env.S3_BUCKET_NAME!,
      key: 'schemas-list.json',
    });

    this.schemasDb = new Low(adapter, { schemas: [] });
    await this.schemasDb.read();

    // Initialize default data if needed
    if (!this.schemasDb.data) {
      this.schemasDb.data = { schemas: [] };
      await this.schemasDb.write();
    }

    return this.schemasDb;
  }

  async getSchemaDataDatabase(schemaName: string): Promise<Low<DataEntry[]>> {
    if (this.schemaDataDbs.has(schemaName)) {
      return this.schemaDataDbs.get(schemaName)!;
    }

    const adapter = new S3Adapter<DataEntry[]>({
      bucketName: process.env.S3_BUCKET_NAME!,
      key: `schema-data-${schemaName}.json`,
    });

    const db = new Low(adapter, []);
    await db.read();

    // Initialize default data if needed
    if (!db.data) {
      db.data = [];
      await db.write();
    }

    this.schemaDataDbs.set(schemaName, db);
    return db;
  }

  async getAllSchemas(): Promise<SchemaDefinition[]> {
    const db = await this.getSchemasDatabase();
    return db.data.schemas;
  }

  async getSchema(schemaId: string): Promise<SchemaDefinition | undefined> {
    const schemas = await this.getAllSchemas();
    return schemas.find(s => s.id === schemaId);
  }

  async createSchema(schema: Omit<SchemaDefinition, 'id' | 'createdAt' | 'updatedAt'>): Promise<SchemaDefinition> {
    const db = await this.getSchemasDatabase();
    
    // Check if schema name already exists
    const existingSchema = db.data.schemas.find(s => s.name === schema.name);
    if (existingSchema) {
      throw new Error('Schema with this name already exists');
    }

    const newSchema: SchemaDefinition = {
      id: `schema_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...schema,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.data.schemas.push(newSchema);
    await db.write();

    // Initialize empty data file for this schema
    await this.getSchemaDataDatabase(schema.name);

    return newSchema;
  }

  async updateSchema(schemaId: string, updates: Partial<Omit<SchemaDefinition, 'id' | 'createdAt'>>): Promise<SchemaDefinition | null> {
    const db = await this.getSchemasDatabase();
    const schemaIndex = db.data.schemas.findIndex(s => s.id === schemaId);
    
    if (schemaIndex === -1) {
      return null;
    }

    const oldSchema = db.data.schemas[schemaIndex];
    const updatedSchema = {
      ...oldSchema,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // If schema name changed, we need to rename the data file
    if (updates.name && updates.name !== oldSchema.name) {
      const oldDataDb = await this.getSchemaDataDatabase(oldSchema.name);
      const data = oldDataDb.data;
      
      // Create new data file with new name
      const newDataDb = await this.getSchemaDataDatabase(updates.name);
      newDataDb.data = data;
      await newDataDb.write();
      
      // Clear old data from memory (S3 cleanup would need to be handled separately)
      this.schemaDataDbs.delete(oldSchema.name);
    }

    db.data.schemas[schemaIndex] = updatedSchema;
    await db.write();

    return updatedSchema;
  }

  async deleteSchema(schemaId: string): Promise<boolean> {
    const db = await this.getSchemasDatabase();
    const schemaIndex = db.data.schemas.findIndex(s => s.id === schemaId);
    
    if (schemaIndex === -1) {
      return false;
    }

    const schema = db.data.schemas[schemaIndex];
    
    // Remove schema from list
    db.data.schemas.splice(schemaIndex, 1);
    await db.write();
    
    // Clear data from memory (S3 cleanup would need to be handled separately)
    this.schemaDataDbs.delete(schema.name);

    return true;
  }

  async getSchemaData(schemaName: string): Promise<DataEntry[]> {
    const db = await this.getSchemaDataDatabase(schemaName);
    return db.data || [];
  }

  async saveSchemaData(schemaName: string, data: DataEntry[]): Promise<void> {
    const db = await this.getSchemaDataDatabase(schemaName);
    db.data = data;
    await db.write();
  }

  async addDataEntry(schemaName: string, entry: Omit<DataEntry, 'id'>): Promise<DataEntry> {
    const db = await this.getSchemaDataDatabase(schemaName);
    const newEntry: DataEntry = {
      id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...entry,
    };
    
    db.data.push(newEntry);
    await db.write();
    
    return newEntry;
  }

  async updateDataEntry(schemaName: string, entryId: string, updates: Partial<Omit<DataEntry, 'id'>>): Promise<DataEntry | null> {
    const db = await this.getSchemaDataDatabase(schemaName);
    const entryIndex = db.data.findIndex(e => e.id === entryId);
    
    if (entryIndex === -1) {
      return null;
    }

    const updatedEntry = {
      ...db.data[entryIndex],
      ...updates,
    };

    db.data[entryIndex] = updatedEntry;
    await db.write();

    return updatedEntry;
  }

  async deleteDataEntry(schemaName: string, entryId: string): Promise<boolean> {
    const db = await this.getSchemaDataDatabase(schemaName);
    const entryIndex = db.data.findIndex(e => e.id === entryId);
    
    if (entryIndex === -1) {
      return false;
    }

    db.data.splice(entryIndex, 1);
    await db.write();

    return true;
  }


}

// Singleton instance
const databaseManager = new DatabaseManager();

// Legacy compatibility functions
export async function getDatabase(): Promise<{ data: { schemas: SchemaDefinition[] } }> {
  const schemas = await databaseManager.getAllSchemas();
  return {
    data: {
      schemas
    }
  };
}

// Helper function to get data for a specific schema
export async function getSchemaData(schemaId: string): Promise<DataEntry[]> {
  const schema = await databaseManager.getSchema(schemaId);
  if (!schema) {
    return [];
  }
  return await databaseManager.getSchemaData(schema.name);
}

// Helper function to save data for a specific schema
export async function saveSchemaData(schemaId: string, data: DataEntry[]): Promise<void> {
  const schema = await databaseManager.getSchema(schemaId);
  if (!schema) {
    throw new Error('Schema not found');
  }
  await databaseManager.saveSchemaData(schema.name, data);
}

// Export the database manager for direct use in APIs
export { databaseManager };

export default getDatabase;