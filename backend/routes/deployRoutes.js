// routes/deployRoutes.js
const express = require('express');
const deployController = require('../controllers/deployController');

const router = express.Router();

router.post('/deploy', deployController.deploy);
router.post('/undeploy',deployController.stopDeploy);//구현하세요
router.post('/update',deployController.updateDeploy);

module.exports = router;
