import { Request, Response, NextFunction } from "express";
import prisma from "../prisma/client";

export async function authenticateApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const apiKey = req.header("x-api-key");

  if (!apiKey) {
    res.status(401).json({ error: "Missing API key" });
    return; 
  }

  const user = await prisma.user.findUnique({
    where: { apiKeys: apiKey },
  });

  if (!user) {
    res.status(403).json({ error: "Invalid API key" });
    return;
  }

  (req as any).user = user;
  next();
  return; 
}
