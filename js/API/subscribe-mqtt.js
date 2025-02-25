const mqtt = require('mqtt');

const options = {
  username: 'admin',
  password: 'admin', // Use your configured password 
  port: 1883
};

console.log('Attempting to connect to MQTT broker...');

const client = mqtt.connect('mqtt://127.0.0.1', options);

client.on('connect', () => {
  console.log('Connected to MQTT broker!');

  // Subscribe to the specific topic from your configuration
  const topic = '/v1/device/+/rawdata';  // '+' is a wildcard for ${wadevid}
  client.subscribe(topic, (err) => {
    if (!err) {
      console.log(`Subscribed to topic: ${topic}`);
      console.log('Waiting for data...');
    }
  });
});

client.on('message', (topic, message) => {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}]`);
  console.log(`Topic: ${topic}`);
  try {
    // Parse the JSON message based on your configured format
    const data = JSON.parse(message.toString());
    console.log('Received data:', JSON.stringify(data, null, 2));

    // You should see your BuzzerLamp and currentInjector values in this data
  } catch (e) {
    console.log('Raw message:', message.toString());
  }
});

client.on('error', (error) => {
  console.error('Connection error:', error);
});