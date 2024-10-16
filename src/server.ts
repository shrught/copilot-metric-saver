// src/api/server.ts
import express from 'express';
import { UsageServiceFactory } from './api/UsageServiceFactory';
import { SeatServiceFactory } from './api/SeatServiceFactory';
//import { getContainer } from './cosmosDB/cosmosClient';
import cors from 'cors';
  
// const usageService=UsageServiceFactory.createUsageService();
// const seatService=SeatServiceFactory.createSeatService();

const app = express();
const port = 3000;
app.use(express.json());
app.use(cors());

// redirect default to /metrics/service
app.get('/', (req, res) => {
    res.redirect('/');
});

// call metrics service for a specific organization
app.get('/:organizationName/metrics/service', async (req, res) => {
    try {
        const { organizationName } = req.params;
        const { since, until, page = 1, per_page = 60 } = req.query;
        const usageService = UsageServiceFactory.createUsageService(organizationName);
        // call the saveUsageData method
        await usageService.saveUsageData(organizationName);
        const data = await usageService.queryUsageData(organizationName, since as string, until as string, parseInt(page as string), parseInt(per_page as string));
        res.json(data);
    } catch (error) {
        res.status(500).send('Error fetching metrics from storage');
    }
});
// call metrics service for a specific enterprise
app.get('/:enterpriseName/metrics/service', async (req, res) => {
    try {
        const { enterpriseName } = req.params;
        const { since, until, page = 1, per_page = 60 } = req.query;
        const usageService = UsageServiceFactory.createUsageService(enterpriseName);
        // call the saveUsageData method
        await usageService.saveUsageData(enterpriseName);
        const data = await usageService.queryUsageData(enterpriseName, since as string, until as string, parseInt(page as string), parseInt(per_page as string));
        res.json(data);
    } catch (error) {
        res.status(500).send('Error fetching metrics from storage');
    }
});

// call seats service for a specific organization
app.get('/:organizationName/seats/service', async (req, res) => {
    try {
        const { organizationName } = req.params;
        const { since, until, page = 1, per_page = 60 } = req.query;
        const seatService = SeatServiceFactory.createSeatService(organizationName);
        // call the saveSeatsData method
        await seatService.saveSeatsData(organizationName);
        const data = await seatService.querySeatsData(organizationName, since as string, until as string, parseInt(page as string), parseInt(per_page as string));
        res.json(data);
    } catch (error) {
        res.status(500).send('Error fetching seats from storage');
    }
});

// reminder for users trying to call seats service for enterprise scope
app.get('/:enterpriseName/seats/service', (req, res) => {
    res.status(400).send('Seats service is not available for enterprise scope.');
});


app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});