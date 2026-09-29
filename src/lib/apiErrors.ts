import { NextResponse } from 'next/server';

/** Throw from route/service code for input the client must fix (→ 400). */
export class ValidationError extends Error {}

// Postgres rejects bad client input with stable messages; services rethrow
// them as plain Errors, so they are recognised here by message.
const CLIENT_FAULTS: { pattern: RegExp; status: number; message: (m: RegExpMatchArray) => string }[] = [
  {
    pattern: /null value in column "([^"]+)"/,
    status: 400,
    message: (m) => `Missing required field: ${m[1]}`,
  },
  {
    pattern: /invalid input (syntax|value) for (type|enum) (\w+)/,
    status: 400,
    message: (m) => `Invalid ${m[3] === 'uuid' ? 'id' : `${m[3]} value`}`,
  },
  {
    pattern: /violates check constraint|out of range|value too long/,
    status: 400,
    message: () => 'Invalid value',
  },
  {
    pattern: /violates foreign key constraint/,
    status: 400,
    message: () => 'Referenced item does not exist',
  },
  {
    pattern: /duplicate key value violates unique constraint/,
    status: 409,
    message: () => 'That item already exists',
  },
];

/**
 * Maps an error thrown inside a route handler to a JSON response:
 * 401 for auth, 400/409 for bad client input, otherwise a logged 500.
 */
export function errorResponse(error: unknown, context: string) {
  const message = error instanceof Error ? error.message : String(error);

  if (message === 'Unauthorized') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (message === 'Forbidden') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: message }, { status: 400 });
  }
  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  for (const fault of CLIENT_FAULTS) {
    const match = message.match(fault.pattern);
    if (match) {
      return NextResponse.json({ error: fault.message(match) }, { status: fault.status });
    }
  }

  console.error(`${context} error:`, error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
