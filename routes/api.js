/**
 * Created by StarkX on 06-Jan-18.
 */
const express = require('express');
const router = express.Router();

router.use('/user', require('./user'));

module.exports = router;