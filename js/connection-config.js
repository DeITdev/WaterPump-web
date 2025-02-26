// Configuration for data connection
export const connectionConfig = {
  type: 'mqtt', // 'mqtt' or 'rest'
  ipAddress: '127.0.0.1',
  mqttPort: 51328,
  mqttUsername: 'admin',
  mqttPassword: 'admin',
  restApiEndpoint: '/WaWebService/Json/GetTagValue/express',
  restApiUsername: 'admin',
  restApiPassword: '',
  updateInterval: 5000, // 5 seconds for REST API polling
};

// Function to prompt user for connection settings
export function promptForConnectionSettings() {
  return new Promise((resolve) => {
    // First, ask for connection type
    const connectionType = window.confirm(
      'Choose connection type:\nOK for MQTT, Cancel for REST API'
    ) ? 'mqtt' : 'rest';

    connectionConfig.type = connectionType;

    // Then ask for IP address
    const ipAddress = window.prompt(
      `Enter IP address for ${connectionType.toUpperCase()} connection:`,
      connectionConfig.ipAddress
    );

    if (ipAddress) {
      connectionConfig.ipAddress = ipAddress;
    }

    // If REST API was selected, test the connection
    if (connectionType === 'rest') {
      testRestApiConnection().then(success => {
        if (success) {
          window.alert('Successfully connected to REST API!');
        } else {
          window.alert('Could not connect to REST API. Using default settings.');
        }
        resolve(connectionConfig);
      });
    } else {
      resolve(connectionConfig);
    }
  });
}

// Function to test REST API connection
async function testRestApiConnection() {
  try {
    const response = await fetchFromRestApi();
    return response.ok;
  } catch (error) {
    console.error('Error testing REST API connection:', error);
    return false;
  }
}

// Function to fetch data from REST API
export async function fetchFromRestApi() {
  const url = `http://${connectionConfig.ipAddress}${connectionConfig.restApiEndpoint}`;

  const requestBody = {
    Tags: [
      { Name: "Flow_1" },
      { Name: "Flow_2" },
      { Name: "Level_1" },
      { Name: "Level_2" },
      { Name: "Pressure_1" },
      { Name: "Pressure_2" },
      { Name: "Pressure_3" },
      { Name: "Pressure_4" },
      { Name: "Temp1_1" },
      { Name: "Temp1_2" },
      { Name: "Temp2_1" },
      { Name: "Temp2_2" },
      { Name: "Pump1_1" },
      { Name: "Pump1_2" },
      { Name: "Pump2_1" },
      { Name: "Pump2_2" },
      { Name: "Status1_1" },
      { Name: "Status1_2" },
      { Name: "Status2_1" },
      { Name: "Status2_2" }
    ]
  };

  // Base64 encode the credentials for basic auth
  const credentials = btoa(`${connectionConfig.restApiUsername}:`);

  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${credentials}`
    },
    body: JSON.stringify(requestBody)
  });
} 