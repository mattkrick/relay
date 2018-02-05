/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 * @format
 * @providesModule RelayTestUtilsPublic
 */

'use strict';

/**
 * The public interface to Relay Test Utils.
 */
module.exports = {
  MockEnvironment: require('./RelayModernMockEnvironment'),
  testSchemaPath: require('./RelayTestSchemaPath')
};