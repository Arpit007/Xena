/**
 * Created by StarkX on 06-Jan-18.
 */
const os = require('os');

module.exports = (port)=>{
    "use strict";
    let address = "";
    const iFaces = os.networkInterfaces();
    
    for (let dev in iFaces) {
        iFaces[dev].filter((details) => details.family === 'IPv4' && details.internal === false ? address = details.address: undefined);
    }
    return address.toString() + ":" + port;
};