// src/api/SeatAnalysisStorageService.ts
import { ISeatStorage } from './ISeatStorage';
import { Seat } from '../model/Seat';
import { getSeatsApi } from '../utils/ExtractSeats';

export class SeatAnalysisStorageService {
    private storage: ISeatStorage;

    constructor(storage: ISeatStorage) {
        this.storage = storage;
    }

    public async saveSeatsData(org: string): Promise<boolean> {
        try {
            const seats = await getSeatsApi(org);
            if (!Array.isArray(seats)) {
                throw new Error('Result is not an array.');
            }
            return await this.storage.saveSeatsData(seats);
        } catch (error) {
            console.error('Error saving seats data:', error);
            return false;
        }
    }

    public async readSeatsData(): Promise<Seat[]> {
        try {
            return await this.storage.readSeatsData();
        } catch (error) {
            console.error('Error reading seats data:', error);
            return [];
        }
    }

    public async querySeatsData(organization: string, since?: string, until?: string, page?: number, per_page?: number): Promise<Seat[]> {
        try {
            return await this.storage.querySeatsData(organization, since, until, page, per_page);
        } catch (error) {
            console.error('Error querying seats data:', error);
            return [];
        }
    }

   
}