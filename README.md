# copilot-metric-saver
call github copilot usage and seat API, then save fetched data to file  or mysql for persistent save, then anlyze it.


This project is an Express.js application that interacts with GitHub APIs to fetch and store metrics. It supports different storage types (file or Azure Table) and can be configured to use mocked data for testing purposes.

## Installation

1. **Clone the repository**:
    ```sh
    git clone https://github.com/DevOps-zhuang/copilot-metric-saver.git
    cd opilot-metric-saver
    ```

2. **Install dependencies**:
    ```sh
    npm install
    ```

3. **Install TypeScript and ts-node globally** (if not already installed):
    ```sh
    npm install -g typescript ts-node
    ```

## Configuration

Create a `.env` file in the root directory of the project and add the following variables:

```properties
NODE_ENV=development
# Determines if mocked data should be used instead of making API calls.
VUE_APP_MOCKED_DATA=false

# Determines the scope of the API calls. 
# Can be 'enterprise' or 'organization' to target API calls to an enterprise or an organization respectively.
VUE_APP_SCOPE=organization


# Determines the enterprise or organization names to target API calls.
# If VUE_APP_SCOPE is 'organization', this should be the a list of organization names separated by commas.
VUE_APP_GITHUB_ORGS=OrgName1,OrgName2,OrgName3


VUE_APP_GITHUB_ENT=EntName

# Determines the team name if exists to target API calls.
VUE_APP_GITHUB_TEAM=

# Determines the GitHub Personal Access Token to use for API calls.
# Create with scopes copilot, manage_billing:copilot or manage_billing:enterprise, read:enterprise AND read:org
VUE_APP_GITHUB_TOKEN=


# Determines the storage type to use for the persistence layer. It should be either 'file' or 'azure'
VUE_APP_STORAGE_TYPE=file

# Azure Storage Account Table parameters (only required if VUE_APP_STORAGE_TYPE is 'azure')
# Create three tables to store Seats and Metrics for Organization level and Metrics for Enterprise (note that seats analytics are not available at the enterprise level)
AZURE_STORAGE_ACCOUNT_NAME=<YOUR-AZURE-STORAGE-ACCOUNT-NAME>
AZURE_STORAGE_ACCOUNT_KEY=<YOUR-AZURE-STORAGE-ACCOUNT-KEY>
AZURE_SEAT_TABLE_NAME=<YOUR-SEAT-TABLE-NAME>
AZURE_ORG_METRICS_TABLE_NAME=<YOUR-ORGANIZATION-LEVEL-METRICS-TABLE>
AZURE_ENT_METRICS_TABLE_NAME=<YOUR-ENTERPRISE-LEVEL-METRICS-TABLE>



## Running the Application

Run the application:ts-node src/server.ts


```
## Calling GET api to get data

You can use the following cURL command to call the API and get the data:

for Enterprise Metrics (when VUE_APP_SCOPE is 'enterprise')
```sh
curl -X GET "http://localhost:3000/{enterpriseName}/metrics/service?since={since}&until={until}&page={page}&per_page={per_page}"
```

for Organization Metrics (when VUE_APP_SCOPE is 'organization')
```sh
curl -X GET "http://localhost:3000/{organizationName}/metrics/service?since={since}&until={until}&page={page}&per_page={per_page}"
```

for Seats (when VUE_APP_SCOPE is 'organization')
```sh
curl -X GET "http://localhost:3000/{organizationName}/seats/service?since={since}&until={until}&page={page}&per_page={per_page}"
```


License
This project is licensed under the MIT License. See the LICENSE file for details.
