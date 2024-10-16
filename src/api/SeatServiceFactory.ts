import { SeatAnalysisStorageService } from '../api/SeatAnalysisStorageService';
import { FileSeatStorage } from '../api/FileSeatStorage';
import { AzureTableSeatStorage } from '../api/AzureTableSeatStorage';
//import { MySQLSeatStorage } from './MySQLSeatStorage';
import config from '../config';

export class SeatServiceFactory {
    static createSeatService(organizationName: string) {
        let seatStorage;
        switch (config.storageType) {
        case 'file':
            seatStorage = new FileSeatStorage(organizationName);
            break;
        case 'azure':
            seatStorage = new AzureTableSeatStorage(organizationName);
            break;
        default:
            throw new Error(`Unsupported storage type: ${config.storageType}`);
        }
        return new SeatAnalysisStorageService(seatStorage);
    }
}