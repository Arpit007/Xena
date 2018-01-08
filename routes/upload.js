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

Promise.promisifyAll(fs);

//To send message
//{isGlobal, otherUser}
router.post('/xFile', upload.save('xFile'), auth.apiAuth, function (req, res) {
    let payload = JSON.parse(req.body.payload);
    let userID = req.userID;
    let files = req.files;
    
    let task = () => {
        "use strict";
        let Query;
        try {
            if (payload.isGlobal)
                Query = model.conversation.getGlobalConversation();
            else Query = model.conversation.getConversationByUsers(socket.userID, payload.otherUser);
        }
        catch (e) {
            throw statusCode.InternalError;
        }
        return Query.then((conversation) => {
            "use strict";
            let process = (conversation) => {
                let messages = [];
                let subQueries = [];
                
                files.forEach((file) => {
                    return subQueries.push(model.message.createMessage(conversation._id, mType.FILE, file.originalname, userID)
                        .then((message) => {
                            let name = file.originalname;
                            let base = path.dirname(file.path);
                            return new Promise((resolve, reject) => {
                                fs.rename(file.path, `${base}/${message._id.toString()}`, function (err, res) {
                                    if (err) reject(err);
                                    else resolve(res);
                                });
                            }).then(() => messages.push({ message : message, fileName : name }));
                        }));
                });
                return Promise.all(subQueries)
                    .then(() => upload.saveToDb('xFile', messages))
                    .then(() => socket.broadcastMessage(conversation, messages))
                    .then(() => {
                        let reply = response(statusCode.Ok);
                        reply.body.messages = messages;
                        res.json(reply);
                    });
            };
            
            if (!conversation)
                return model.conversation.createConversation(socket.userID, payload.otherUser)
                    .then((conversation) => process(conversation));
            else return process(conversation);
        });
    };
    
    let validate;
    if (!payload.isGlobal)
        validate = model.user.getUsers([ userID, payload.otherUser ])
            .then((users) => {
                if (users.length !== 2)
                    throw statusCode.BadRequest;
                return task();
            });
    else validate = task();
    
    return validate.catch((e) => res.json(response(e)));
});

module.exports = router;