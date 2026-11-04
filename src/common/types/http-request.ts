import type { Request } from 'express';

export type HttpRequest = Request & { requestId?: string };
