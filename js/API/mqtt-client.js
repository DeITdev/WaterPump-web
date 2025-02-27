import { connectionConfig } from './connection-config.js';
import { updateTextDisplay } from '../UI/text-display.js';

let client = null;

export function setupMQTT() {
  const { ipAddress, mqttPort, mqttUsername, mqttPassword } = connectionConfig;
  const wsUrl = `ws://${ipAddress}:${mqttPort}`;
  
  // Disconnect existing client if any
  if (client && client.connected) {
    client.end();
  }

  // Create new client
  client = mqtt.connect(wsUrl, {
    username: mqttUsername,
    password: mqttPassword,
    reconnectPeriod: 5000, // Try to reconnect every 5 seconds
    connectTimeout: 30000, // 30 seconds timeout
  });

  client.on('connect', () => {
    console.log('Connected to MQTT broker');
    // Subscribe to topics here
    client.subscribe('/v1/device/+/rawdata');
  });

  client.on('error', (error) => {
    console.error('MQTT Error:', error);
    // Show error in UI
    const errorDiv = document.getElementById('connection-error');
    if (errorDiv) {
      errorDiv.textContent = `MQTT Error: ${error.message}. Check your connection settings.`;
      errorDiv.style.display = 'block';
    }
  });

  client.on('message', (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received MQTT data:', data);

      // Based on your data structure, we need to find the currentInjector in the dataBA array
      if (data.dataBA) {
        const injectorData = data.dataBA.find(item => item.label === "currentInjector");
        if (injectorData && injectorData.value !== undefined) {
          updateTextDisplay(injectorData.value.toFixed(2));
        }
      }
    } catch (error) {
      console.error('Error parsing MQTT message:', error);
    }
  });

  return client;
}

export function getMQTTClient() {
  return client;
}

export function cleanupMQTT() {
  if (client) {
    client.end();
    client = null;
  }
}