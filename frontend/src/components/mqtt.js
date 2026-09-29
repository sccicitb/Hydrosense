// /app/mqtt.js
import mqtt from "mqtt";
import { useEffect, useState } from "react";

const brokerUrl = "mqtt://broker.hivemq.com"; // Ganti dengan broker MQTT Anda

const useMqttData = () => {
  const [mqttData, setMqttData] = useState({
    A: null,
    B: null,
    C: null,
    D: null,
  });

  useEffect(() => {
    const client = mqtt.connect(brokerUrl);

    // Subscribing ke semua topik panel
    const mqttTopics = ["water_monitor/data/panelA", "water_monitor/data/panelB", "water_monitor/data/panelC", "water_monitor/data/panelD"];

    client.on("connect", () => {
      console.log(`Connected to MQTT broker at ${brokerUrl}`);
      mqttTopics.forEach((topic) => {
        client.subscribe(topic, (err) => {
          if (err) {
            console.error("Error subscribing to topic:", err);
          } else {
            console.log(`Subscribed to topic: ${topic}`);
          }
        });
      });
    });

    client.on("message", (receivedTopic, message) => {
      const panel = receivedTopic.split("/")[2].toUpperCase(); // Extract panel (A, B, C, D)
      if (mqttTopics.includes(receivedTopic)) {
        const parsedData = JSON.parse(message.toString());
        setMqttData((prevData) => ({
          ...prevData,
          [panel]: parsedData, // Update data per panel
        }));
      }
    });

    // Cleanup: unsubscribe dan disconnect saat komponen unmount
    return () => {
      mqttTopics.forEach((topic) => {
        client.unsubscribe(topic, () => {
          console.log(`Unsubscribed from topic: ${topic}`);
        });
      });
      client.end();
    };
  }, []);

  return mqttData;
};

export default useMqttData;
