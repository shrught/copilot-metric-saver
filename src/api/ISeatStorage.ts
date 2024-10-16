// src/api/ISeatStorage.ts
import e from 'express';
import { Seat } from '../model/Seat';

export interface ISeatStorage {
    saveSeatsData(seats: Seat[]): Promise<boolean>;
    readSeatsData(): Promise<Seat[]>;
    querySeatsData(organization:string, since?: string, until?: string, page?: number, per_page?: number): Promise<Seat[]>;
}