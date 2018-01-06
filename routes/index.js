const express = require('express');
const router = express.Router();

router.get('/', function (req, res, next) {
    res.render('index', { title : xConfig.appName });
});

router.get('/user/reset', function (req, res, next) {
    res.end('Hi');
});

router.get('/unauthorised', function (req, res, next) {
    res.end('UnAuthorised');
});

router.all('/web/login', function (req, res, next) {
    res.end('Login');
});

module.exports = router;
