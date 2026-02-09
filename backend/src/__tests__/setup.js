const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const { Readable } = require('stream');
global.ReadableStream = Readable;

const { MessagePort } = require('worker_threads');
global.MessagePort = MessagePort;

class DOMException extends Error {
    constructor(message, name) {
        super(message);
        this.name = name;
    }
}
global.DOMException = DOMException;
