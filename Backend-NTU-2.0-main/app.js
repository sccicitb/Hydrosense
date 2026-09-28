require('dotenv').config();

const express = require('express');
const app = express();
const router = require('./Routers/router');
const errorHandler = require('./middlewares/errorHandler');
const cors = require('cors');
const mqtt = require('mqtt');
const fs = require('fs');
const { PanelA, PanelB, PanelC, PanelD, PanelE } = require('./models');
const user = require('./models/user');
const { createServer } = require('http');
const { Server } = require('socket.io');
const sensorHealth = require('./helper/sensorHealth');

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: '*', // Sesuaikan dengan URL frontend Anda
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(router);
router.use(errorHandler);

const options = {
  port: process.env.MQTT_PORT,
  host: process.env.MQTT_HOST,
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  protocol: 'mqtts',
  ca: [fs.readFileSync('cert/emqxsl_water_mon.crt')],
};

const client = mqtt.connect(options);

client.on('connect', () => {
  console.log('Connected to MQTT');
  client.subscribe('water_monitor/data/panelA');
  client.subscribe('water_monitor/data/panelB');
  client.subscribe('water_monitor/data/panelC');
  client.subscribe('water_monitor/data/panelD');
  client.subscribe('water_monitor/data/panelE');
});

const PANEL_BY_TOPIC = {
  'water_monitor/data/panelA': 'A',
  'water_monitor/data/panelB': 'B',
  'water_monitor/data/panelC': 'C',
  'water_monitor/data/panelD': 'D',
  'water_monitor/data/panelE': 'E',
};

client.on('message', async (topic, message) => {
  let data;
  try {
    data = JSON.parse(message.toString());
  } catch (err) {
    console.error(`Failed to parse MQTT message on ${topic}:`, err.message);
    return;
  }
  // Emit to Socket.IO clients
  io.emit(topic, data);

  const panelKey = PANEL_BY_TOPIC[topic];
  if (panelKey) sensorHealth.recordMessage(panelKey);

  switch (topic) {
    case 'water_monitor/data/panelA':
      try {
        await PanelA.create(data);
        sensorHealth.recordPersisted('A');
      } catch (err) {
        sensorHealth.recordError('A', err.name);
      }
      break;
    case 'water_monitor/data/panelB':
      try {
        await PanelB.create(data);
        sensorHealth.recordPersisted('B');
      } catch (err) {
        sensorHealth.recordError('B', err.name);
      }
      break;
    case 'water_monitor/data/panelC':
      try {
        await PanelC.create(data);
        sensorHealth.recordPersisted('C');
      } catch (err) {
        sensorHealth.recordError('C', err.name);
      }
      break;
    case 'water_monitor/data/panelD':
      try {
        await PanelD.create(data);
        sensorHealth.recordPersisted('D');
      } catch (err) {
        sensorHealth.recordError('D', err.name);
      }
      break;
    case 'water_monitor/data/panelE':
      try {
        await PanelE.create(data);
        sensorHealth.recordPersisted('E');
      } catch (err) {
        sensorHealth.recordError('E', err.name);
      }
      break;
    default:
      console.log(`No handler for topic ${topic}`);
  }

  if (panelKey) io.emit('sensor-health', sensorHealth.getSnapshot());
});

sensorHealth.startFreshnessTick((snapshot) => {
  io.emit('sensor-health', snapshot);
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  httpServer.listen(port, () => {
    console.log(`Server listening on PORT ${port}`);
  });
}

module.exports = httpServer;
