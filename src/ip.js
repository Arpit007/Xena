/**
 * Created by StarkX on 06-Jan-18.
 */

module.exports = ()=>{
    "use strict";
    let address = "", iFaces = require('os').networkInterfaces();
    for (let dev in iFaces) {
        iFaces[dev].filter((details) => details.family === 'IPv4' && details.internal === false ? address = details.address: undefined);
    }
    return address.toString() + ":" + xConfig.port;
};