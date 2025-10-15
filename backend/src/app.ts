import express = require('express');
import agentRoutes from './routes/agentRoutes';

const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Use the agent routes
app.use('/agents', agentRoutes);

export default app;