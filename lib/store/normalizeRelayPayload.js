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

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var RelayModernRecord = require('./RelayModernRecord');

var RelayRecordSource = require('./RelayRecordSource');

var RelayResponseNormalizer = require('./RelayResponseNormalizer');

var _require = require('./RelayStoreUtils'),
    ROOT_ID = _require.ROOT_ID,
    ROOT_TYPE = _require.ROOT_TYPE;

function normalizeRelayPayload(selector, payload, errors, options) {
  var source = RelayRecordSource.create();
  source.set(ROOT_ID, RelayModernRecord.create(ROOT_ID, ROOT_TYPE));
  var relayPayload = RelayResponseNormalizer.normalize(source, selector, payload, options);
  return (0, _objectSpread2["default"])({}, relayPayload, {
    errors: errors
  });
}

module.exports = normalizeRelayPayload;