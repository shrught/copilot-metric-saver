// src/api/IUsageStorage.ts
import { Metrics } from '../model/Metrics';

export interface IUsageStorage {
    saveUsageData(metrics: Metrics[]): Promise<boolean>;
    readUsageData(): Promise<Metrics[]>;
    queryUsageData(since?: string, until?: string, page?: number, per_page?: number): Promise<Metrics[]>;
}