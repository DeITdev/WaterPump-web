// Configuration for data connection
export const connectionConfig = {
  type: 'mqtt', // 'mqtt' or 'rest'
  ipAddress: localStorage.getItem('mqttIpAddress') || '127.0.0.1',
  mqttPort: parseInt(localStorage.getItem('mqttPort')) || 51328,
  mqttUsername: localStorage.getItem('mqttUsername') || 'admin',
  mqttPassword: localStorage.getItem('mqttPassword') || 'admin',
  restApiEndpoint: '/WaWebService/Json/GetTagValue/express',
  restApiUsername: 'admin',
  restApiPassword: '',
  updateInterval: 5000, // 5 seconds for REST API polling
};

// Function to save connection settings to localStorage
export function saveConnectionSettings(settings) {
  localStorage.setItem('mqttIpAddress', settings.ipAddress);
  localStorage.setItem('mqttPort', settings.mqttPort);
  localStorage.setItem('mqttUsername', settings.mqttUsername);
  localStorage.setItem('mqttPassword', settings.mqttPassword);
  Object.assign(connectionConfig, settings);
}

// Function to prompt user for connection settings
export function promptForConnectionSettings() {
  return new Promise((resolve) => {
    showConnectionTypeDialog();

    function showConnectionTypeDialog() {
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

      mqttBtn.addEventListener('click', () => {
        document.body.removeChild(dialog);
        handleConnectionType('mqtt');
      });

      restBtn.addEventListener('click', () => {
        document.body.removeChild(dialog);
        handleConnectionType('rest');
      });
    }

    function promptForIpAddress(type) {
      return new Promise((resolveIp, rejectIp) => {
        const ipAddress = window.prompt(
          `Enter IP address for ${type.toUpperCase()} connection:`,
          connectionConfig.ipAddress
        );

        // If user clicked Cancel, reject the promise
        if (ipAddress === null) {
          rejectIp(new Error('User cancelled IP address input'));
          return;
        }

        // If user entered an IP address, update the config
        if (ipAddress) {
          connectionConfig.ipAddress = ipAddress;
        }

        resolveIp();
      });
    }

    async function handleConnectionType(type) {
      connectionConfig.type = type;

      try {
        // Ask for IP address
        await promptForIpAddress(type);

        // For MQTT, only allow local connections
        if (type === 'mqtt') {
          // Check if the IP is local (127.0.0.1 or localhost)
          const isLocalIP = connectionConfig.ipAddress === '127.0.0.1' ||
            connectionConfig.ipAddress === 'localhost';

          if (!isLocalIP) {
            window.alert('MQTT connections are only supported for local connections (127.0.0.1 or localhost).');
            showConnectionTypeDialog(); // Go back to connection type selection
            return;
          }

          // If we get here, local MQTT connection is allowed
          saveConnectionSettings(connectionConfig);
          resolve(connectionConfig);
        }
        // If REST API was selected, test the connection
        else if (type === 'rest') {
          try {
            // First, try to fetch data
            const response = await fetchFromRestApi();

            if (!response.ok) {
              window.alert(`Connection failed with status: ${response.status}`);
              showConnectionTypeDialog(); // Go back to connection type selection
              return;
            }

            // Parse the response
            const data = await response.json();

            // Check if the response has the expected structure
            if (!data.Values) {
              window.alert('Connected to REST API but received unexpected data format. Please check your configuration.');
              showConnectionTypeDialog();
              return;
            }

            // Check if Flow_1 has -105 value
            const flow1Tag = data.Values.find(tag => tag.Name === "Flow_1");

            if (!flow1Tag) {
              window.alert('Connected to REST API but Flow_1 tag was not found. Please check your configuration.');
              showConnectionTypeDialog();
              return;
            }

            // SIMPLE CHECK: If value is -105, go back to IP input, otherwise continue
            if (flow1Tag.Value === -105) {
              window.alert('Flow_1 has no data (value -105). Please check your configuration or try a different IP.');
              showConnectionTypeDialog();
              return;
            }

            // If we get here, connection is good
            window.alert('Successfully connected to REST API!');
            saveConnectionSettings(connectionConfig);
            resolve(connectionConfig);
          } catch (error) {
            console.error('Error testing REST API connection:', error);
            window.alert(`Error connecting to REST API: ${error.message}`);
            showConnectionTypeDialog(); // Go back to connection type selection
            return;
          }
        }
      } catch (error) {
        // This catches the error when user clicks Cancel on IP prompt
        showConnectionTypeDialog(); // Go back to connection type selection
      }
    }
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