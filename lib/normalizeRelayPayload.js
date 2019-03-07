/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *  strict-local
 * @format
 */
'use strict';

var RelayInMemoryRecordSource = require("./RelayInMemoryRecordSource");

var RelayModernRecord = require("./RelayModernRecord");

var RelayResponseNormalizer = require("./RelayResponseNormalizer");

var _require = require("./RelayStoreUtils"),
    ROOT_ID = _require.ROOT_ID,
    ROOT_TYPE = _require.ROOT_TYPE;

function normalizeRelayPayload(selector, payload, errors) {
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {
    handleStrippedNulls: false
  };
  var source = new RelayInMemoryRecordSource();
  source.set(ROOT_ID, RelayModernRecord.create(ROOT_ID, ROOT_TYPE));

  var _RelayResponseNormali = RelayResponseNormalizer.normalize(source, selector, payload, options),
      fieldPayloads = _RelayResponseNormali.fieldPayloads,
      incrementalPlaceholders = _RelayResponseNormali.incrementalPlaceholders,
      matchPayloads = _RelayResponseNormali.matchPayloads;

  return {
    errors: errors,
    fieldPayloads: fieldPayloads,
    incrementalPlaceholders: incrementalPlaceholders,
    matchPayloads: matchPayloads,
    source: source
  };
}

module.exports = normalizeRelayPayload;