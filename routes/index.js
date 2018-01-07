const express = require('express');
const router = express.Router();
const path = require('path');

const fs = require('fs');

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
    fs.readdir('static/course', function(err, items) {
        if (items && items.length > 0){
            res.download(`static/course/${items[0]}`)
        }
        else{
            throw Exception("Not Found");
        }
    });
});

module.exports = router;
