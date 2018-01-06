/**
 * Created by StarkX on 06-Jan-18.
 */
const jwt = require('jsonwebtoken');

const model = require('../model/model');
const response = require('../model/response');
const statusCode = require('../model/statusCode');

const Connections = {};

//To send message
//{mType,content,isGlobal, otherUser}
function sendMessage(socket, payload) {
    let Query;
    try {
        if (payload.isGlobal)
            Query = model.conversation.getGlobalConversation();
        else Query = model.conversation.getConversationByUsers(socket.userID, payload.otherUser);
    }
    catch (e) {
        let reply = response();
        reply.head.code = statusCode.InternalError;
        socket.emit('onError', reply);
        return;
    }
    return Query.then((conversation) => {
        "use strict";
        let process = (conversation) => {
            return model.message.createMessage(conversation._id.toString(), payload.mType, payload.content, socket.userID.toString())
                .then((message) => {
                    conversation.participants.forEach((participant) => {
                        let arr = Connections[ participant._id.toString() ];
                        if (arr) {
                            arr.forEach((sock) => {
                                if (sock !== socket)
                                    socket.emit('onReceive', message);
                            });
                        }
                    });
                });
        };
        if (!conversation)
            return model.conversation.createConversation(socket.userID, payload.otherUser)
                .then((conversation) => process(conversation));
        else return process(conversation);
    }).catch((e) => {
        "use strict";
        let reply = response();
        reply.head.code = statusCode.InternalError;
        socket.emit('onError', reply);
    });
}

function AttachEvents(socket) {
    "use strict";
    socket.on('send', (payload) => sendMessage(socket, payload));
}

module.exports = (app) => {
    const io = require('socket.io').listen(app);
    
    io.on('connection', (socket) => {
        socket.on('verify', function (token) {
            "use strict";
            try {
                let payload = jwt.verify(token, xConfig.crypto.TokenKey);
                const userID = payload.userID;
                if (!(userID in Connections))
                    Connections[ userID ] = [];
                socket.userID = userID;
                Connections[ userID ].push(socket);
                AttachEvents(socket);
                socket.emit('connectionSuccess');
            }
            catch (e) {
                socket.emit('UnAuthorised');
            }
        });
        
        socket.on('disconnect', () => {
            console.log('Disconnected: ' + socket.UserName);
            let index = Connections[ socket.UserID ].indexOf(socket);
            Connections[ socket.UserID ].splice(index, 1);
            if (Connections[ socket.UserID ].length === 0)
                delete Connections[ socket.UserID ];
        });
    });
};