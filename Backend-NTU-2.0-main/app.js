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

client.on('message', async (topic, message) => {
  const data = JSON.parse(message.toString());
  // Emit to Socket.IO clients
  io.emit(topic, data);
  switch (topic) {
    case 'water_monitor/data/panelA':
      await PanelA.create(data);
      break;
    case 'water_monitor/data/panelB':
      await PanelB.create(data);
      break;
    case 'water_monitor/data/panelC':
      await PanelC.create(data);
      break;
    case 'water_monitor/data/panelD':
      await PanelD.create(data);
      break;
    case 'water_monitor/data/panelE':
      await PanelE.create(data);
      break;
    default:
      console.log(`No handler for topic ${topic}`);
  }
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

module.exports = httpServer;
