// src/api/server.ts
import express from 'express';
import cron from 'node-cron';
import { UsageServiceFactory } from './api/UsageServiceFactory';
import { SeatServiceFactory } from './api/SeatServiceFactory';
import config from './config';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import path from 'path';

const app = express();
const port = process.env.PORT || 8080;
app.use(express.json());
app.use(cors());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// redirect default 
app.get('/', (req, res) => {
    res.redirect('/');
});

// call metrics service for a specific organization
if(config.scope.type === 'organization'){

    app.get('/:organizationName/metrics/service', async (req, res) => {
        try {
            const { organizationName } = req.params;
            const { since, until, page = 1, per_page = 60 } = req.query;
            const usageService = UsageServiceFactory.createUsageService(organizationName);
            // call the saveUsageData method
            await usageService.saveUsageData(organizationName);
            const data = await usageService.queryUsageData(
                organizationName, 
                since as string, 
                until as string, 
                parseInt(page as string), 
                parseInt(per_page as string)
            );
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
            const data = await seatService.querySeatsData(
                organizationName, 
                since as string, 
                until as string, 
                parseInt(page as string), 
                parseInt(per_page as string)
            );
            res.json(data);
        } catch (error) {
            res.status(500).send('Error fetching seats from storage');
        }
    });

};

// call metrics service for a specific enterprise
app.get('/:enterpriseName/metrics/service', async (req, res) => {
    try {
        const { enterpriseName } = req.params;
        const { since, until, page = 1, per_page = 60 } = req.query;
        const usageService = UsageServiceFactory.createUsageService(enterpriseName);
        // call the saveUsageData method
        await usageService.saveUsageData(enterpriseName);
        const data = await usageService.queryUsageData(
            enterpriseName, 
            since as string, 
            until as string, 
            parseInt(page as string), 
            parseInt(per_page as string)
        );
        res.json(data);
    } catch (error) {
        res.status(500).send('Error fetching metrics from storage');
    }
});
// reminder for users trying to call seats service for enterprise scope
app.get('/:enterpriseName/seats/service', (req, res) => {
    res.status(400).send('Seats service is not available for enterprise scope.');
});

// Add this function after the route definitions
async function callAllApis() {
    try {
        // Generate timestamp in Asia/Taipei timezone
        const timeStamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' });
        console.log(`Starting scheduled API calls at ${timeStamp}`);

        if (config.scope.type === 'organization') {
            // Call APIs for each organization
            for (const orgName of config.scope.names) {
                try {
                    // Call metrics API
                    const usageService = UsageServiceFactory.createUsageService(orgName);
                    await usageService.saveUsageData(orgName);
                    console.log(`Metrics data saved for ${orgName}`);

                    // Call seats API
                    const seatService = SeatServiceFactory.createSeatService(orgName);
                    await seatService.saveSeatsData(orgName);
                    console.log(`Seats data saved for ${orgName}`);
                } catch (error) {
                    console.error(`Error processing data for org ${orgName}:`, error);
                }
            }
        } else if (config.scope.type === 'enterprise') {
            // Call metrics API for enterprise
            try {
                const usageService = UsageServiceFactory.createUsageService(config.scope.names[0]);
                await usageService.saveUsageData(config.scope.names[0]);
                console.log(`Enterprise metrics saved for ${config.scope.names[0]}`);
            } catch (error) {
                console.error(`Error processing enterprise metrics:`, error);
            }
        }

        // Generate completion timestamp in Asia/Taipei timezone
        const completionTimeStamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' });
        console.log(`Completed scheduled API calls at ${completionTimeStamp}`);
    } catch (error) {
        console.error('Error in scheduled API calls:', error);
    }
}

//set up scheduler with cron job
function setupScheduler() {
    // Run immediately when server starts
    callAllApis();

    // Schedule to run twice a day: at midnight (00:00) and noon (12:00) Asia/Taipei time
    cron.schedule('0 0,12 * * *', () => {
        callAllApis();
    }, {
        timezone: 'Asia/Taipei'
    });
    console.log('API scheduler initialized - will run at 00:00 and 12:00 Asia/Taipei time');
}

app.listen(port, () => {
    // Generate current time in Asia/Taipei timezone
    const currentTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' });
    console.log(`Server is running at http://localhost:${port} - Current time: ${currentTime}`);
    setupScheduler(); //Initialize the scheduler when the server starts
});