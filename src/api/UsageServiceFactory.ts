import { CopilotUsageStorageService } from '../api/CopilotUsageStorageService';
//import { MySQLUsageStorage } from '../api/MySQLUsageStorage';
import { FileUsageStorage } from '../api/FileUsageStorage';
import { AzureTableUsageStorage } from '../api/AzureTableUsageStorage';
import config from '../config';

export class UsageServiceFactory {
  static createUsageService(organizationName: string) {
    let usageStorage;
    switch (config.storageType) {
      case 'file':
        usageStorage = new FileUsageStorage(organizationName);
        break;
      case 'azure':
        usageStorage = new AzureTableUsageStorage(organizationName);
        break;
      default:
        throw new Error(`Unsupported storage type: ${config.storageType}`);
    }
    return new CopilotUsageStorageService(usageStorage);
  }
}