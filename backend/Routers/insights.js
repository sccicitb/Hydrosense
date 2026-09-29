const express = require("express");
const InsightsController = require("../Controllers/InsightsController");
const router = express.Router();

router.get("/", InsightsController.getInsights);
router.post("/generate", InsightsController.generateInsights);

module.exports = router;
