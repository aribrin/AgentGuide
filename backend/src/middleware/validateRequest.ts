import { ZodObject } from "zod";
import { Request, Response, NextFunction } from "express";

/**
 * Generic middleware to validate request bodies using a Zod schema.
 * If validation fails, responds with 400 and Zod error details.
 */
export const validateBody =
  (schema: ZodObject<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body); // replace with parsed data (safe)
      return next();
    } catch (err) {
      if (err instanceof Error && "issues" in (err as any)) {
        return res
          .status(400)
          .json({ error: "Invalid input", details: (err as any).issues });
      }
      console.error("Unexpected validation error:", err);
      return res.status(500).json({ error: "Validation failed" });
    }
  };
