import type { BackendName } from "../types.js";

export interface BackendErrorOptions {
  backend: BackendName;
  code: string;
  transient: boolean;
  details?: string;
}

export class BackendInvocationError extends Error {
  readonly backend: BackendName;
  readonly code: string;
  readonly transient: boolean;
  readonly details?: string;

  constructor(message: string, options: BackendErrorOptions) {
    super(message);
    this.name = "BackendInvocationError";
    this.backend = options.backend;
    this.code = options.code;
    this.transient = options.transient;
    this.details = options.details;
  }
}
