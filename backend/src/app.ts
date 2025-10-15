import express from 'express';
import agentRoutes from './routes/agentRoutes';
import runRoutes from "./routes/runRoutes";


const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Use the agent routes
app.use('/v1/agents', agentRoutes);
app.use("/v1", runRoutes);


export default app;