// src/CopilotUsageStorageService.ts
import { IUsageStorage } from './IUsageStorage';
import { Metrics } from '../model/Metrics';
import { getMetricsApi } from '../utils/GitHubApi';

export class CopilotUsageStorageService {
    private storage: IUsageStorage;

    constructor(storage: IUsageStorage) {
        this.storage = storage;
    }

    public async saveUsageData(org: string): Promise<boolean> {
        try {
            const metrics = await getMetricsApi(org);
            if (!Array.isArray(metrics)) {
                throw new Error('Result is not an array.');
            }
            return await this.storage.saveUsageData(metrics);
        } catch (error) {
            console.error('Error saving usage data:', error);
            return false;
        }
    }

    public async readUsageData(): Promise<Metrics[]> {
        try {
            return await this.storage.readUsageData();
        } catch (error) {
            console.error('Error reading usage data:', error);
            return [];
        }
    }

    public async queryUsageData(organization: string, since?: string, until?: string, page?: number, per_page?: number): Promise<Metrics[]> {
        try {
            return await this.storage.queryUsageData(organization, since, until, page, per_page);
        } catch (error) {
            console.error('Error querying usage data:', error);
            return [];
        }
    }

   


}