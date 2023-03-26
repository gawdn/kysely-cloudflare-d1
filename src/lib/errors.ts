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
