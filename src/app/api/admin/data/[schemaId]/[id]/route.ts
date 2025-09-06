import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { databaseManager } from '@/lib/database';
import { validateDataEntry } from '@/lib/validation';

interface RouteParams {
  params: {
    schemaId: string;
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await AuthService.authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const schema = await databaseManager.getSchema(params.schemaId);
    
    if (!schema) {
      return NextResponse.json({ error: 'Schema not found' }, { status: 404 });
    }

    const data = await databaseManager.getSchemaData(schema.name);
    const entry = data.find(item => item.id === params.id);
    
    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    return NextResponse.json({ entry, schema });

  } catch (error) {
    console.error('Get data entry error:', error);
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
    
    const schema = await databaseManager.getSchema(params.schemaId);
    
    if (!schema) {
      return NextResponse.json({ error: 'Schema not found' }, { status: 404 });
    }

    // Validate data entry
    const errors = validateDataEntry(body, schema);
    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const entryData = {
      ...body,
      updatedAt: new Date().toISOString(),
    };

    const updatedEntry = await databaseManager.updateDataEntry(schema.name, params.id, entryData);
    
    if (!updatedEntry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    return NextResponse.json({ entry: updatedEntry });

  } catch (error) {
    console.error('Update data entry error:', error);
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

    const schema = await databaseManager.getSchema(params.schemaId);
    
    if (!schema) {
      return NextResponse.json({ error: 'Schema not found' }, { status: 404 });
    }

    const success = await databaseManager.deleteDataEntry(schema.name, params.id);
    
    if (!success) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Entry deleted successfully' });

  } catch (error) {
    console.error('Delete data entry error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}