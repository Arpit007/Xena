/**
 * Created by StarkX on 07-Jan-18.
 */
const express = require('express');
const router = express.Router();

const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');

const auth = require('./auth');
const response = require('../model/response');
const socket = require('../src/socket');
const statusCode = require('../model/statusCode');
const model = require('../model/model');
const upload = require('../src/upload');
const mType = require('../model/messageType');

const ObjectID = require('mongoose').Types.ObjectId;
Promise.promisifyAll(fs);

//To send message
//{isGlobal, otherUser}
router.post('/xFile', upload.interim('xFile'), auth.apiAuth, function (req, res) {
    let payload = JSON.parse(req.body.payload);
    let userID = req.userID;
    let files = req.files;
    return model.user.find({ _id : [ userID, payload.otherUser ] }, { _id : 1 })
        .then((users) => {
            if (!users || users.length !== 2)
                throw statusCode.BadRequest;
            let Query;
            try {
                if (payload.isGlobal)
                    Query = model.conversation.getGlobalConversationID();
                else Query = model.conversation.getConversationIDByUsers(userID, payload.otherUser);
            }
            catch (e) {
                let reply = response();
                reply.head.code = statusCode.InternalError;
                return res.json(reply);
            }
            return Query.then((conversation) => {
                "use strict";
                let process = (conversation) => {
                    let messages = [];
                    let subQueries = [];
                    
                    files.forEach((file) => {
                        return subQueries.push(model.message.createMessage(conversation._id, mType.FILE, "", userID)
                            .then((message) => {
                                let name = file.originalname;
                                let base = path.dirname(file.path);
                                return new Promise((resolve, reject) => {
                                    fs.rename(file.path, `${base}/${message._id.toString()}`, function (err, res) {
                                        if (err) reject(err);
                                        else resolve(res);
                                    });
                                }).then(() => {
                                    messages.push({ message : message, fileName : name });
                                });
                            }));
                    });
                    return Promise.all(subQueries)
                        .then(() => {
                            return upload.saveToDb('xFile', messages)
                                .then(() => {
                                    return socket.broadcastMessage(conversation, messages)
                                        .then(() => {
                                            let reply = response();
                                            reply.head.code = statusCode.Ok;
                                            reply.head.messages = messages;
                                            res.json(reply);
                                        });
                                });
                        });
                };
                if (!conversation)
                    return model.conversation.createConversation(ObjectID(userID), ObjectID(payload.otherUser))
                        .then((conversation) => process(conversation));
                else return process(conversation);
            });
        }).catch((e) => {
            "use strict";
            let reply = response();
            reply.head.code = e;
            res.json(reply);
        });
});

module.exports = router;