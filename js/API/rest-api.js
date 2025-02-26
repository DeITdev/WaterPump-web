import { connectionConfig, fetchFromRestApi, promptForConnectionSettings } from './connection-config.js';
import { updateTextDisplay } from '../UI/text-display.js';

let dataUpdateInterval;
let consecutiveNoDataCount = 0;
const MAX_NO_DATA_ATTEMPTS = 3;

export function setupRestApiDataFetch() {
  console.log(`Setting up REST API data fetch from ${connectionConfig.ipAddress}`);

  // Reset counter
  consecutiveNoDataCount = 0;

  // Initial fetch
  fetchDataFromRestApi();

  // Set up interval for periodic data fetching
  dataUpdateInterval = setInterval(fetchDataFromRestApi, connectionConfig.updateInterval);
}

export async function fetchDataFromRestApi() {
  try {
    const response = await fetchFromRestApi();
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Received REST API data:', data);

    // Extract Flow_1 value and update the text
    if (data && data.Tags) {
      const flow1Data = data.Tags.find(tag => tag.Name === "Flow_1");

      if (flow1Data) {
        console.log(`Flow_1 value: ${flow1Data.Value}, Quality: ${flow1Data.Quality}`);

        if (flow1Data.Value === -105) {
          console.warn('Flow_1 has no data value (-105)');

          // Count consecutive no-data responses
          consecutiveNoDataCount++;

          if (consecutiveNoDataCount >= MAX_NO_DATA_ATTEMPTS) {
            // Clear the current interval
            cleanupRestApi();

            // Show alert and prompt for new connection
            window.alert('No data available for Flow_1 after multiple attempts. Please reconfigure.');
            promptForConnectionSettings().then(() => {
              // After new settings are entered, restart the appropriate connection
              if (connectionConfig.type === 'rest') {
                setupRestApiDataFetch();
              } else {
                // Handle MQTT reconnection
                import('./mqtt-client.js').then(module => {
                  module.setupMQTT();
                });
              }
            });
          }
          return;
        }

        // If we got valid data, reset the counter
        consecutiveNoDataCount = 0;
        updateTextDisplay(flow1Data.Value.toFixed(2));
      } else {
        console.warn('Flow_1 tag not found in response');
      }
    } else {
      console.warn('No Tags array in response');
    }
  } catch (error) {
    console.error('Error fetching data from REST API:', error);
    consecutiveNoDataCount++;

    if (consecutiveNoDataCount >= MAX_NO_DATA_ATTEMPTS) {
      // Clear the current interval
      cleanupRestApi();

      // Show alert and prompt for new connection
      window.alert(`Connection error after multiple attempts: ${error.message}. Please reconfigure.`);
      promptForConnectionSettings().then(() => {
        // After new settings are entered, restart the appropriate connection
        if (connectionConfig.type === 'rest') {
          setupRestApiDataFetch();
        } else {
          // Handle MQTT reconnection
          import('./mqtt-client.js').then(module => {
            module.setupMQTT();
          });
        }
      });
    }
  }
}

// Clean up interval if needed
export function cleanupRestApi() {
  if (dataUpdateInterval) {
    clearInterval(dataUpdateInterval);
    dataUpdateInterval = null;
  }
} 