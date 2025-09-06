import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { getDatabase } from '@/lib/database';
import { schemaDefinitionSchema } from '@/lib/validation';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await AuthService.authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    const schema = db.data.schemas.find(s => s.id === params.id);
    
    if (!schema) {
      return NextResponse.json({ error: 'Schema not found' }, { status: 404 });
    }

    return NextResponse.json({ schema });

  } catch (error) {
    console.error('Get schema error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
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
    const schemaIndex = db.data.schemas.findIndex(s => s.id === params.id);
    
    if (schemaIndex === -1) {
      return NextResponse.json({ error: 'Schema not found' }, { status: 404 });
    }

    // Check if new name conflicts with existing schemas (excluding current one)
    const conflictingSchema = db.data.schemas.find(s => s.name === body.name && s.id !== params.id);
    if (conflictingSchema) {
      return NextResponse.json(
        { error: 'Schema with this name already exists' },
        { status: 409 }
      );
    }

    // Update schema
    db.data.schemas[schemaIndex] = {
      ...db.data.schemas[schemaIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    await db.write();

    return NextResponse.json({ schema: db.data.schemas[schemaIndex] });

  } catch (error) {
    console.error('Update schema error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await AuthService.authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    const schemaIndex = db.data.schemas.findIndex(s => s.id === params.id);
    
    if (schemaIndex === -1) {
      return NextResponse.json({ error: 'Schema not found' }, { status: 404 });
    }

    // Remove schema and its data
    db.data.schemas.splice(schemaIndex, 1);
    delete db.data.data[params.id];

    await db.write();

    return NextResponse.json({ message: 'Schema deleted successfully' });

  } catch (error) {
    console.error('Delete schema error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}