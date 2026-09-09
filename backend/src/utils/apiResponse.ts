import { Request, Response } from "express";

export interface ApiRequest extends Request {
  requestId?: string;
  requestStartedAt?: number;
  apiKeyId?: number;
  apiKeyUserId?: number;
}

interface RateLimitMeta {
  remaining: number;
  limit: number;
  reset: string;
}

export const getResponseMeta = (
  req: ApiRequest,
  extra: Record<string, unknown> = {}
): Record<string, unknown> => {
  const responseTime = Date.now() - (req.requestStartedAt || Date.now());
  const rateLimit = req.res?.locals.rateLimit as RateLimitMeta | undefined;

  return {
    requestId: req.requestId,
    responseTime,
    ...(rateLimit ? { rateLimit } : {}),
    ...extra,
  };
};

export const sendSuccess = (
  req: ApiRequest,
  res: Response,
  data: unknown,
  count?: number
) => {
  return res.json({
    success: true,
    ...(count === undefined ? {} : { count }),
    data,
    meta: getResponseMeta(req),
  });
};

export const sendError = (
  req: ApiRequest,
  res: Response,
  statusCode: number,
  code: string,
  message: string
) => {
  return res.status(statusCode).json({
    success: false,
    error: code,
    message,
    meta: getResponseMeta(req),
  });
};
