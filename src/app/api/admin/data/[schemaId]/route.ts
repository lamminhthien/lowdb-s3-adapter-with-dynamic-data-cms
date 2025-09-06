import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { getDatabase, getSchemaData, saveSchemaData } from '@/lib/database';
import { validateDataEntry } from '@/lib/validation';

interface RouteParams {
  params: {
    schemaId: string;
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
    return NextResponse.json({ data, schema });

  } catch (error) {
    console.error('Get data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Create new entry
    const newEntry = {
      id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const currentData = await getSchemaData(params.schemaId);
    currentData.push(newEntry);
    await saveSchemaData(params.schemaId, currentData);

    return NextResponse.json({ entry: newEntry }, { status: 201 });

  } catch (error) {
    console.error('Create data entry error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}