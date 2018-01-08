/**
 * Created by StarkX on 06-Jan-18.
 */
const express = require('express');
const router = express.Router();

const response = require('../model/response');
const model = require('../model/model');

const ObjectID = require('mongoose').Types.ObjectId;

//List of all past conversation
router.post('/all', function (req, res) {
    "use strict";
    return model.conversation.getPastConversations(req.userID)
        .then((conversations) => res.json(conversations))
        .catch((e) => res.json(response(e)));
});

//Get conversation by ID
router.post('/id', function (req, res) {
    "use strict";
    let id = ObjectID(req.body.conversationID);
    return model.conversation.expandConversation(id)
        .then((conversation) => res.json(conversation))
        .catch((e) => res.json(response(e)));
});

//Get conversation between two users
router.post('/user', function (req, res) {
    "use strict";
    return model.conversation.getConversationByUsers(req.userID, req.body.otherUserID)
        .then((conversation) => model.conversation.expandConversation(conversation._id))
        .then((conversation) => res.json(conversation))
        .catch((e) => res.json(response(e)));
});

//Get Global conversation
router.post('/global', function (req, res) {
    "use strict";
    return model.conversation.getGlobalConversation()
        .then((conversation) => model.conversation.expandConversation(conversation._id))
        .then((conversation) => res.json(conversation))
        .catch((e) => res.json(response(e)));
});

module.exports = router;