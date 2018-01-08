/**
 * Created by StarkX on 06-Jan-18.
 */
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const ObjectID = require('mongoose').Types.ObjectId;

const socket = require('../src/socket');
const resetPassMail = require('../src/passwordResetMail');
const response = require('../model/response');
const statusCode = require('../model/statusCode');
const model = require('../model/model');

const generateToken = (user) => {
    "use strict";
    return jwt.sign({ userID : user._id.toString() }, xConfig.crypto.TokenKey, { expiresIn : xConfig.crypto.JwtExpiration * 60 * 60 });
};

router.post('/signup', function (req, res) {
    "use strict";
    const userName = req.body.userName;
    const email = req.body.email;
    const password = req.body.password;
    
    return model.user.createUser(userName, email, password)
        .then((user) => {
            let reply = response(statusCode.Ok);
            reply.body.token = generateToken(user);
            reply.body.userID = user._id.toString();
            reply.body.userName = user.userName;
            reply.body.email = user.email;
            
            return model.conversation.getGlobalConversation()
                .then((conversation) => {
                    let work = (conversation) => {
                        conversation.participants.push(user._id);
                        return conversation.save()
                            .then(() => res.json(reply));
                    };
                    if (!conversation)
                        return model.conversation.createConversation()
                            .then((conversation) => work(conversation));
                    else return new Promise(resolve => resolve())
                        .then(() => work(conversation));
                })
                .then(() => socket.NotifyNewSignUp())
                .catch((e) => {
                    console.log(e);
                    throw statusCode.InternalError;
                })
        })
        .catch((e) => res.json(response(e)));
});

router.post('/signin', function (req, res) {
    "use strict";
    const id = req.body.id;
    const password = req.body.password;
    
    return model.user.authorise(id, password)
        .then((user) => {
            let reply = response(statusCode.Ok);
            reply.body.token = generateToken(user);
            reply.body.userID = user._id.toString();
            reply.body.userName = user.userName;
            reply.body.email = user.email;
            res.json(reply);
        })
        .catch((e) => {
            console.log(e);
            res.json(response(statusCode.InternalError));
        });
});

/*Todo: Set Domain Name Here*/
router.post('/forgot', function (req, res) {
    const id = req.body.id;
    return model.user.generateResetToken(id)
        .then((user) => {
            "use strict";
            const link = 'http://' + xConfig.localIP + '/api/user/reset?token=' + user.resetToken;
            return resetPassMail(user.email, user.userName, link)
                .then((err) => {
                    if (err)throw statusCode.InternalError;
                    res.json(response(statusCode.Ok));
                });
        })
        .catch((e) => res.json(response(e)));
});

router.get('/reset', function (req, res) {
    const token = req.query.token;
    try {
        let payload = jwt.verify(token, xConfig.crypto.TokenKey);
        const userID = ObjectID(payload.userID);
        const token = payload.token;
        return model.user.getUserByID(userID, true)
            .then((user) => {
                "use strict";
                let validity = model.user.resetTokenValidity(user, token);
                if (!validity) throw statusCode.Unauthorized;
                res.json(response(statusCode.Ok));
            })
            .catch((e) => res.json(response(e)));
    }
    catch (e) {
        res.json(response(statusCode.Unauthorized));
    }
});

router.post('/change', function (req, res) {
    "use strict";
    const token = req.query.token;
    try {
        let payload = jwt.verify(token, xConfig.crypto.TokenKey);
        const userID = ObjectID(payload.userID);
        const token = payload.token;
        return model.user.getUserByID(userID, true)
            .then((user) => {
                "use strict";
                let validity = model.user.resetTokenValidity(user, token);
                if (!validity) throw statusCode.Unauthorized;
                return model.user.changePassword(User, password)
                    .then(() => res.json(response(statusCode.Ok)))
                    .catch((e) => {
                        console.log(e);
                        throw statusCode.InternalError;
                    });
            })
            .catch((e) => res.json(response(e)));
    }
    catch (e) {
        res.json(response(statusCode.Unauthorized));
    }
});

module.exports = router;