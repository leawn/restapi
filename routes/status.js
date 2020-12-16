const express = require('express');
const statusController = require('../controllers/status');
const isAuth = require('../middleware/isAuth');

const router = express.Router();

router.get(
    '/',
    isAuth,
    statusController.statusGet
);

router.put(
    '/',
    isAuth,
    statusController.statusUpdate
);

module.exports = router;