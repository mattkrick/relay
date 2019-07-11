/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 * @format
 */
'use strict';

var PREFIX = 'client:';

function generateClientID(id, storageKey, index) {
  var key = id + ':' + storageKey;

  if (index != null) {
    key += ':' + index;
  }

  if (key.indexOf(PREFIX) !== 0) {
    key = PREFIX + key;
  }

  return key;
}

function isClientID(id) {
  return id.indexOf(PREFIX) === 0;
}

module.exports = {
  generateClientID: generateClientID,
  isClientID: isClientID
};