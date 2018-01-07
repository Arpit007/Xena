/**
 * Created by StarkX on 05-Jan-18.
 */
const Promise = require('bluebird');

const conversation = require('./conversation');
const message = require('./message');
const statusCode = require('./statusCode');
const ObjectID = require('mongoose').Types.ObjectId;

conversation.getConversations = (userID) => {
    "use strict";
    return conversation.find({ participants : userID, global : false }, { _id : 1 })
        .then((conversations) => {
            let conversationList = [];
            let Queries = [];
            conversations.forEach(function (conversation) {
                return Queries.push(message.find({ conversationID : conversation._id })
                    .sort('-createdAt')
                    .limit(1)
                    .populate({
                        path : "author",
                        select : "userName"
                    })
                    .then((message) => {
                        conversationList.push(message);
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

conversation.getConversationList = (userID) => {
    "use strict";
    return conversation.find({ participants : userID, global : false })
        .populate({
            path : "participants",
            select : "_id userName"
        })
        .then((conversations) => {
            conversations.forEach(function (Conversation) {
                delete Conversation.participants[ userID ];
            });
            return conversations;
        }).catch((e) => {
            console.log(e);
            throw statusCode.InternalError;
        });
};

conversation.getExpConversationByID = (ID) => {
    "use strict";
    if (!ID)return null;
    return message.find({ conversationID : ID })
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

conversation.getConversationIDByUsers = (user1, user2) => {
    "use strict";
    return conversation.findOne({ participants : [ user1, user2 ], global : false });
};

conversation.getConversationByUsers = (user1, user2) => {
    "use strict";
    return conversation.getConversationIDByUsers(user1, user2)
        .then((ID) => conversation.getExpConversationByID(ID._id));
};


conversation.getGlobalConversationID = () => {
    "use strict";
    return conversation.findOne({ global : true });
};

conversation.getGlobalConversation = () => {
    "use strict";
    return conversation.getGlobalConversationID()
        .then((ID) => conversation.getExpConversationByID(ID._id));
};

conversation.createConversation = (user1, user2) => {
    "use strict";
    let users = [];
    if (user1)users.push(ObjectID(user1));
    if (user2)users.push(ObjectID(user2));
    let isGlobal = users.length !== 2;
    return conversation.create({
        participants : users,
        global : isGlobal
    });
};

module.exports = conversation;