/**
 * Created by StarkX on 05-Jan-18.
 */
const Promise = require('bluebird');

const conversation = require('./conversation');
const message = require('./message');
const statusCode = require('./statusCode');

conversation.getConversations = (userID) => {
    "use strict";
    return conversation.find({ participants : userID }, { _id : 1 })
        .then((conversations) => {
            let conversationList = [];
            let Queries = [];
            conversations.forEach(function (conversation) {
                Queries.push(message.find({ conversationID : conversation._id })
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
    return conversation.find({ participants : userID })
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

conversation.getConversationByID = (ID) => {
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

conversation.getConversationByUsers = (user1, user2) => {
    "use strict";
    return conversation.find({ participants : [ user1, user2 ], global : false }, { _id : 1 })
        .then((ID) => conversation.getConversationByID(ID));
};

conversation.getGlobalConversation = () => {
    "use strict";
    return conversation.find({ global : true }, { _id : 1 })
        .then((ID) => conversation.getConversationByID(ID));
};

conversation.createConversation = (user1, user2) => {
    "use strict";
    return conversation.create({
        participants : [ user1, user2 ]
    });
};

module.exports = conversation;