import { describe, expect, it, vi } from 'vitest';
import { errorResponse, ValidationError } from './apiErrors';

async function run(error: unknown) {
  const res = errorResponse(error, 'TEST');
  return { status: res.status, body: await res.json() };
}

describe('errorResponse', () => {
  it('maps Unauthorized to 401', async () => {
    expect(await run(new Error('Unauthorized'))).toEqual({ status: 401, body: { error: 'Unauthorized' } });
  });

  it('maps validation errors and malformed JSON to 400', async () => {
    expect(await run(new ValidationError('Title is required'))).toEqual({
      status: 400,
      body: { error: 'Title is required' },
    });
    expect((await run(new SyntaxError('Unexpected token'))).status).toBe(400);
  });

  it('names the missing column for not-null violations', async () => {
    const err = new Error('null value in column "title" of relation "savings_goals" violates not-null constraint');
    expect(await run(err)).toEqual({ status: 400, body: { error: 'Missing required field: title' } });
  });

  it('reports malformed ids as 400 without leaking SQL', async () => {
    const err = new Error('invalid input syntax for type uuid: "abc"');
    expect(await run(err)).toEqual({ status: 400, body: { error: 'Invalid id' } });
  });

  it('maps unique violations to 409', async () => {
    const err = new Error('duplicate key value violates unique constraint "users_username_key"');
    expect((await run(err)).status).toBe(409);
  });

  it('hides unexpected errors behind a logged 500', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await run(new Error('connection refused'))).toEqual({
      status: 500,
      body: { error: 'Internal server error' },
    });
    expect(log).toHaveBeenCalledOnce();
    log.mockRestore();
  });
});
