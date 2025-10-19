import { ZodTypeAny } from "zod";
import { Request, Response, NextFunction } from "express";

/**
 * Generic middleware to validate request bodies using a Zod schema.
 * If validation fails, responds with 400 and Zod error details.
 */
export const validateBody =
  (schema: ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: result.error.issues,
      });
    }

    req.body = result.data; // safely typed body
    next();
    return;
  };

/**
 * Generic middleware to validate query parameters using a Zod schema.
 * If validation fails, responds with 400 and Zod error details.
 */
export const validateQuery =
  (schema: ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      return res.status(400).json({
        error: "Invalid query parameters",
        details: result.error.issues,
      });
    }

    // Store validated data for use in controller
    (req as any).validatedQuery = result.data;
    next();
    return;
  };
