import { createConnection, Connection } from 'mysql2/promise';
import { IUsageStorage } from './IUsageStorage';
import { Metrics, BreakdownData } from '../model/Metrics';
import config from '../config';

export class MySQLUsageStorage implements IUsageStorage {
    private dbConnection: Connection | null = null;
    private scope_name: string = '';
    private type: string = '';
    private initialized: boolean = false;

    constructor() {
        this.initConnection();
        this.initializeScope();
        this.initializeDatabase();
    }

    private async initConnection() {
        try {
            this.dbConnection = await createConnection({
                host: config.DB?.host || 'localhost',
                user: config.DB?.user|| 'root',
                password: config.DB?.password || 'password',
                database: config.DB?.database || 'copilot_usage',
                port: Number(config.DB?.port) || 3306
            });
            console.log('Database connection established successfully.');
            this.initialized= true;
        } catch (error) {
            console.error('Error connecting to the database:', error);
            this.initialized = false;
        }
       
    }


    private async initializeScope() {
        try {
            this.scope_name = config.scope.name;
            this.type = config.scope.type;
            console.log('scope_name in initializeScope:', this.scope_name);
        } catch (error) {
            console.error('Error initializing scope:', error);
        }
    }

    private async initializeDatabase() {

        await this.ensureInitialized();
        
        const createMetricsTableQuery = `
            CREATE TABLE IF NOT EXISTS Metrics (
                id INT AUTO_INCREMENT PRIMARY KEY,
                day DATE NOT NULL,
                total_suggestions_count INT NOT NULL,
                total_acceptances_count INT NOT NULL,
                total_lines_suggested INT NOT NULL,
                total_lines_accepted INT NOT NULL,
                total_active_users INT NOT NULL,
                total_chat_acceptances INT DEFAULT 0,
                total_chat_turns INT DEFAULT 0,
                total_active_chat_users INT DEFAULT 0,
                type ENUM('organization', 'team', 'enterprise') NOT NULL,
                scope_name VARCHAR(255) NOT NULL,
                UNIQUE KEY (day, type, scope_name)
            );
        `;

        const createBreakdownDataTableQuery = `
            CREATE TABLE IF NOT EXISTS BreakdownData (
                id INT AUTO_INCREMENT PRIMARY KEY,
                day DATE NOT NULL,
                type ENUM('organization', 'team', 'enterprise') NOT NULL,
                scope_name VARCHAR(255) NOT NULL,
                language VARCHAR(255) NOT NULL,
                editor VARCHAR(255) NOT NULL,
                suggestions_count INT NOT NULL,
                acceptances_count INT NOT NULL,
                lines_suggested INT NOT NULL,
                lines_accepted INT NOT NULL,
                active_users INT NOT NULL,
                UNIQUE KEY (day, type, scope_name, language, editor)
            );
        `;

        await this.dbConnection!.execute(createMetricsTableQuery);
        await this.dbConnection!.execute(createBreakdownDataTableQuery);
        console.log('Database tables initialized.');
    }

    private async ensureInitialized() {
        if (!this.initialized) {
            console.log('Re-initializing connection...');
            await this.initConnection();
        }
    }

    public async saveUsageData(metrics: Metrics[]): Promise<boolean> {
        await this.ensureInitialized();
        try {
            const metricsQuery = `
                INSERT INTO Metrics (day, total_suggestions_count, total_acceptances_count, total_lines_suggested, total_lines_accepted, total_active_users, total_chat_acceptances, total_chat_turns, total_active_chat_users, type, scope_name)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    total_suggestions_count = VALUES(total_suggestions_count),
                    total_acceptances_count = VALUES(total_acceptances_count),
                    total_lines_suggested = VALUES(total_lines_suggested),
                    total_lines_accepted = VALUES(total_lines_accepted),
                    total_active_users = VALUES(total_active_users),
                    total_chat_acceptances = VALUES(total_chat_acceptances),
                    total_chat_turns = VALUES(total_chat_turns),
                    total_active_chat_users = VALUES(total_active_chat_users)`;

            const breakdownQuery = `
                INSERT INTO BreakdownData (day, type, scope_name, language, editor, suggestions_count, acceptances_count, lines_suggested, lines_accepted, active_users)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    suggestions_count = VALUES(suggestions_count),
                    acceptances_count = VALUES(acceptances_count),
                    lines_suggested = VALUES(lines_suggested),
                    lines_accepted = VALUES(lines_accepted),
                    active_users = VALUES(active_users)`;

            for (const metric of metrics) {
                await this.dbConnection!.execute(metricsQuery, [
                    metric.day, metric.total_suggestions_count, metric.total_acceptances_count, metric.total_lines_suggested, metric.total_lines_accepted, metric.total_active_users, metric.total_chat_acceptances, metric.total_chat_turns, metric.total_active_chat_users, this.type, this.scope_name
                ]);

                for (const breakdown of metric.breakdown) {
                    await this.dbConnection!.execute(breakdownQuery, [
                        metric.day, this.type, this.scope_name, breakdown.language, breakdown.editor, breakdown.suggestions_count, breakdown.acceptances_count, breakdown.lines_suggested, breakdown.lines_accepted, breakdown.active_users
                    ]);
                }
            }
            return true;
        } catch (error) {
            console.error('Error saving usage data to MySQL:', error);
            return false;
        }
    }

    public async readUsageData(): Promise<Metrics[]> {
        await this.ensureInitialized();
        try {
            const metricsQuery = `
                SELECT day, total_suggestions_count, total_acceptances_count, total_lines_suggested, total_lines_accepted, total_active_users, total_chat_acceptances, total_chat_turns, total_active_chat_users 
                FROM Metrics 
                WHERE type = ? AND scope_name = ?`;
            const breakdownQuery = `
                SELECT day, language, editor, suggestions_count, acceptances_count, lines_suggested, lines_accepted, active_users 
                FROM BreakdownData 
                WHERE type = ? AND scope_name = ?`;

            const [metricsRows] = await this.dbConnection!.execute(metricsQuery, [this.type, this.scope_name]);
            const [breakdownRows] = await this.dbConnection!.execute(breakdownQuery, [this.type, this.scope_name]);

            const breakdownMap = new Map<string, BreakdownData[]>();
            for (const row of breakdownRows as any[]) {
                const key = `${row.day}`;
                if (!breakdownMap.has(key)) {
                    breakdownMap.set(key, []);
                }
                breakdownMap.get(key)!.push(new BreakdownData(row));
            }

            return (metricsRows as any[]).map((row: any) => new Metrics({
                ...row,
                breakdown: breakdownMap.get(`${row.day}`) || []
            }));
        } catch (error) {
            console.error('Error reading usage data from MySQL:', error);
            return [];
        }
    }

    public async queryUsageData(since?: string, until?: string, page: number = 1, per_page: number = 28): Promise<Metrics[]> {
        await this.ensureInitialized();
        try {
            let query = `
                SELECT DATE_FORMAT(day, '%Y-%m-%d') as day, total_suggestions_count, total_acceptances_count, total_lines_suggested, total_lines_accepted, total_active_users, total_chat_acceptances, total_chat_turns, total_active_chat_users 
                FROM Metrics 
                WHERE type = ? AND scope_name = ?`;

            const params: any[] = [this.type, this.scope_name];

            if (since) {
                query += ' AND day >= ?';
                params.push(since);
            }

            if (until) {
                query += ' AND day <= ?';
                params.push(until);
            }

            // query += ' LIMIT ? OFFSET ?';
            // params.push(per_page, (page - 1) * per_page);

            console.log('query:', query);
            console.log('params:', params);

            const [rows] = await this.dbConnection!.execute(query, params);
            const metrics = (rows as any[]).map((row: any) => new Metrics({
                ...row,
                breakdown: []
            }));

            for (const metric of metrics) {
                const breakdownQuery = `
                    SELECT DATE_FORMAT(day, '%Y-%m-%d') as day, language, editor, suggestions_count, acceptances_count, lines_suggested, lines_accepted, active_users 
                    FROM BreakdownData 
                    WHERE day = ? AND type = ? AND scope_name = ?`;
                const [breakdownRows] = await this.dbConnection!.execute(breakdownQuery, [metric.day, this.type, this.scope_name]);
                metric.breakdown = (breakdownRows as any[]).map((row: any) => new BreakdownData(row));
            }

            return metrics;
        } catch (error) {
            console.error('Error querying usage data from MySQL:', error);
            return [];
        }
    }
}