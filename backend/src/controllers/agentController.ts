import { Request, Response } from "express";
import prisma from "../prisma/client";

export const getAgents = async (req: Request, res: Response) => {
    try {
        const agents = await prisma.agent.findMany();
        res.json(agents);
    } catch (error) {
        console.error("Error fetching agents:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const createAgent = async (req: Request, res: Response) => {
    try {
        const { name, version, description } = req.body;
        const newAgent = await prisma.agent.create({
            data: { name, version, description }, 
        });
        res.status(201).json(newAgent);
    } catch (error) {
        console.error("Error creating agent:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};