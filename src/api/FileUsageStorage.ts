import * as fs from 'fs';
import path from 'path';
import { Metrics } from '../model/Metrics';
import { getMetricsApi } from '../utils/GitHubApi';
import { IUsageStorage } from './IUsageStorage';
import config from '../config';

export class FileUsageStorage implements IUsageStorage {
    private dirName: string = '../../data';

    constructor(private scopeName: string) {
        try {
            if (!fs.existsSync(path.join(__dirname, this.dirName))) {
                fs.mkdirSync(path.join(__dirname, this.dirName));
            }
            const scopeFilePath = this.getScopeFilePath();
            if (!fs.existsSync(scopeFilePath)) {
                fs.writeFileSync(scopeFilePath, '[]');
            }
        } catch (error) {
            console.error('Error in FileUsageStorage constructor:', error);
        }
    }

    private getScopeFilePath(): string {
        const scopeFileName = `${config.scope.type}_${this.scopeName}_metrics.json`;
        return path.join(__dirname, this.dirName, scopeFileName);
    }

    private getCurrentTimeFormatted(): string {
        const now = new Date();
        return `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
    }

    private getRandomTwoDigits(): string {
        return Math.floor(Math.random() * 90 + 10).toString(); // Random number between 10 and 99
    }

    private generateTimerFileFullName(): string {
        const timestamp = this.getCurrentTimeFormatted();
        const randomDigits = this.getRandomTwoDigits();
        const fileName = `${config.scope.type}_${this.scopeName}_${timestamp}_${randomDigits}_metrics.json`;
        return path.join(__dirname, this.dirName, fileName);
    }

    public async readUsageData(): Promise<Metrics[]> {
        try {
            const data = fs.readFileSync(this.getScopeFilePath(), 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading usage data from file:', error);
            return [];
        }
    }

    public async saveUsageData(): Promise<boolean> {
        try {
            const metrics = await getMetricsApi(this.scopeName);
            if (!Array.isArray(metrics)) {
                throw new Error('Result is not an array.');
            }

            const dataToWrite = JSON.stringify(metrics.map(metric => ({
                ...metric,
                scopeName: this.scopeName
            })), null, 2);

            const fileFullName = this.generateTimerFileFullName();
            fs.writeFileSync(fileFullName, dataToWrite);
            console.log('Metrics saved successfully to file:', fileFullName);
            await this.compareAndUpdateMetrics(metrics);
            return true;
        } catch (error) {
            console.error('Error saving metrics:', error);
            return false;
        }
    }

    private async compareAndUpdateMetrics(latestUsage?: Metrics[], ScopeUsage?: Metrics[]): Promise<void> {
        try {
            if (!latestUsage) {
                latestUsage = await getMetricsApi(this.scopeName);
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
                    const updatedData = ScopeUsage.map(metric => ({
                        ...metric,
                        scopeName: this.scopeName
                    }));
                    fs.writeFileSync(this.getScopeFilePath(), JSON.stringify(updatedData, null, 2));
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

    async queryUsageData(scopeName: string, since?: string, until?: string, page: number = 1, per_page: number = 28): Promise<Metrics[]> {
        try {
            const data = fs.readFileSync(this.getScopeFilePath(), 'utf-8');
            let metrics: Metrics[] = JSON.parse(data);

            if (since) {
                metrics = metrics.filter(metric => new Date(metric.day) >= new Date(since));
            }

            if (until) {
                metrics = metrics.filter(metric => new Date(metric.day) <= new Date(until));
            }

            const start = (page - 1) * per_page;
            const end = start + per_page;
            return metrics.slice(start, end);
        } catch (error) {
            console.error('Error querying usage data from file:', error);
            return [];
        }
    }
}