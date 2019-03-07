"use strict";

var Stream = require("./stream");

if (process.env.READABLE_STREAM === 'disable' && Stream) {
  module.exports = Stream;
  exports = module.exports = Stream.Readable;
  exports.Readable = Stream.Readable;
  exports.Writable = Stream.Writable;
  exports.Duplex = Stream.Duplex;
  exports.Transform = Stream.Transform;
  exports.PassThrough = Stream.PassThrough;
  exports.Stream = Stream;
} else {
  exports = module.exports = require("./_stream_readable.js");
  exports.Stream = Stream || exports;
  exports.Readable = exports;
  exports.Writable = require("./_stream_writable.js");
  exports.Duplex = require("./_stream_duplex.js");
  exports.Transform = require("./_stream_transform.js");
  exports.PassThrough = require("./_stream_passthrough.js");
}