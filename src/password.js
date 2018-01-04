/**
 * Created by StarkX on 05-Jan-18.
 */
const crypto = require('crypto');
const rand = require('random-key');

const Pass1Algo = "aes256";
const Pass2Algo = "aes192";

const encryptPassword = (password) => {
    const salt = rand.generate(xConfig.crypto.TokenSaltLength);
    let cipher = crypto.createCipher(Pass1Algo, salt);
    let intermediate = cipher.update(password, 'utf8', 'base64') + cipher.final('base64');
    
    const Count = Math.floor(Math.random() * (xConfig.crypto.MaxPasswordIterations - xConfig.crypto.MinPasswordIterations))
        + xConfig.crypto.MinPasswordIterations;
    
    for (let iteration = 0; iteration < Count; iteration++) {
        cipher = crypto.createCipher(Pass1Algo, salt);
        intermediate = (cipher.update(intermediate, 'base64', 'base64') + cipher.final('base64'));
    }
    
    intermediate = intermediate + String.fromCharCode(Count) + salt;
    
    cipher = crypto.createCipher(Pass2Algo, xConfig.crypto.TokenKey);
    return cipher.update(intermediate, 'utf8', 'base64') + cipher.final('base64');
};

const comparePassword = (truePassword, password) => {
    "use strict";
    const decipher = crypto.createDecipher(Pass2Algo, xConfig.crypto.TokenKey);
    let intermediate = decipher.update(truePassword, 'base64', 'utf8') + decipher.final('utf8');
    
    const index = intermediate.length - xConfig.crypto.TokenSaltLength - 1;
    
    const data = intermediate.substr(0, index);
    const count = intermediate.substr(index, 1).charCodeAt(0);
    const salt = intermediate.substr(index + 1);
    
    let cipher = crypto.createCipher(Pass1Algo, salt);
    intermediate = cipher.update(password, 'utf8', 'base64') + cipher.final('base64');
    
    for (let iteration = 0; iteration < count; iteration++) {
        cipher = crypto.createCipher(Pass1Algo, salt);
        intermediate = (cipher.update(intermediate, 'base64', 'base64') + cipher.final('base64'));
    }
    
    return (data === intermediate);
};

module.exports = {
    comparePassword: comparePassword,
    encryptPassword: encryptPassword
};