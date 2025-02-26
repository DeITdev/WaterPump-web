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

    // Extract Flow_1 value and update the text
    if (data && data.Values) {
      const flow1Data = data.Values.find(tag => tag.Name === "Flow_1");

      if (flow1Data) {
        if (flow1Data.Value === -105) {
          return;
        }

        // If we got valid data, reset the counter
        consecutiveNoDataCount = 0;
        updateTextDisplay(flow1Data.Value.toFixed(2));
      }
    }
  } catch (error) {
    console.error('Error fetching data from REST API:', error);
  }
}

// Clean up interval if needed
export function cleanupRestApi() {
  if (dataUpdateInterval) {
    clearInterval(dataUpdateInterval);
    dataUpdateInterval = null;
  }
} 