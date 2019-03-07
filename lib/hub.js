"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var Hub =
/*#__PURE__*/
function () {
  function Hub() {}

  var _proto = Hub.prototype;

  _proto.getCode = function getCode() {};

  _proto.getScope = function getScope() {};

  _proto.addHelper = function addHelper() {
    throw new Error("Helpers are not supported by the default hub.");
  };

  _proto.buildError = function buildError(node, msg) {
    var Error = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : TypeError;
    return new Error(msg);
  };

  return Hub;
}();

exports["default"] = Hub;