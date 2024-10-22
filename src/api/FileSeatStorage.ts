import * as fs from 'fs';
import path from 'path';
import { getSeatsApi } from '../utils/ExtractSeats';
import { Seat } from '../model/Seat';
import config from '../config';
import { ISeatStorage } from './ISeatStorage';
import { uploadFileToTable } from '../blob/blobClient';
import { send } from 'process';

export class FileSeatStorage implements ISeatStorage {
    private dirName: string = '../../data';

    constructor(private organizationName: string) {
        try {
            const dirPath = path.join(__dirname, this.dirName);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath);
            }
            const scopeFilePath = this.getScopeFilePath();
            if (!fs.existsSync(scopeFilePath)) {
                fs.writeFileSync(scopeFilePath, '[]');
            }
        } catch (error) {
            console.error('Error in SeatUsageStorage constructor:', error);
        }
    }

    private getScopeFilePath(): string {
        const scopeFileName = `${config.scope.type}_${this.organizationName}_seats.json`;
        return path.join(__dirname, this.dirName, scopeFileName);
    }

    private getCurrentTimeFormatted(): string {
        const now = new Date();
        return `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
    }

    private getRandomTwoDigits(): string {
        return Math.floor(Math.random() * 90 + 10).toString(); // Random number between 10 and 99
    }

    private generateTimerFileFullName(): string {
        const timestamp = this.getCurrentTimeFormatted();
        const randomDigits = this.getRandomTwoDigits();
        const fileName = `${config.scope.type}_${this.organizationName}_${timestamp}_${randomDigits}_seats.json`;
        return path.join(__dirname, this.dirName, fileName);
    }

    public async readSeatsData(): Promise<Seat[]> {
        try {
            const filePath = this.getScopeFilePath();
            if (!fs.existsSync(filePath)) {
                return [];
            }

            const data = fs.readFileSync(filePath, 'utf-8');
            let parsedData: any[] = [];
            try {
                parsedData = JSON.parse(data);
            } catch (error) {
                console.error('Error parsing data:', error);
                return [];
            }
            if (!Array.isArray(parsedData)) {
                console.error('Invalid data format. Expected an array of objects.');
                console.log('Parsed data:', parsedData);
                return [];
            }

            const seats = parsedData.flatMap((entry: any) => entry.seats);
            if (!Array.isArray(seats)) {
                console.error('Invalid data format. Expected an array of seats.');
                console.log('Parsed seats:', seats);
                return [];
            }

            return seats;
        } catch (error) {
            console.error('Error reading seats data from file:', error);
            return [];
        }
    }

    public async saveSeatsData(seats: Seat[]): Promise<boolean> {
        try {
            const date = new Date().toISOString().split('T')[0];
            const filePath = this.getScopeFilePath();
            let data: any[] = [];

            if (fs.existsSync(filePath)) {
                const existingData = fs.readFileSync(filePath, 'utf-8');
                try {
                    data = JSON.parse(existingData);
                } catch (error) {
                    console.error('Error parsing existing data:', error);
                    data = [];
                }
            }

            if (!Array.isArray(data)) {
                data = [];
            }

            const dayEntry = data.find((entry: any) => entry.day === date);
            if (dayEntry) {
                dayEntry.seats.push(...seats);
            } else {
                data.push({ day: date, organization: this.organizationName,seats });
            }
            const dataToWrite = JSON.stringify(data, null, 2);
            const fileFullName = this.generateTimerFileFullName();

            fs.writeFileSync(fileFullName, dataToWrite);
            //fs.writeFileSync(filePath, dataToWrite);
            console.log('Seats saved successfully to file:', fileFullName);
            await this.compareAndUpdateSeats(seats);
            return true;
        } catch (error) {
            console.error('Error saving seats:', error);
            return false;
        }
    }

    private async compareAndUpdateSeats(latestSeats?: Seat[], ScopeSeats?: Seat[]): Promise<void> {
        try {
            if (!latestSeats) {
                latestSeats = await getSeatsApi(this.organizationName);
            }
            if (!ScopeSeats) {
                ScopeSeats = await this.readSeatsData();
            }

            if (!Array.isArray(latestSeats) || !Array.isArray(ScopeSeats)) {
                throw new Error("Invalid data format. Both latestSeats and ScopeSeats should be arrays.");
            }

            const updatedDays: string[] = [];
            const addedDays: string[] = [];
            const currentDate = new Date().toISOString().split('T')[0];

            if (latestSeats.length > 0) {
                latestSeats.forEach(latestSeat => {
                    const existingSeatIndex = ScopeSeats!.findIndex(orgSeat => orgSeat.id === latestSeat.id);

                    if (existingSeatIndex !== -1) {
                        const existingSeat = ScopeSeats![existingSeatIndex];
                        const existingDate = existingSeat.day;

                        if (existingDate === currentDate) {
                            if (existingSeat.last_activity_at !== latestSeat.last_activity_at) {
                                existingSeat.last_activity_at = latestSeat.last_activity_at;
                                updatedDays.push(currentDate);
                            }
                        } else {
                            const newSeat = { ...latestSeat, day: currentDate };
                            ScopeSeats!.push(newSeat);
                            addedDays.push(currentDate);
                        }
                    } else {
                        const newSeat = { ...latestSeat, day: currentDate };
                        ScopeSeats!.push(newSeat);
                        addedDays.push(currentDate);
                    }
                });

                if (updatedDays.length > 0 || addedDays.length > 0) {
                    let data: any[] = [];

                    if (fs.existsSync(this.getScopeFilePath())) {
                        const existingData = fs.readFileSync(this.getScopeFilePath(), 'utf-8');
                        try {
                            data = JSON.parse(existingData);
                        } catch (error) {
                            console.error('Error parsing existing data:', error);
                            data = [];
                        }
                    }

                    const dayEntry = data.find((entry: any) => entry.day === currentDate);
                    if (dayEntry) {
                        latestSeats.forEach(latestSeat => {
                            const existingSeatIndex = dayEntry.seats.findIndex((seat: any) => seat.id === latestSeat.id);
                            if (existingSeatIndex !== -1) {
                                dayEntry.seats[existingSeatIndex] = latestSeat;
                            } else {
                                dayEntry.seats.push(latestSeat);
                            }
                        });
                    } else {
                        data.push({ day: currentDate, organization: this.organizationName, seats: latestSeats });
                    }
                    fs.writeFileSync(this.getScopeFilePath(), JSON.stringify(data, null, 2));
                    this.sendNotification(updatedDays, addedDays);
                }
            } else {
                console.log("No latest seats data provided.");
            }
        } catch (error) {
            console.error("Error in compareAndUpdateSeats:", error);
        }
    }

    private sendNotification(updatedDays: string[], addedDays: string[]): void {
        console.log(`Notification sent for updated days: ${updatedDays.join(', ')}, added days: ${addedDays.join(', ')}`);
    }

    async querySeatsData(organization: string, since?: string, until?: string, page: number = 1, per_page: number = 28): Promise<Seat[]> {
        try {
            const filePath = this.getScopeFilePath();
            if (!fs.existsSync(filePath)) {
                return [];
            }
            const data = fs.readFileSync(filePath, 'utf-8');
            let parsedData: any[] = [];
            try {
                parsedData = JSON.parse(data);
            } catch (error) {
                console.error('Error parsing data:', error);
                return [];
            }

            if (!Array.isArray(parsedData)) {
                console.error('Invalid data format. Expected an array of objects.');
                console.log('Parsed data:', parsedData);
                return [];
            }
            let seats: Seat[] = parsedData.flatMap((entry: any) => entry.seats);

            if (since) {
                seats = seats.filter(seat => new Date(seat.last_activity_at) >= new Date(since));
            }

            if (until) {
                seats = seats.filter(seat => new Date(seat.last_activity_at) <= new Date(until));
            }

            const start = (page - 1) * per_page;
            const end = start + per_page;
            return seats.slice(start, end);
        } catch (error) {
            console.error('Error querying seats data from file:', error);
            return [];
        }
    }
}