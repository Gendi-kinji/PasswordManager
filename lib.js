// Required to access crypto.subtle and secure random byte generation
const crypto = require("crypto");

// Convert a string into a buffer (Uint8Array)
function stringToBuffer(str) {
    return new TextEncoder().encode(str);
}

// Convert a buffer (Uint8Array) into a string
function bufferToString(buffer) {
    return new TextDecoder().decode(buffer);
}

// Convert an ArrayBuffer into a Base64 encoded string
function encodeBuffer(buffer) {
    return Buffer.from(new Uint8Array(buffer)).toString('base64');
}

// Convert a Base64 encoded string back into an ArrayBuffer
function decodeBuffer(base64) {
    return Uint8Array.from(Buffer.from(base64, 'base64')).buffer;
}

// Generate secure random bytes of a specified length
function getRandomBytes(length) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return array;
}

module.exports = {
    stringToBuffer,
    bufferToString,
    encodeBuffer,
    decodeBuffer,
    getRandomBytes
};

