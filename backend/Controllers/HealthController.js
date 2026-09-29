const sensorHealth = require('../helper/sensorHealth');

class HealthController {
  static async getSensors(req, res) {
    res.status(200).json(sensorHealth.getSnapshot());
  }
}

module.exports = HealthController;
