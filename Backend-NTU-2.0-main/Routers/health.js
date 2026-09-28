const express = require('express');
const HealthController = require('../Controllers/HealthController');
const router = express.Router();

router.get('/sensors', HealthController.getSensors);

module.exports = router;
