import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { getDatabase } from '@/lib/database';
import { schemaDefinitionSchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    return NextResponse.json({ schemas: db.data.schemas });

  } catch (error) {
    console.error('Get schemas error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await AuthService.authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate the schema
    const validation = schemaDefinitionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid schema', details: validation.error.issues },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    
    // Check if schema name already exists
    const existingSchema = db.data.schemas.find(s => s.name === body.name);
    if (existingSchema) {
      return NextResponse.json(
        { error: 'Schema with this name already exists' },
        { status: 409 }
      );
    }

    // Create new schema
    const newSchema = {
      id: `schema_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.data.schemas.push(newSchema);
    
    // Initialize empty data array for this schema
    db.data.data[newSchema.id] = [];
    
    await db.write();

    return NextResponse.json({ schema: newSchema }, { status: 201 });

  } catch (error) {
    console.error('Create schema error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}