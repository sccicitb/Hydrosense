import fs from "fs";
import mqtt from "mqtt";

// Fungsi untuk mengonfigurasi koneksi MQTT
export const mqttConfig = {
  host: "mqtt://broker.hivemq.com", // Ganti dengan broker MQTT Anda
  port: 1883, // Ganti dengan port yang sesuai, default 1883 untuk MQTT biasa
  username: "yourUsername", // Ganti dengan username MQTT
  password: "yourPassword", // Ganti dengan password MQTT
  ca: [fs.readFileSync("path/to/ca-cert.pem")], // Sertifikat CA untuk SSL/TLS
  clientId: "yourClientId", // Client ID unik
  clean: true, // Koneksi bersih
  reconnectPeriod: 1000, // Interval reconnect jika terputus
  connectTimeout: 30 * 1000, // Timeout koneksi
};
