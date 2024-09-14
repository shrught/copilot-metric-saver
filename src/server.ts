// src/api/server.ts
import express from 'express';
import { UsageServiceFactory } from './api/UsageServiceFactory';
import cors from 'cors';
  
const usageService=UsageServiceFactory.createUsageService();

const app = express();
const port = 3000;
app.use(express.json());
app.use(cors());

// redirect default to /metrics/service
app.get('/', (req, res) => {
    res.redirect('/metrics/service');
});

// call metrics service
app.get('/metrics/service', async (req, res) => {
    try {
        const { since, until, page = 1, per_page = 60 } = req.query;
        // call the saveUsageData method
        await(usageService.saveUsageData());
        const data = await usageService.queryUsageData(since as string, until as string, parseInt(page as string), parseInt(per_page as string));
        res.json(data);
    } catch (error) {
        res.status(500).send('Error fetching metrics from storage');
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});