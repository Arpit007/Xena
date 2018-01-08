const express = require('express');
const router = express.Router();

const fs = require('fs');

router.get('/course', function (req, res) {
    fs.readdir('static/course', function(err, items) {
        if (items && items.length > 0)
            res.download(`static/course/${items[0]}`);
        else res.end('404: Not Found');
    });
});

module.exports = router;
