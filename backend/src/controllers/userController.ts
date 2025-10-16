import { Request, Response } from "express";
import { UserService } from "../services/userService";

export const UserController = {
  async create(req: Request, res: Response) {
    try {
      const { email, name } = req.body;
      const user = await UserService.createUser({ email, name });
      res.status(201).json(user);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create user" });
    }
  },
};
