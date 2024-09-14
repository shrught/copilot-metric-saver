# copilot-metric-saver
call github copilot usage and seat API, then save fetched data to file  or mysql for persistent save, then anlyze it.
# My Express App

This project is an Express.js application that interacts with GitHub APIs to fetch and store metrics. It supports different storage types (file or MySQL) and can be configured to use mocked data for testing purposes.

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

# Determines the enterprise or organization name to target API calls.
VUE_APP_GITHUB_ORG=OrgName

VUE_APP_GITHUB_ENT=EntName

# Determines the team name if exists to target API calls.
VUE_APP_GITHUB_TEAM=

# Determines the GitHub Personal Access Token to use for API calls.
# Create with scopes copilot, manage_billing:copilot or manage_billing:enterprise, read:enterprise AND read:org
VUE_APP_GITHUB_TOKEN=

# Determines the storage type to use for the persistence layer. It should be either 'file' or 'mysql'
VUE_APP_STORAGE_TYPE=file

# Database connection parameters, only required if VUE_APP_STORAGE_TYPE is set to 'mysql'
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_DATABASE=copilot_usage
DB_PORT=3306

Running the Application
Run the application:
License
This project is licensed under the MIT License. See the LICENSE file for details.
