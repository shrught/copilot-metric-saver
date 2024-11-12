import { TableClient, TableServiceClient } from '@azure/data-tables';
import { DefaultAzureCredential } from '@azure/identity';
import { getSeatsApi } from '../utils/ExtractSeats';
import { Seat } from '../model/Seat';
import config from '../config';
import { ISeatStorage } from './ISeatStorage';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const accountName = config.azureStorage.accountName;
const accountKey = config.azureStorage.accountKey;
const tableName = config.azureStorage.seatTableName;

if (!accountName || !tableName) {
    throw new Error('AZURE_STORAGE_ACCOUNT_NAME and AZURE_TABLE_NAME must be defined in the environment variables');
}

if (!accountName || !accountKey) {
    throw new Error('AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_ACCOUNT_KEY must be defined in the environment variables');
}

const credential = new DefaultAzureCredential();
const tableServiceClient = new TableServiceClient(`https://${accountName}.table.core.windows.net`, credential);

export class AzureTableSeatStorage implements ISeatStorage {
    private tableClient: TableClient;

    constructor(private organizationName: string) {
        this.tableClient = new TableClient(`https://${accountName}.table.core.windows.net`, tableName, credential);
        this.createTableIfNotExists(tableName);
    }

    private async createTableIfNotExists(tableName: string) {
        try {
            await tableServiceClient.createTable(tableName);
            console.log(`Table ${tableName} created successfully.`);
        } catch (error) {
            if (error instanceof Error && 'statusCode' in error && (error as any).statusCode === 409) {
                console.log(`Table ${tableName} already exists.`);
            } else {
                throw error;
            }
        }
    }

    public async readSeatsData(): Promise<Seat[]> {
        try {
            const entities = this.tableClient.listEntities<Seat>();

            const seats: Seat[] = [];
            for await (const entity of entities) {
                seats.push(entity);
            }

            return seats;
        } catch (error) {
            console.error('Error reading seats data from Azure Table Storage:', error);
            return [];
        }
    }

    public async saveSeatsData(seats: Seat[]): Promise<boolean> {
        try {

            for (const seat of seats) {
                const entity = {
                    partitionKey: this.organizationName,
                    rowKey: seat.day,
                    organization: this.organizationName, // Custom property
                    ...seat
                };
                await this.tableClient.upsertEntity(entity);
            }

            console.log(`Seats saved successfully to Azure Table Storage for organization: ${this.organizationName}.`);
            await this.compareAndUpdateSeats(seats);
            return true;
        } catch (error) {
            console.error('Error saving seats to Azure Table Storage:', error);
            return false;
        }
    }

    private async compareAndUpdateSeats(latestSeats?: Seat[], ScopeSeats?: Seat[]): Promise<void> {
        try {
            if (!latestSeats) {
                latestSeats = await getSeatsApi(this.organizationName);
            }
            if (!ScopeSeats) {
                ScopeSeats = await this.readSeatsData();
            }

            if (!Array.isArray(latestSeats) || !Array.isArray(ScopeSeats)) {
                throw new Error("Invalid data format. Both latestSeats and ScopeSeats should be arrays.");
            }

            const updatedDays: string[] = [];
            const addedDays: string[] = [];
            const currentDate = new Date().toISOString().split('T')[0];

            if (latestSeats.length > 0) {
                latestSeats.forEach(latestSeat => {
                    const existingSeatIndex = ScopeSeats!.findIndex(orgSeat => orgSeat.id === latestSeat.id);

                    if (existingSeatIndex !== -1) {
                        const existingSeat = ScopeSeats![existingSeatIndex];
                        const existingDate = existingSeat.day;

                        if (existingDate === currentDate) {
                            if (existingSeat.last_activity_at !== latestSeat.last_activity_at) {
                                existingSeat.last_activity_at = latestSeat.last_activity_at;
                                updatedDays.push(currentDate);
                            }
                        } else {
                            const newSeat = { ...latestSeat, date: currentDate };
                            ScopeSeats!.push(newSeat);
                            addedDays.push(currentDate);
                        }
                    } else {
                        const newSeat = { ...latestSeat, date: currentDate };
                        ScopeSeats!.push(newSeat);
                        addedDays.push(currentDate);
                    }
                });

                if (updatedDays.length > 0 || addedDays.length > 0) {
                    for (const seat of latestSeats) {
                        const entity = {
                            partitionKey: this.organizationName,
                            rowKey: seat.day,
                            organization: this.organizationName, // Custom property
                            ...seat
                        };
                        await this.tableClient.upsertEntity(entity);
                    }

                    this.sendNotification(updatedDays, addedDays);
                }
            } else {
                console.log("No latest seats data provided.");
            }
        } catch (error) {
            console.error("Error in compareAndUpdateSeats:", error);
        }
    }

    private sendNotification(updatedDays: string[], addedDays: string[]): void {
        console.log(`Notification sent for updated days: ${updatedDays.join(', ')}, added days: ${addedDays.join(', ')}`);
    }

    async querySeatsData(day: string, since?: string, until?: string, page: number = 1, per_page: number = 28): Promise<Seat[]> {
        try {
            const filterConditions = [`PartitionKey eq '${this.organizationName}'`];
            if (since) {
                filterConditions.push(`RowKey ge '${since}'`);
            }
            if (until) {
                filterConditions.push(`RowKey le '${until}'`);
            }
            const filter = filterConditions.join(' and ');

            const entities = this.tableClient.listEntities<Seat>({
                queryOptions: {
                    filter: filter
                }
            });

            const seats: Seat[] = [];
            for await (const entity of entities) {
                seats.push(entity);
            }

            const start = (page - 1) * per_page;
            const end = start + per_page;
            return seats.slice(start, end);
        } catch (error) {
            console.error('Error querying seats data from Azure Table Storage:', error);
            return [];
        }
    }
}