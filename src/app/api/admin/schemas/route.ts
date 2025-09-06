import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { databaseManager } from '@/lib/database';
import { schemaDefinitionSchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const schemas = await databaseManager.getAllSchemas();
    return NextResponse.json({ schemas });

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

    try {
      const newSchema = await databaseManager.createSchema(body);
      return NextResponse.json({ schema: newSchema }, { status: 201 });
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
    console.error('Create schema error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}