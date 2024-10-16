import { TableClient, TableServiceClient, AzureNamedKeyCredential } from '@azure/data-tables';
import { DefaultAzureCredential } from '@azure/identity';
import { Metrics } from '../model/Metrics';
import { getMetricsApi } from '../utils/GitHubApi';
import { IUsageStorage } from './IUsageStorage';
import config from '../config';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const accountName = config.azureStorage.accountName;
const accountKey = config.azureStorage.accountKey;
const tableName = config.scope.type === 'organization' ? config.azureStorage.orgMetricsTableName : config.azureStorage.entMetricsTableName;
if (!accountName || !tableName) {
    throw new Error('AZURE_STORAGE_ACCOUNT_NAME and AZURE_TABLE_NAME must be defined in the environment variables');
}

if (!accountName || !accountKey) {
    throw new Error('AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_ACCOUNT_KEY must be defined in the environment variables');
}

const credential = new DefaultAzureCredential();
const tableServiceClient = new TableServiceClient(`https://${accountName}.table.core.windows.net`, credential);

export class AzureTableUsageStorage implements IUsageStorage {
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

    public async readUsageData(): Promise<Metrics[]> {
        try {
            const entities = this.tableClient.listEntities<Metrics>();

            const metrics: Metrics[] = [];
            for await (const entity of entities) {
                // Deserialize complex properties
                if (entity.breakdown) {
                    entity.breakdown = JSON.parse(entity.breakdown as unknown as string);
                }
                metrics.push(entity);
            }

            console.log('Metrics read successfully from Azure Table Storage.');
            return metrics;
        } catch (error) {
            console.error('Error reading usage data from Azure Table Storage:', error);
            return [];
        }
    }

    public async saveUsageData(): Promise<boolean> {
        try {
            const metrics = await getMetricsApi(this.organizationName);
            if (!Array.isArray(metrics)) {
                throw new Error('Result is not an array.');
            }

            for (const metric of metrics) {
                // Serialize complex properties to JSON strings
                const serializedMetric = {
                    ...metric,
                    breakdown: JSON.stringify(metric.breakdown)
                };

                const entity = {
                    partitionKey: this.organizationName,
                    rowKey: `${metric.day}_${this.organizationName}`,
                    ...serializedMetric
                };
                await this.tableClient.upsertEntity(entity);
            }

            console.log('Metrics saved successfully to Azure Table Storage.');
            await this.compareAndUpdateMetrics(metrics);
            return true;
        } catch (error) {
            console.error('Error saving metrics to Azure Table Storage:', error);
            return false;
        }
    }

    private async compareAndUpdateMetrics(latestUsage?: Metrics[], ScopeUsage?: Metrics[]): Promise<void> {
        try {
            if (!latestUsage) {
                latestUsage = await getMetricsApi(this.organizationName);
            }
            if (!ScopeUsage) {
                ScopeUsage = await this.readUsageData();
            }

            if (!Array.isArray(latestUsage) || !Array.isArray(ScopeUsage)) {
                throw new Error("Invalid data format. Both latestUsage and ScopeUsage should be arrays.");
            }

            const updatedDays: string[] = [];
            const addedDays: string[] = [];

            if (latestUsage.length > 0) {
                latestUsage.forEach(latestMetric => {
                    const existingMetricIndex = ScopeUsage!.findIndex(orgMetric => orgMetric.day === latestMetric.day);

                    if (existingMetricIndex !== -1) {
                        ScopeUsage![existingMetricIndex] = latestMetric;
                        updatedDays.push(latestMetric.day);
                    } else {
                        ScopeUsage!.push(latestMetric);
                        addedDays.push(latestMetric.day);
                    }
                });

                if (updatedDays.length > 0 || addedDays.length > 0) {
                    for (const metric of latestUsage) {
                        // Serialize complex properties to JSON strings
                        const serializedMetric = {
                            ...metric,
                            breakdown: JSON.stringify(metric.breakdown)
                        };

                        const entity = {
                            partitionKey: this.organizationName,
                            rowKey: `${metric.day}_${this.organizationName}`,
                            ...serializedMetric
                        };
                        await this.tableClient.upsertEntity(entity);
                    }

                    this.sendNotification(updatedDays, addedDays);
                }
            } else {
                console.log("No latest usage data provided.");
            }
        } catch (error) {
            console.error("Error in compareAndUpdateMetrics:", error);
        }
    }

    private sendNotification(updatedDays: string[], addedDays: string[]): void {
        console.log(`Notification sent for updated days: ${updatedDays.join(', ')}, added days: ${addedDays.join(', ')}`);
    }

    async queryUsageData(organization: string, since?: string, until?: string, page: number = 1, per_page: number = 28): Promise<Metrics[]> {
        try {
            const filterConditions = [`PartitionKey eq '${organization}'`];
            if (since) {
                filterConditions.push(`RowKey ge '${since}_${organization}'`);
            }
            if (until) {
                filterConditions.push(`RowKey le '${until}_${organization}'`);
            }
            const filter = filterConditions.join(' and ');

            const entities = this.tableClient.listEntities<Metrics>({
                queryOptions: {
                    filter: filter
                }
            });

            const metrics: Metrics[] = [];
            for await (const entity of entities) {
                // Deserialize complex properties
                if (entity.breakdown) {
                    entity.breakdown = JSON.parse(entity.breakdown as unknown as string);
                }
                metrics.push(entity);
            }

            const start = (page - 1) * per_page;
            const end = start + per_page;
            return metrics.slice(start, end);
        } catch (error) {
            console.error('Error querying usage data from Azure Table Storage:', error);
            return [];
        }
    }
}