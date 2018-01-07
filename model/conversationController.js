/**
 * Created by StarkX on 05-Jan-18.
 */
const Promise = require('bluebird');

const conversation = require('./conversation');
const message = require('./message');
const statusCode = require('./statusCode');
const ObjectID = require('mongoose').Types.ObjectId;

conversation.getPastConversations = (userID) => {
    "use strict";
    return conversation.find({ participants : userID, global : true }, { _id : 1 })
        .then((conversations) => {
            let conversationList = [];
            let Queries = [];
            conversations.forEach((conversation) => {
                return Queries.push(message.find({ conversationID : conversation._id })
                    .sort('-createdAt')
                    .limit(1)
                    .populate({
                        path : "author",
                        select : "userName"
                    })
                    .then((messages) => {
                        conversation._doc.messages = messages;
                        conversationList.push(conversation);
                    }));
            });
            return Promise.all(Queries)
                .then(() => conversationList);
        })
        .catch((e) => {
            console.log(e);
            throw statusCode.InternalError;
        });
};

conversation.expandConversation = (conversationID) => {
    "use strict";
    if (!conversationID)return null;
    return message.find({ conversationID : conversationID })
        .select('mType content author')
        .sort('-createdAt')
        .populate({
            path : 'author',
            select : 'userName'
        }).catch((e) => {
            console.log(e);
            throw statusCode.InternalError;
        });
};

conversation.getGlobalConversation = () => {
    "use strict";
    return conversation.findOne({ global : true });
};

conversation.getConversationByUsers = (user1, user2) => {
    "use strict";
    return conversation.findOne({ participants : [ user1, user2 ], global : false });
};

conversation.createConversation = (user1, user2) => {
    "use strict";
    let users = [];
    if (user1) users.push(ObjectID(user1));
    if (user2) users.push(ObjectID(user2));
    let isGlobal = users.length !== 2;
    return conversation.create({
        participants : users,
        global : isGlobal
    });
};

module.exports = conversation;