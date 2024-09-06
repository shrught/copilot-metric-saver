import { config as dotenvConfig } from 'dotenv';
dotenvConfig();


console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('VUE_APP_MOCKED_DATA:', process.env.VUE_APP_MOCKED_DATA);
console.log('VUE_APP_SCOPE:', process.env.VUE_APP_SCOPE);

// don't run the code after this line in production
//process.exit(0);



const PROPS = ["MOCKED_DATA", "SCOPE", "GITHUB_ORG", "GITHUB_ENT", "GITHUB_TEAM", "GITHUB_TOKEN"];


// please add code to read the environment variables from .env file, then assign them to the env object
// if the NODE_ENV is production, the env object should be assigned the window._ENV_ object



const env: any = {};

PROPS.forEach(prop => {
	const propName = `VUE_APP_${prop}`;
	if (process.env.NODE_ENV === "production") {
		env[propName] = (window as any)["_ENV_"][propName];
	}
	else {
		env[propName] = process.env[propName];
	}
	// output the environment variables to the console
	//console.log(`${propName}=${env[propName]}`);
});

const VALID_SCOPE = ['organization', 'enterprise'];


let scopeType: 'organization' | 'enterprise' | undefined;
if (VALID_SCOPE.includes(env.VUE_APP_SCOPE)) {
	scopeType = env.VUE_APP_SCOPE as 'enterprise' | 'organization'
}

let apiUrl: string;
const githubOrgName = env.VUE_APP_GITHUB_ORG;
const githubEntName = env.VUE_APP_GITHUB_ENT;

let scopeName: string;
if (scopeType === 'organization') {
	scopeName = githubOrgName;
	apiUrl = `https://api.github.com/orgs/${githubOrgName}`;
}
else if (scopeType === 'enterprise') {
	scopeName = githubEntName;
	apiUrl = `https://api.github.com/enterprises/${githubEntName}`;
}
else {
	throw new Error(`Invalid VUE_APP_SCOPE value: ${env.VUE_APP_SCOPE}. Valid values: ${VALID_SCOPE.join(', ')}`)
}

const config: Config = {
	mockedData: env.VUE_APP_MOCKED_DATA === "true",
	scope: {
		type: scopeType,
		name: scopeName
	},
	github: {
		org: githubOrgName,
		ent: githubEntName,
		team: env.VUE_APP_GITHUB_TEAM,
		token: env.VUE_APP_GITHUB_TOKEN,
		apiUrl
	}
}
if (!config.mockedData && !config.github.token) {
	throw new Error("VUE_APP_GITHUB_TOKEN environment variable must be set.");
}

export default config;

interface Config {
	mockedData: boolean;
	scope: {
		type: 'organization' | 'enterprise';
		name: string;
	};
	github: {
		org: string;
		ent: string;
		team: string;
		token: string;
		apiUrl: string;
	}
}
