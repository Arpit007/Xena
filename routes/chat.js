/**
 * Created by StarkX on 06-Jan-18.
 */
const express = require('express');
const router = express.Router();

const path = require('path');

const response = require('../model/response');
const statusCode = require('../model/statusCode');
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
        .then((conversation) => {
            res.json(conversation);
        })
        .catch((e) => {
            res.json(response(e));
        });
});

//Get conversation between two users
router.post('/user', function (req, res) {
    "use strict";
    let otherUser = ObjectID(req.body.otherUserID);
    return model.conversation.getConversationByUsers(req.userID, otherUser)
        .then((conversation)=>model.conversation.expandConversation(conversation._id))
        .then((conversation) => res.json(conversation))
        .catch((e) => {
            res.json(response(e));
        });
});

//Get Global conversation
router.post('/global', function (req, res) {
    "use strict";
    return model.conversation.getGlobalConversation()
        .then((conversation) => model.conversation.expandConversation(conversation._id))
        .then((conversation) => res.json(conversation))
        .catch((e) => {
            res.json(response(e));
        });
});

//To send message- In Debug Mode Only
//{mType,content,isGlobal, otherUser}
if (xConfig.debugMode) {
    "use strict";
    const response = require('../model/response');
    router.post("/add", function (req, res) {
        let payload = req.body.payload;
        let userID = req.userID;
        
        return model.user.find({ _id : [ userID, payload.otherUser ] }, { _id : 1 })
            .then((users) => {
                if (!users || users.length !== 2)
                    throw statusCode.BadRequest;
                let Query;
                try {
                    if (payload.isGlobal)
                        Query = model.conversation.getGlobalConversation();
                    else Query = model.conversation.getConversationByUsers(userID, payload.otherUser);
                }
                catch (e) {
                    res.json(response(statusCode.InternalError));
                }
                return Query.then((conversation) => {
                    "use strict";
                    let process = (conversation) => {
                        return model.message.createMessage(conversation._id.toString(), payload.mType, payload.content, ObjectID(userID))
                            .then((message) => {
                                res.json(message);
                            });
                    };
                    if (!conversation)
                        return model.conversation.createConversation(userID, payload.otherUser)
                            .then((conversation) => process(conversation));
                    else return process(conversation);
                });
            }).catch((e) => {
                "use strict";
                res.json(response(e));
            });
    });
}

module.exports = router;