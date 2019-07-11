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

var invariant = require("fbjs/lib/invariant");

var mapObject = require("fbjs/lib/mapObject");

var _require = require("./RelayStoreUtils"),
    FRAGMENT_OWNER_KEY = _require.FRAGMENT_OWNER_KEY;

function getSingularFragmentOwner(fragmentNode, fragmentRef) {
  var _fragmentRef$FRAGMENT;

  if (fragmentRef == null) {
    return null;
  }

  !(typeof fragmentRef === 'object') ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernFragmentOwner: Expected value for fragment `%s` to be an object, got ' + '`%s`.', fragmentNode.name, typeof fragmentRef) : invariant(false) : void 0;
  var owner = (_fragmentRef$FRAGMENT = fragmentRef[FRAGMENT_OWNER_KEY]) !== null && _fragmentRef$FRAGMENT !== void 0 ? _fragmentRef$FRAGMENT : null;
  return owner;
}

function getPluralFragmentOwner(fragmentNode, fragmentRef) {
  return fragmentRef.map(function (ref) {
    return getSingularFragmentOwner(fragmentNode, ref);
  });
}
/**
 * @public
 * Extracts the fragment owner associated with the given fragment reference.
 * TODO(T39494051) - This helper function will become unnecessary once we're
 * using fragment ownership by default
 */


function getFragmentOwner(fragmentNode, fragmentRef) {
  if (Array.isArray(fragmentRef)) {
    return getPluralFragmentOwner(fragmentNode, fragmentRef);
  }

  return getSingularFragmentOwner(fragmentNode, fragmentRef);
}
/**
 * @public
 * Given a map of key -> fragment nodes, and a map of key -> fragment refs,
 * extracts and returns a map of key -> associated fragment owner.
 * This is useful to construct the argument required by getSelectorsFromObject
 * TODO(T39494051) - This helper function will become unnecessary once we're
 * using fragment ownership by default
 */


function getFragmentOwners(fragmentNodes, fragmentRefs) {
  return mapObject(fragmentNodes, function (fragmentNode, key) {
    var fragmentRef = fragmentRefs[key];
    return getFragmentOwner(fragmentNode, // $FlowFixMe - TODO T39154660 Use FragmentPointer type instead of mixed
    fragmentRef);
  });
}

module.exports = {
  getFragmentOwner: getFragmentOwner,
  getFragmentOwners: getFragmentOwners
};