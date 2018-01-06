/**
 * Created by StarkX on 06-Jan-18.
 */
const express = require('express');
const router = express.Router();

const model = require('../model/model');
const ObjectID = require('mongoose').Types.ObjectId;

//List of all past conversation
router.post('/all', function (req, res) {
    "use strict";
    return model.conversation.getConversationList(req.userID)
        .then((conversations) => {
            res.json(conversations);
        })
        .catch((e) => {
            let reply = response();
            reply.head.code = e;
            res.json(reply);
        });
});

//Get conversation by ID
router.post('/id', function (req, res) {
    "use strict";
    let id = ObjectID(req.body.conversationID);
    return model.conversation.getConversationByID(id)
        .then((conversation) => {
            res.json(conversation);
        })
        .catch((e) => {
            let reply = response();
            reply.head.code = e;
            res.json(reply);
        });
});

//Get conversation between two users
router.post('/user', function (req, res) {
    "use strict";
    let otherUser = ObjectID(req.body.otherUserID);
    return model.conversation.getConversationByUsers(req.userID, otherUser)
        .then((conversation) => {
            res.json(conversation);
        })
        .catch((e) => {
            let reply = response();
            reply.head.code = e;
            res.json(reply);
        });
});

//Get Global conversation
router.post('/global', function (req, res) {
    "use strict";
    return model.conversation.getGlobalConversation()
        .then((conversation) => {
            res.json(conversation);
        })
        .catch((e) => {
            let reply = response();
            reply.head.code = e;
            res.json(reply);
        });
});

module.exports = router;