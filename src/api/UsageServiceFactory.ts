import { CopilotUsageStorageService } from '../api/CopilotUsageStorageService';
import { MySQLUsageStorage } from '../api/MySQLUsageStorage';
import { FileUsageStorage } from '../api/FileUsageStorage';
import config from '../config';

export class UsageServiceFactory {
  static createUsageService() {
    let usageStorage;
    switch (config.storageType) {
      case 'mysql':
        usageStorage = new MySQLUsageStorage();
        break;
      case 'file':
      default:
        usageStorage = new FileUsageStorage();
        break;
    }
    return new CopilotUsageStorageService(usageStorage);
  }
}