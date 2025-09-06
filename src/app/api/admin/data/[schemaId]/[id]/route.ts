import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { getDatabase, getSchemaData, saveSchemaData } from '@/lib/database';
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

    const db = await getDatabase();
    const schema = db.data.schemas.find(s => s.id === params.schemaId);
    
    if (!schema) {
      return NextResponse.json({ error: 'Schema not found' }, { status: 404 });
    }

    const data = await getSchemaData(params.schemaId);
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
    
    const db = await getDatabase();
    const schema = db.data.schemas.find(s => s.id === params.schemaId);
    
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

    const currentData = await getSchemaData(params.schemaId);
    const entryIndex = currentData.findIndex(item => item.id === params.id);
    
    if (entryIndex === -1) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // Update entry
    currentData[entryIndex] = {
      ...currentData[entryIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    await saveSchemaData(params.schemaId, currentData);

    return NextResponse.json({ entry: currentData[entryIndex] });

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

    const db = await getDatabase();
    const schema = db.data.schemas.find(s => s.id === params.schemaId);
    
    if (!schema) {
      return NextResponse.json({ error: 'Schema not found' }, { status: 404 });
    }

    const currentData = await getSchemaData(params.schemaId);
    const entryIndex = currentData.findIndex(item => item.id === params.id);
    
    if (entryIndex === -1) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // Remove entry
    currentData.splice(entryIndex, 1);
    await saveSchemaData(params.schemaId, currentData);

    return NextResponse.json({ message: 'Entry deleted successfully' });

  } catch (error) {
    console.error('Delete data entry error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}