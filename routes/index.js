const express = require('express');
const router = express.Router();
const path = require('path');

const publicPath = path.join(__dirname, '../public');

router.get('/', function (req, res, next) {
    res.render('index', { title : xConfig.appName });
});

router.get('/user/reset', function (req, res, next) {
    res.end('Hi');
});

router.get('/unauthorised', function (req, res, next) {
    res.end('UnAuthorised');
});

router.get('/test', function (req, res, next) {
    res.sendFile(publicPath + '/test.html');
});

router.all('/web/login', function (req, res, next) {
    res.end('Login');
});

router.get('/course', function (req, res) {
    res.download('static/course.rar');
});

module.exports = router;
