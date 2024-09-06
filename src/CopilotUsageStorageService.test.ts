import { CopilotUsageStorageService } from './CopilotUsageStorageService';
import { Metrics } from './model/Metrics';

const testCopilotUsageStorageService = async () => {
  let orgorEnt=process.env.VUE_APP_GITHUB_ORG;
  const service = new CopilotUsageStorageService(orgorEnt);
  try {
    const result = await service.saveUsageData();
    console.log('Returned data:', result);
  } catch (error) {
    console.error('Error during test:', error);
  }
};

testCopilotUsageStorageService();