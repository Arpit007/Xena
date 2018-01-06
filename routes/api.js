/**
 * Created by StarkX on 06-Jan-18.
 */
const express = require('express');
const router = express.Router();

const auth = require('./auth');

router.use('/user', require('./user'));
router.use('/chat', auth.apiAuth, require('./chat'));

module.exports = router;