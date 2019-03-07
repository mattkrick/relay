'use strict';

require("./es6.promise");

require("./es7.promise.try");

var $Promise = require("./_core").Promise;

var $try = $Promise['try'];
module.exports = {
  'try': function _try(callbackfn) {
    return $try.call(typeof this === 'function' ? this : $Promise, callbackfn);
  }
}['try'];