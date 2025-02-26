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
    // Use a custom dialog instead of confirm
    const dialog = document.createElement('div');
    dialog.style.position = 'fixed';
    dialog.style.left = '0';
    dialog.style.top = '0';
    dialog.style.width = '100%';
    dialog.style.height = '100%';
    dialog.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    dialog.style.display = 'flex';
    dialog.style.justifyContent = 'center';
    dialog.style.alignItems = 'center';
    dialog.style.zIndex = '9999';

    const content = document.createElement('div');
    content.style.backgroundColor = 'white';
    content.style.padding = '20px';
    content.style.borderRadius = '5px';
    content.style.width = '300px';
    content.style.textAlign = 'center';

    const title = document.createElement('h3');
    title.textContent = 'Choose Connection Type';
    title.style.margin = '0 0 20px 0';

    const mqttBtn = document.createElement('button');
    mqttBtn.textContent = 'MQTT';
    mqttBtn.style.margin = '10px';
    mqttBtn.style.padding = '8px 16px';
    mqttBtn.style.cursor = 'pointer';

    const restBtn = document.createElement('button');
    restBtn.textContent = 'REST API';
    restBtn.style.margin = '10px';
    restBtn.style.padding = '8px 16px';
    restBtn.style.cursor = 'pointer';

    content.appendChild(title);
    content.appendChild(mqttBtn);
    content.appendChild(restBtn);
    dialog.appendChild(content);
    document.body.appendChild(dialog);

    function promptForIpAddress(type) {
      return new Promise((resolveIp) => {
        const ipAddress = window.prompt(
          `Enter IP address for ${type.toUpperCase()} connection:`,
          connectionConfig.ipAddress
        );

        if (ipAddress) {
          connectionConfig.ipAddress = ipAddress;
        }
        resolveIp();
      });
    }

    async function handleConnectionType(type) {
      document.body.removeChild(dialog);
      connectionConfig.type = type;

      // Then ask for IP address
      await promptForIpAddress(type);

      // If REST API was selected, test the connection
      if (type === 'rest') {
        try {
          // First, try to fetch data
          const response = await fetchFromRestApi();

          if (!response.ok) {
            window.alert(`Connection failed with status: ${response.status}`);
            await promptForConnectionSettings();
            resolve(connectionConfig);
            return;
          }

          // Parse the response
          const data = await response.json();
          console.log('REST API test response:', data);

          // Check for -105 values
          if (data && data.Tags && data.Tags.length > 0) {
            // Check if Flow_1 has -105 value
            const flow1Tag = data.Tags.find(tag => tag.Name === "Flow_1");

            if (flow1Tag && flow1Tag.Value === -105) {
              console.warn('Flow_1 tag has -105 value (no data)');
              window.alert('Connected to REST API but Flow_1 has no data (error -105). Please check your configuration.');
              await promptForConnectionSettings();
              resolve(connectionConfig);
              return;
            }

            // Check if all tags have -105 value
            const allNoData = data.Tags.every(tag => tag.Value === -105);
            if (allNoData) {
              console.warn('All tags have -105 value (no data)');
              window.alert('Connected to REST API but all tags have no data (error -105). Please check your configuration.');
              await promptForConnectionSettings();
              resolve(connectionConfig);
              return;
            }

            // If we get here, connection is good
            window.alert('Successfully connected to REST API!');
          } else {
            window.alert('Connected to REST API but no tags were found. Please check your configuration.');
            await promptForConnectionSettings();
            resolve(connectionConfig);
            return;
          }
        } catch (error) {
          console.error('Error testing REST API connection:', error);
          window.alert(`Error connecting to REST API: ${error.message}`);
          await promptForConnectionSettings();
          resolve(connectionConfig);
          return;
        }
      }

      resolve(connectionConfig);
    }

    mqttBtn.addEventListener('click', () => handleConnectionType('mqtt'));
    restBtn.addEventListener('click', () => handleConnectionType('rest'));
  });
}

// Function to test REST API connection
async function testRestApiConnection() {
  try {
    const response = await fetchFromRestApi();
    if (!response.ok) {
      return { success: false, hasData: false };
    }

    // Check the data
    const data = await response.json();
    console.log('Testing connection, received data:', data);

    // Check if ALL tags have the value -105 which indicates no data
    // This is more accurate than checking if just some tags have -105
    const allTagsNoData = data.Tags &&
      data.Tags.length > 0 &&
      data.Tags.every(tag => tag.Value === -105);

    // Also check specifically for Flow_1 since that's what we display
    const flow1Tag = data.Tags && data.Tags.find(tag => tag.Name === "Flow_1");
    const flow1NoData = flow1Tag && flow1Tag.Value === -105;

    // If all tags have no data or specifically Flow_1 has no data
    const noDataFound = allTagsNoData || flow1NoData;

    return {
      success: true,
      hasData: !noDataFound
    };
  } catch (error) {
    console.error('Error testing REST API connection:', error);
    return { success: false, hasData: false };
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