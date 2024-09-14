import { CopilotUsageStorageService } from './CopilotUsageStorageService';
import { FileUsageStorage } from './FileUsageStorage';
import { Metrics } from '../model/Metrics';
import { MySQLUsageStorage } from './MySQLUsageStorage';

const testCopilotUsageStorageService = async () => {
  let orgOrEnt=process.env.VUE_APP_GITHUB_ORG;

  let usageStorage=new FileUsageStorage()
  //let usageStorage=new MySQLUsageStorage()

  //create a new instance of the service
  const service = new CopilotUsageStorageService(usageStorage);

  //查询数据


  try {
    const result = await service.saveUsageData();
    //const result = await service.queryUsageData('2024-08-28', '2024-08-31', 1, 10);
    console.log('Returned data:', result);
  } catch (error) {
    console.error('Error during test:', error);
  }
};

testCopilotUsageStorageService();