import * as fs from 'fs';
import { Metrics } from './model/Metrics';
import { getMetricsApi } from './GitHubApi';
import path from 'path';

export class CopilotUsageStorageService {
    private orgOrEntName: string;
    private OrgOrEntFileName: string;
    private orgOrEntFilePath: string;

    constructor(orgOrEntName = 'copilotusage') {
        if (!orgOrEntName) {
            throw new Error('Organization or Enterprise name is required.');
        } else {
            this.orgOrEntName = orgOrEntName;
            this.OrgOrEntFileName = this.orgOrEntName + '_metrics.json';
            this.orgOrEntFilePath = path.join(__dirname, '../data', this.OrgOrEntFileName);
            // to check if the ../data folder exists, if not, create it
            if (!fs.existsSync(path.join(__dirname, '../data'))) {
                fs.mkdirSync(path.join(__dirname, '../data'));
            }
            // Create a file named by orgOrEntName_metrics.json within ../data folder if it does not exist
            if (!fs.existsSync(this.orgOrEntFilePath)) {
                fs.writeFileSync(this.orgOrEntFilePath, '[]');
            }
        }
    }

    private getCurrentTimeFormatted(): string {
        const now = new Date();
        return `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
    }

    private getRandomTwoDigits(): string {
        return Math.floor(Math.random() * 90 + 10).toString(); // Random number between 10 and 99
    }

    private generateTimerFileFullName(): string {
        return path.join(__dirname, '../data', `${this.orgOrEntName}_${this.getCurrentTimeFormatted()}_${this.getRandomTwoDigits()}_metrics.json`);
    }

    // This function is to save the fetched data to a file named by timer_filePath
    public async saveUsageData(): Promise<boolean> {
        try {
          const metrics = await getMetricsApi();
          //console.log('Fetched metrics:', metrics);
    
          if (!Array.isArray(metrics)) {
            throw new Error('Result is not an array.');
          }
    
          const dataToWrite = JSON.stringify(metrics, null, 2);
          //console.log('Data to write:', dataToWrite);
          
            const fileFullName = this.generateTimerFileFullName();
            // write the fetch data to file named by timer_filePath, which is a new file, and it is latest data.
            fs.writeFileSync(fileFullName, dataToWrite);
            // compare and update the content of the file named by getOrgOrEntFileName,which is the orgOrEntUsage file
            console.log('Metrics saved successfully to file:', fileFullName);
            await this.compareAndUpdateMetrics(metrics);
            return true;


        } catch (error) {
          console.error('Error saving metrics:', error);
            return false;
        }
      }

    // This function is to read the file named by fileName
    public readUsageData(): Metrics[] {
        if (fs.existsSync(this.orgOrEntFilePath)) {
            const data = fs.readFileSync(this.orgOrEntFilePath, 'utf8');
            return JSON.parse(data);
        }
        return [];
    }
private async compareAndUpdateMetrics(latestUsage?: Metrics[], orgOrEntUsage?: Metrics[]): Promise<void> {
    try {
        if (!latestUsage) { 
            console.log("No latest usage data provided. Will get it from API.");
            latestUsage = await getMetricsApi();
        }
        if (!orgOrEntUsage) {
            console.log("No existing data provided. Will get it from file.");
            orgOrEntUsage = this.readUsageData();
        }

        // Validate data
        if (!Array.isArray(latestUsage) || !Array.isArray(orgOrEntUsage)) {
            throw new Error("Invalid data format. Both latestUsage and orgOrEntUsage should be arrays.");
        }

        // Initialize lists to track days of updated and added metrics
        const updatedDays: string[] = [];
        const addedDays: string[] = [];

        if (latestUsage.length > 0) {
            latestUsage.forEach(latestMetric => {
                const existingMetricIndex = orgOrEntUsage!.findIndex(orgMetric => orgMetric.day === latestMetric.day);

                if (existingMetricIndex !== -1) {
                    // Update existing metric
                    orgOrEntUsage![existingMetricIndex] = latestMetric;
                    updatedDays.push(latestMetric.day);
                } else {
                    // Add new metric
                    orgOrEntUsage!.push(latestMetric);
                    addedDays.push(latestMetric.day);
                }
            });

            // Save to existing orgOrEntUsage file only when there are some changes
            if (updatedDays.length > 0 || addedDays.length > 0) {
                fs.writeFileSync(this.orgOrEntFilePath, JSON.stringify(orgOrEntUsage, null, 2));
                console.log(`Days updated: ${updatedDays.join(', ')}, Days added: ${addedDays.join(', ')}`);

                // Send notification
                this.sendNotification(updatedDays, addedDays);
            }
        } else {
            console.log("No latest usage data provided.");
        }
    } catch (error) {
        console.error("Error in compareAndUpdateMetrics:", error);
    }
}

// Example notification method
private sendNotification(updatedDays: string[], addedDays: string[]): void {
    // Implement your notification logic here
    console.log(`Notification sent for updated days: ${updatedDays.join(', ')}, added days: ${addedDays.join(', ')}`);
}
}