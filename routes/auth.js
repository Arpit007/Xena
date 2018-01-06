/**
 * Created by StarkX on 06-Jan-18.
 */
const jwt = require('jsonwebtoken');

const response = require('../model/response');
const statusCode = require('../model/statusCode');
const ObjectID = require('mongoose').Types.ObjectId;

module.exports = {
    apiAuth : function (req, res, next) {
        "use strict";
        try {
            let payload = jwt.verify(req.body.token, xConfig.crypto.TokenKey);
            req.userID = ObjectID(payload.userID);
            next();
        }
        catch (e) {
            let reply = response();
            reply.head.code = statusCode.Unauthorized;
            res.json(reply);
        }
    },
    webAuth : function (req, res, next) {
        "use strict";
        try {
            let payload = jwt.verify(req.body.token, xConfig.crypto.TokenKey);
            req.userID = ObjectID(payload.userID);
            next();
        }
        catch (e) {
            res.redirect('/web/login');
        }
    }
};