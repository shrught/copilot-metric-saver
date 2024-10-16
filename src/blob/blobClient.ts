import { TableClient } from '@azure/data-tables';
import { DefaultAzureCredential } from '@azure/identity';
import * as fs from 'fs';
import * as path from 'path';
import config from '../config';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const accountName = config.azureStorage.accountName;
const tableName = config.azureStorage.seatTableName;

if (!accountName || !tableName) {
    throw new Error('AZURE_STORAGE_ACCOUNT_NAME, AZURE_TABLE_NAME, and ORGANIZATION_NAME must be defined in the environment variables');
}

const credential = new DefaultAzureCredential();
const tableClient = new TableClient(`https://${accountName}.table.core.windows.net`, tableName, credential);

export async function uploadFileToTable(filePath: string) {
    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        for (const entry of data) {
            const day = entry.day;
            const organization = entry.organization;
            for (const seat of entry.seats) {
                const entity = {
                    partitionKey: `${organization}`,
                    rowKey: `${day}_${seat.login}`,
                    ...seat
                };
                await tableClient.upsertEntity(entity);
            }
        }

        console.log('Data uploaded to Azure Table Storage successfully.');
    } catch (error) {
        console.error('Error uploading data to Azure Table Storage:', error);
    }
}

const filePath = path.join(__dirname, '../../data/organization_EMU-test-org-2_seats.json');
uploadFileToTable(filePath);