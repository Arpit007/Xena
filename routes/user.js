/**
 * Created by StarkX on 06-Jan-18.
 */
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const ObjectID = require('mongoose').Types.ObjectId;

const resetPassMail = require('../src/passwordResetMail');
const response = require('../model/response');
const statusCode = require('../model/statusCode');
const model = require('../model/model');

router.post('/signup', function (req, res) {
    "use strict";
    const userName = req.body[ 'userName' ];
    const email = req.body[ 'email' ];
    const password = req.body[ 'password' ];
    
    return model.user.createUser(userName, email, password)
        .then((user) => {
            const token = jwt.sign({ userID : user._id.toString() }, xConfig.crypto.TokenKey, { expiresIn : xConfig.crypto.JwtExpiration * 60 * 60 });
            let reply = response();
            reply.head.code = statusCode.Ok;
            reply.body.token = token;
            reply.body.userName = user.userName;
            reply.body.email = user.email;
            
            return model.conversation.getGlobalConversationID()
                .then((conversation) => {
                    let work = (conversation) => {
                        conversation.participants.push(user._id);
                        return conversation.save()
                            .then(() => {
                                res.json(reply);
                            });
                    };
                    if (!conversation)
                        return model.conversation.createConversation(null, null)
                            .then((conversation) => work(conversation));
                    else return new Promise(resolve => resolve())
                        .then(() => work(conversation));
                });
        })
        .catch((e) => {
            let reply = response();
            reply.head.code = e;
            res.json(reply);
        });
});

router.post('/signin', function (req, res) {
    "use strict";
    const id = req.body[ 'id' ];
    const password = req.body[ 'password' ];
    
    return model.user.authorise(id, password)
        .then((user) => {
            const token = jwt.sign({ userID : user._id.toString() }, xConfig.crypto.TokenKey, { expiresIn : xConfig.crypto.JwtExpiration * 60 * 60 });
            let reply = response();
            reply.head.code = statusCode.Ok;
            reply.body.token = token;
            reply.body.userName = user.userName;
            reply.body.email = user.email;
            res.json(reply);
        })
        .catch((e) => {
            let reply = response();
            reply.head.code = e;
            res.json(reply);
        });
});

router.post('/forgot', function (req, res) {
    const id = req.body[ 'id' ];
    return model.user.generateResetToken(id)
        .then((user) => {
            "use strict";
            const link = 'http://' + xConfig.localIP + '/api/user/reset?token=' + user.resetToken;
            resetPassMail(user.email, user.userName, link, (err) => {
                if (err)throw statusCode.InternalError;
                let reply = response();
                reply.head.code = statusCode.Ok;
                res.json(reply);
            });
        })
        .catch((e) => {
            let reply = response();
            reply.head.code = e;
            res.json(reply);
        });
});

router.get('/reset', function (req, res) {
    const token = req.query.token;
    let reply = response();
    try {
        let payload = jwt.verify(token, xConfig.crypto.TokenKey);
        const userID = ObjectID(payload.userID);
        const token = payload.token;
        return model.user.findById(userID)
            .then((user) => {
                "use strict";
                if (!user)throw statusCode.UserDoesNotExists;
                let validity = model.user.resetTokenValidity(user, token);
                if (!validity) res.redirect('/unauthorised');
                req.flash('token', token);
                res.redirect('/user/reset');
            });
    }
    catch (e) {
        reply.head.code = statusCode.Unauthorized;
        res.json(reply);
    }
});

router.post('/change', function (req, res) {
    "use strict";
    const token = req.query.token;
    let reply = response();
    try {
        let payload = jwt.verify(token, xConfig.crypto.TokenKey);
        const userID = ObjectID(payload.userID);
        const token = payload.token;
        return model.user.findById(userID)
            .then((user) => {
                "use strict";
                if (!user)throw statusCode.UserDoesNotExists;
                let validity = model.user.resetTokenValidity(user, token);
                if (!validity) res.redirect('/unauthorised');
                return model.user.changePassword(User, password)
                    .then(() => {
                        let reply = response();
                        reply.head.code = statusCode.Ok;
                        res.json(reply);
                    });
            });
    }
    catch (e) {
        reply.head.code = statusCode.Unauthorized;
        res.json(reply);
    }
});

module.exports = router;