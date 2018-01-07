/**
 * Created by StarkX on 07-Jan-18.
 */
const express = require('express');
const router = express.Router();

const statusCode = require('../model/statusCode');
const response = require('../model/response');
const upload = require('../src/upload');

router.get('/:id', function (req, res) {
    let id = req.params.id;
    return upload.getPath('xFile', id)
        .then((data) => {
            "use strict";
            if (data.length === 2)
                return res.download(data[ 0 ], data[ 1 ]);
            res.json(response(statusCode.Forbidden));
        });
});

module.exports = router;