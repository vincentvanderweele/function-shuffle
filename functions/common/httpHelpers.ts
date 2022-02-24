/**
 * This file contains a bunch of helpers to make returning HTTP payloads a bit
 * more compact.
 */

export interface SuccessResponse<HttpResponseBody> {
  httpResponse: {
    status: 200;
    body: HttpResponseBody;
  };
}

export interface ErrorResponse {
  httpResponse: {
    status: 400 | 404 | 500;
    body: { details?: string };
  };
}

export type HttpResponse<HttpSuccessBody, Bindings = {}> = (
  | SuccessResponse<HttpSuccessBody>
  | ErrorResponse
) &
  Bindings;

export function createSuccessResponse<HttpResponseBody, Bindings>(
  httpResponseBody: HttpResponseBody,
  bindings?: Bindings
): SuccessResponse<HttpResponseBody> & Bindings {
  return {
    httpResponse: {
      status: 200,
      body: httpResponseBody,
    },
    ...bindings,
  };
}

export function createErrorResponse(error: unknown): ErrorResponse {
  const status =
    error instanceof ValidationError
      ? 400
      : error instanceof NotFoundError
      ? 404
      : 500;
  const errorMessage = (error as { message: string })?.message;

  return {
    httpResponse: {
      status,
      body: { ...(errorMessage ? { details: errorMessage } : {}) },
    },
  };
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    setPrototype(this, ValidationError);
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    setPrototype(this, NotFoundError);
  }
}

function setPrototype<T>(instance: T, cls: Newable<T>) {
  // See https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
  Object.setPrototypeOf(instance, cls.prototype);
}

interface Newable<T> {
  new (...args: any[]): T;
}
