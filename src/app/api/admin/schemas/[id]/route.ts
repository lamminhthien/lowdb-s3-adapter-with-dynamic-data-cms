import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { databaseManager } from '@/lib/database';
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

    const schema = await databaseManager.getSchema(params.id);
    
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

    // Check if new name conflicts with existing schemas (excluding current one)
    const allSchemas = await databaseManager.getAllSchemas();
    const conflictingSchema = allSchemas.find(s => s.name === body.name && s.id !== params.id);
    if (conflictingSchema) {
      return NextResponse.json(
        { error: 'Schema with this name already exists' },
        { status: 409 }
      );
    }

    try {
      const updatedSchema = await databaseManager.updateSchema(params.id, body);
      
      if (!updatedSchema) {
        return NextResponse.json({ error: 'Schema not found' }, { status: 404 });
      }

      return NextResponse.json({ schema: updatedSchema });
    } catch (error) {
      if (error instanceof Error && error.message === 'Schema with this name already exists') {
        return NextResponse.json(
          { error: 'Schema with this name already exists' },
          { status: 409 }
        );
      }
      throw error;
    }

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

    const success = await databaseManager.deleteSchema(params.id);
    
    if (!success) {
      return NextResponse.json({ error: 'Schema not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Schema deleted successfully' });

  } catch (error) {
    console.error('Delete schema error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}