import { connectionConfig } from './connection-config.js';
import { updateTextDisplay } from '../UI/text-display.js';

export function setupMQTT() {
  // Check if mqtt client is available globally
  if (typeof mqtt === 'undefined') {
    console.error('MQTT library not loaded properly');
    return;
  }

  const options = {
    username: connectionConfig.mqttUsername,
    password: connectionConfig.mqttPassword,
    clientId: 'waterpanel_' + Math.random().toString(16).substring(2, 8)
  };

  // Use secure WebSockets when on HTTPS
  const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
  const client = mqtt.connect(`${protocol}${connectionConfig.ipAddress}:${connectionConfig.mqttPort}`, options);

  client.on('connect', () => {
    console.log(`Connected to MQTT broker at ${connectionConfig.ipAddress}`);
    client.subscribe('/v1/device/+/rawdata');
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

  client.on('error', (error) => {
    console.error('MQTT connection error:', error);
  });
} 