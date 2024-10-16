import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

const PROPS = ["MOCKED_DATA", "SCOPE", "GITHUB_ORGS", "GITHUB_TOKEN", "STORAGE_TYPE", "GITHUB_TEAM"];
const env: any = {};

PROPS.forEach(prop => {
    const propName = `VUE_APP_${prop}`;
    env[propName] = process.env[propName];
});

const AZURE_PROPS = ["AZURE_STORAGE_ACCOUNT_NAME", "AZURE_STORAGE_ACCOUNT_KEY", "AZURE_SEAT_TABLE_NAME", "AZURE_ORG_METRICS_TABLE_NAME", "AZURE_ENT_METRICS_TABLE_NAME"];
AZURE_PROPS.forEach(prop => {
    env[prop] = process.env[prop];
});

const VALID_SCOPE = ['organization', 'enterprise', 'team'];
let scopeType: 'organization' | 'enterprise' | 'team' = 'organization'; // Default value
if (VALID_SCOPE.includes(env.VUE_APP_SCOPE)) {
    scopeType = env.VUE_APP_SCOPE as 'enterprise' | 'organization' | 'team';
}

let storageType: 'file' | 'azure' | undefined;
if (env.VUE_APP_STORAGE_TYPE === 'file' || env.VUE_APP_STORAGE_TYPE === 'azure') {
    storageType = env.VUE_APP_STORAGE_TYPE as 'file' | 'azure';
} else {
    throw new Error(`Invalid VUE_APP_STORAGE_TYPE value: ${env.VUE_APP_STORAGE_TYPE}. Valid values: file, azure`);
}

let scopeNames: string[] = [];
if (scopeType === 'enterprise') {
    scopeNames = [env.VUE_APP_GITHUB_ENT]; // enterprise name
} else if (scopeType === 'organization') {
    scopeNames = env.VUE_APP_GITHUB_ORGS.split(',').map((org: string) => org.trim()); // comma-separated list of organization names
}

const config: Config = {
    mockedData: env.VUE_APP_MOCKED_DATA === "true",
    scope: {
        type: scopeType,
        names: scopeNames
    },
    storageType: storageType,
    github: {
        team: env.VUE_APP_GITHUB_TEAM,
        token: env.VUE_APP_GITHUB_TOKEN,
        apiUrl: 'https://api.github.com'
    },
    azureStorage: {
        accountName: env.AZURE_STORAGE_ACCOUNT_NAME,
        accountKey: env.AZURE_STORAGE_ACCOUNT_KEY,
        seatTableName: env.AZURE_SEAT_TABLE_NAME,
        orgMetricsTableName: env.AZURE_ORG_METRICS_TABLE_NAME,
        entMetricsTableName: env.AZURE_ENT_METRICS_TABLE_NAME

    }
};

if (!config.mockedData && !config.github.token) {
    throw new Error("VUE_APP_GITHUB_TOKEN environment variable must be set.");
}

export default config;

interface Config {
    mockedData: boolean;
    scope: {
        type: 'organization' | 'enterprise' | 'team';
        names: string[];
    };
    github: {
        team: string;
        token: string;
        apiUrl: string;
    };
    storageType: 'file' | 'mysql' | 'azure';
    azureStorage: {
        accountName: string,
        accountKey: string,
        seatTableName: string,
        orgMetricsTableName: string,
        entMetricsTableName: string
    }
}