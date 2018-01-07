/**
 * Created by StarkX on 06-Jan-18.
 */
const jwt = require('jsonwebtoken');

const model = require('../model/model');
const response = require('../model/response');
const statusCode = require('../model/statusCode');
const ObjectID = require('mongoose').Types.ObjectId;

const Connections = {};

//To send message
//{mType,content,isGlobal, otherUser, token}
function sendMessage(socket, payload) {
    try {
        let userID = jwt.verify(payload.token, xConfig.crypto.TokenKey).userID;
        
        let task = () => {
            "use strict";
            let Query;
            try {
                if (payload.isGlobal)
                    Query = model.conversation.getGlobalConversationID();
                else Query = model.conversation.getConversationIDByUsers(ObjectID(socket.userID), ObjectID(payload.otherUser));
            }
            catch (e) {
                let reply = response();
                reply.head.code = statusCode.InternalError;
                return socket.emit('onError', reply);
            }
            return Query.then((conversation) => {
                "use strict";
                let process = (conversation) => {
                    return model.message.createMessage(conversation._id.toString(), payload.mType, payload.content, ObjectID(socket.userID))
                        .then((message) => {
                            conversation.participants.forEach((participant) => {
                                let arr = Connections[ participant.toString() ];
                                if (arr) {
                                    arr.forEach((sock) => {
                                        if (sock !== socket)
                                            sock.emit('onReceive', message);
                                    });
                                }
                            });
                        });
                };
                if (!conversation)
                    return model.conversation.createConversation(socket.userID, payload.otherUser)
                        .then((conversation) => process(conversation));
                else return process(conversation);
            });
        };
        
        let process;
        if (!payload.isGlobal)
            process = model.user.find({ _id : [ userID, payload.otherUser ] }, { _id : 1 })
                .then((users) => {
                    if (!users || users.length !== 2)
                        throw statusCode.BadRequest;
                    return task();
                });
        else process = task();
        
        return process.catch((e) => {
            "use strict";
            let reply = response();
            reply.head.code = statusCode.InternalError;
            socket.emit('onError', reply);
        });
    }
    catch (e) {
        let reply = response();
        reply.head.code = statusCode.Unauthorized;
        return socket.emit('onError', reply);
    }
}

function getLiveList() {
    let UserList = { admin : [], other : [] };
    for (let key in Connections) {
        if (Connections[ key ].length) {
            if (Connections[ key ][ 0 ].isAdmin)
                UserList.admin.push({ id : key, userName : Connections[ key ][ 0 ].userName });
            else UserList.other.push({ id : key, userName : Connections[ key ][ 0 ].userName });
        }
    }
    return UserList;
}

function NotifyAll(userID) {
    let UserList = getLiveList();
    for (let key in Connections) {
        if (userID && key === userID)
            continue;
        Connections[ key ].forEach((sock) => {
            "use strict";
            sock.emit('live', UserList);
        });
    }
}

function Leave(socket) {
    if (Connections[ socket.userID ]) {
        let index = Connections[ socket.userID ].indexOf(socket);
        if (index !== -1) {
            Connections[ socket.userID ].splice(index, 1);
            let Notify = false;
            if (Connections[ socket.userID ].length === 0) {
                delete Connections[ socket.userID ];
                Notify = true;
            }
            if (Notify) {
                NotifyAll();
            }
        }
    }
}

function getActiveUsers(socket) {
    "use strict";
    socket.emit('live', getLiveList());
}

function AttachEvents(socket) {
    "use strict";
    socket.on('send', (payload) => sendMessage(socket, payload));
    socket.on('liveList', () => getActiveUsers(socket));
}

const connect = (app) => {
    const io = require('socket.io').listen(app);
    
    io.on('connection', (socket) => {
        socket.on('verify', function (token) {
            "use strict";
            try {
                let payload = jwt.verify(token, xConfig.crypto.TokenKey);
                const userID = payload.userID;
                
                let process = () => {
                    socket.userID = userID;
                    if (Connections[ userID ].length === 0)
                        NotifyAll(userID);
                    Connections[ userID ].push(socket);
                    AttachEvents(socket);
                    socket.emit('connectionSuccess');
                };
                
                if (!(userID in Connections)) {
                    return model.user.getUserByID(ObjectID(userID))
                        .then((user) => {
                            Connections[ userID ] = [];
                            socket.userName = user.userName;
                            socket.isAdmin = user.isAdmin;
                        })
                        .then(() => process());
                }
                else return new Promise((resolve, reject) => resolve())
                    .then(() => {
                        socket.userName = Connections[ userID ][ 0 ].userName;
                        socket.isAdmin = Connections[ userID ][ 0 ].isAdmin;
                    })
                    .then(() => process());
                
            }
            catch (e) {
                socket.emit('UnAuthorised');
            }
        });
        
        socket.on('disconnect', () => {
            console.log('Disconnected: ' + socket.userName);
            Leave(socket);
        });
    });
};

const broadcastMessage = (conversation, messages) => {
    "use strict";
    return new Promise((resolve, reject) => resolve())
        .then(() => {
            messages.forEach((message) => {
                message = message.message;
                conversation.participants.forEach((participant) => {
                    let arr = Connections[ participant.toString() ];
                    if (arr) {
                        arr.forEach((sock) => {
                            if (sock !== socket)
                                socket.emit('onReceive', message);
                        });
                    }
                });
            });
        });
};

module.exports = {
    connect : connect,
    broadcastMessage : broadcastMessage
};