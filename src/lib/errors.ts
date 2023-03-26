export class D1ExecuteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "D1ExecuteError";
  }
}

export class NotImplementedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotImplementedError";
  }
}

export class ErrorWithCause extends Error {
  cause?: Error;

  constructor(message: string) {
    super(message);
    this.name = "ErrorWithCause";
  }
}

export function isErrorWithCause(e: unknown): e is ErrorWithCause {
  return (
    e instanceof Error && (e as ErrorWithCause).cause?.message !== undefined
  );
}
