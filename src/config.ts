import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('VUE_APP_MOCKED_DATA:', process.env.VUE_APP_MOCKED_DATA);
console.log('VUE_APP_SCOPE:', process.env.VUE_APP_SCOPE);
console.log('VUE_APP_storageType:', process.env.VUE_APP_STORAGE_TYPE);

// don't run the code after this line in production
//process.exit(0);

const PROPS = ["MOCKED_DATA", "SCOPE", "GITHUB_ORG", "GITHUB_ENT", "GITHUB_TEAM", "GITHUB_TOKEN", "STORAGE_TYPE"];

// please add code to read the environment variables from .env file, then assign them to the env object
// if the NODE_ENV is production, the env object should be assigned the window._ENV_ object

const env: any = {};

PROPS.forEach(prop => {
    const propName = `VUE_APP_${prop}`;
    if (process.env.NODE_ENV === "production") {
        env[propName] = (window as any)["_ENV_"][propName];
    } else {
        env[propName] = process.env[propName];
    }
    // output the environment variables to the console
	//console.log(`${propName}=${env[propName]}`);
});

const DB_PROPS = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_DATABASE", "DB_PORT"];
DB_PROPS.forEach(prop => {
    //const propName = `DB_${prop}`;
    if (process.env.NODE_ENV === "production") {
        env[prop] = (window as any)["_ENV_"][prop];
    } else {
        env[prop] = process.env[prop];
    }
    // output the environment variables to the console
    //console.log(`${propName}=${env[propName]}`);
});

const VALID_SCOPE = ['organization', 'enterprise', 'team'];

let scopeType: 'organization' | 'enterprise' | 'team' | undefined;
if (VALID_SCOPE.includes(env.VUE_APP_SCOPE)) {
    scopeType = env.VUE_APP_SCOPE as 'enterprise' | 'organization' | 'team';
}

let storageType: 'file' | 'mysql' | undefined;
if (env.VUE_APP_STORAGE_TYPE === 'file' || env.VUE_APP_STORAGE_TYPE === 'mysql') {
    storageType = env.VUE_APP_STORAGE_TYPE as 'file' | 'mysql';
}
else {
	throw new Error(`Invalid VUE_APP_STORAGE_TYPE value: ${env.VUE_APP_STORAGE_TYPE}. Valid values: file, mysql`);
}

// 

let apiUrl: string;
const githubOrgName = env.VUE_APP_GITHUB_ORG;
const githubEntName = env.VUE_APP_GITHUB_ENT;
const githubTeamName = env.VUE_APP_GITHUB_TEAM;

let scopeName: string;
if (scopeType === 'organization') {
    scopeName = githubOrgName;
    apiUrl = `https://api.github.com/orgs/${githubOrgName}`;
} else if (scopeType === 'enterprise') {
    scopeName = githubEntName;
    apiUrl = `https://api.github.com/enterprises/${githubEntName}`;
} else if (scopeType === 'team') {
    scopeName = githubTeamName;
    apiUrl = `https://api.github.com/teams/${githubTeamName}`;
} else {
    throw new Error(`Invalid VUE_APP_SCOPE value: ${env.VUE_APP_SCOPE}. Valid values: ${VALID_SCOPE.join(', ')}`);
}

//to test the DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE, DB_PORT, they can't be empty when the storageType is not file
if (storageType !== 'file') {
    if (!env.DB_HOST || !env.DB_USER || !env.DB_PASSWORD || !env.DB_DATABASE || !env.DB_PORT) {
        throw new Error("DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE, DB_PORT environment variables must be set.");
    }
}


const config: Config = {
    mockedData: env.VUE_APP_MOCKED_DATA === "true",
    scope: {
        type: scopeType,
        name: scopeName
    },
    storageType: env.VUE_APP_STORAGE_TYPE as 'file' | 'mysql',
    github: {
        org: githubOrgName,
        ent: githubEntName,
        team: githubTeamName,
        token: env.VUE_APP_GITHUB_TOKEN,
        apiUrl
    }
};

if (config.storageType !== 'file') {
    config.DB = {
        host: env.DB_HOST,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        database: env.DB_DATABASE,
        port: parseInt(env.DB_PORT, 10)
    };
}

if (!config.mockedData && !config.github.token) {
    throw new Error("VUE_APP_GITHUB_TOKEN environment variable must be set.");
}

export default config;

interface Config {
    mockedData: boolean;
    scope: {
        type: 'organization' | 'enterprise' | 'team';
        name: string;
    };
    github: {
        org: string;
        ent: string;
        team: string;
        token: string;
        apiUrl: string;
    };
    storageType: 'file' | 'mysql';
    DB?: {
        host: string;
        user: string;
        password: string;
        database: string;
        port: number;
    };
}