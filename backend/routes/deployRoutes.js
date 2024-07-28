// routes/deployRoutes.js
const express = require('express');
const deployController = require('../controllers/deployController');

const router = express.Router();

router.post('/deploy', deployController.deploy);
router.post('/undeploy',)//구현하세요

module.exports = router;
