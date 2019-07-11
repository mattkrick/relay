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

var areEqual = require("fbjs/lib/areEqual");

var invariant = require("fbjs/lib/invariant");

var warning = require("fbjs/lib/warning");

var _require = require("./RelayConcreteVariables"),
    getFragmentVariables = _require.getFragmentVariables;

var _require2 = require("./RelayStoreUtils"),
    FRAGMENT_OWNER_KEY = _require2.FRAGMENT_OWNER_KEY,
    FRAGMENTS_KEY = _require2.FRAGMENTS_KEY,
    ID_KEY = _require2.ID_KEY;

/**
 * @public
 *
 * Given the result `item` from a parent that fetched `fragment`, creates a
 * selector that can be used to read the results of that fragment for that item.
 *
 * Example:
 *
 * Given two fragments as follows:
 *
 * ```
 * fragment Parent on User {
 *   id
 *   ...Child
 * }
 * fragment Child on User {
 *   name
 * }
 * ```
 *
 * And given some object `parent` that is the results of `Parent` for id "4",
 * the results of `Child` can be accessed by first getting a selector and then
 * using that selector to `lookup()` the results against the environment:
 *
 * ```
 * const childSelector = getSingularSelector(queryVariables, Child, parent);
 * const childData = environment.lookup(childSelector).data;
 * ```
 */
function getSingularSelector(operationVariables, fragment, item, explicitOwner) {
  !(typeof item === 'object' && item !== null && !Array.isArray(item)) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernSelector: Expected value for fragment `%s` to be an object, got ' + '`%s`.', fragment.name, JSON.stringify(item)) : invariant(false) : void 0;
  var dataID = item[ID_KEY];
  var fragments = item[FRAGMENTS_KEY];

  if (typeof dataID === 'string' && typeof fragments === 'object' && fragments !== null && typeof fragments[fragment.name] === 'object' && fragments[fragment.name] !== null) {
    var _ref, _explicitOwner;

    var argumentVariables = fragments[fragment.name]; // We only use the owner to compute the selector variables if an owner
    // was explicitly passed by the caller, for backwards compatibility.
    // See TODO(T39494051) for details

    if (explicitOwner != null && typeof explicitOwner === 'object') {
      var ownerOperationVariables = explicitOwner.variables;

      var _fragmentVariables = getFragmentVariables(fragment, ownerOperationVariables,
      /* $FlowFixMe(>=0.98.0 site=www,mobile,react_native_fb,oss) This comment
       * suppresses an error found when Flow v0.98 was deployed. To see the
       * error delete this comment and run Flow. */
      argumentVariables);

      return {
        owner: explicitOwner,
        selector: {
          dataID: dataID,
          node: fragment,
          variables: _fragmentVariables
        }
      };
    } // For convenience, we read and pass through the owner if one
    // is present in the fragment reference (`item`), but we only
    // use the owner to compute the selector variables if an owner was
    // explicitly passed by the caller, for backwards compatibility.
    // See TODO(T39494051) for details


    var owner = (_ref = (_explicitOwner = explicitOwner) !== null && _explicitOwner !== void 0 ? _explicitOwner : item[FRAGMENT_OWNER_KEY]) !== null && _ref !== void 0 ? _ref : null;
    var fragmentVariables = getFragmentVariables(fragment, operationVariables,
    /* $FlowFixMe(>=0.98.0 site=www,mobile,react_native_fb,oss) This comment
     * suppresses an error found when Flow v0.98 was deployed. To see the
     * error delete this comment and run Flow. */
    argumentVariables);
    return {
      // $FlowFixMe - TODO T39154660
      owner: owner,
      selector: {
        dataID: dataID,
        node: fragment,
        variables: fragmentVariables
      }
    };
  }

  if (process.env.NODE_ENV !== "production") {
    var stringifiedItem = JSON.stringify(item);

    if (stringifiedItem.length > 499) {
      stringifiedItem = stringifiedItem.substr(0, 498) + "\u2026";
    }

    process.env.NODE_ENV !== "production" ? warning(false, 'RelayModernSelector: Expected object to contain data for fragment `%s`, got ' + '`%s`. Make sure that the parent operation/fragment included fragment ' + '`...%s` without `@relay(mask: false)`.', fragment.name, stringifiedItem, fragment.name) : void 0;
  }

  return null;
}
/**
 * @public
 *
 * Given the result `items` from a parent that fetched `fragment`, creates a
 * selector that can be used to read the results of that fragment on those
 * items. This is similar to `getSingularSelector` but for "plural" fragments that
 * expect an array of results and therefore return an array of selectors.
 */


function getPluralSelector(operationVariables, fragment, items, owners) {
  var selectors = null;

  if (process.env.NODE_ENV !== "production") {
    if (owners != null) {
      process.env.NODE_ENV !== "production" ? warning(items.length === owners.length, 'RelayModernSelector: Expected number of plural values for fragment ' + '`%s` to match number of owners. Received %s values and %s owners.', fragment.name, items.length, owners.length) : void 0;
    }
  }

  items.forEach(function (item, ii) {
    var owner = owners != null ? owners[ii] : null;
    var selector = item != null ? getSingularSelector(operationVariables, fragment, item, owner) : null;

    if (selector != null) {
      selectors = selectors || [];
      selectors.push(selector);
    }
  });
  return selectors;
}

function getSelector(operationVariables, fragment, item, explicitOwner) {
  var selectorOrSelectors;

  if (item == null) {
    selectorOrSelectors = item;
  } else if (fragment.metadata && fragment.metadata.plural === true) {
    !Array.isArray(item) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernSelector: Expected value for fragment `%s` to be an array, got `%s`. ' + 'Remove `@relay(plural: true)` from fragment `%s` to allow the prop to be an object.', fragment.name, JSON.stringify(item), fragment.name) : invariant(false) : void 0;

    if (explicitOwner !== undefined) {
      !Array.isArray(explicitOwner) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernSelector: Expected explcitly provided owner for ' + 'fragment `%s` to be an array, got `%s`.', fragment.name, JSON.stringify(explicitOwner)) : invariant(false) : void 0;
      selectorOrSelectors = getPluralSelector(operationVariables, fragment,
      /* $FlowFixMe(>=0.98.0 site=www,mobile,react_native_fb,oss) This comment
       * suppresses an error found when Flow v0.98 was deployed. To see the
       * error delete this comment and run Flow. */
      item, explicitOwner);
    } else {
      selectorOrSelectors = getPluralSelector(operationVariables, fragment,
      /* $FlowFixMe(>=0.98.0 site=www,mobile,react_native_fb,oss) This comment
       * suppresses an error found when Flow v0.98 was deployed. To see the
       * error delete this comment and run Flow. */
      item);
    }
  } else {
    !!Array.isArray(item) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernSelector: Expected value for fragment `%s` to be an object, got `%s`. ' + 'Add `@relay(plural: true)` to fragment `%s` to allow the prop to be an array of items.', fragment.name, JSON.stringify(item), fragment.name) : invariant(false) : void 0;

    if (explicitOwner != null) {
      !!Array.isArray(explicitOwner) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernSelector: Expected explcitly provided owner for ' + 'fragment `%s` not to be an array, got `%s`.', fragment.name, JSON.stringify(explicitOwner)) : invariant(false) : void 0;
      selectorOrSelectors = getSingularSelector(operationVariables, fragment, item, explicitOwner);
    } else {
      selectorOrSelectors = getSingularSelector(operationVariables, fragment, item);
    }
  }

  return selectorOrSelectors;
}
/**
 * @public
 *
 * Given a mapping of keys -> results and a mapping of keys -> fragments,
 * extracts the selectors for those fragments from the results.
 *
 * The canonical use-case for this function is ReactRelayFragmentContainer, which
 * uses this function to convert (props, fragments) into selectors so that it
 * can read the results to pass to the inner component.
 */


function getSelectorsFromObject(operationVariables, fragments, object, owners) {
  var selectors = {};

  for (var _key in fragments) {
    if (fragments.hasOwnProperty(_key)) {
      var fragment = fragments[_key];
      var item = object[_key];

      if (owners != null) {
        !owners.hasOwnProperty(_key) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernSelector: Expected explcitly provided owner for ' + 'fragment `%s` under key `%s` to exist.', fragment.name, _key) : invariant(false) : void 0;
        var explicitOwner = owners[_key];
        selectors[_key] = getSelector(operationVariables, fragment, item, explicitOwner);
      } else {
        selectors[_key] = getSelector(operationVariables, fragment, item);
      }
    }
  }

  return selectors;
}
/**
 * @public
 *
 * Given a mapping of keys -> results and a mapping of keys -> fragments,
 * extracts a mapping of keys -> id(s) of the results.
 *
 * Similar to `getSelectorsFromObject()`, this function can be useful in
 * determining the "identity" of the props passed to a component.
 */


function getDataIDsFromObject(fragments, object) {
  var ids = {};

  for (var _key2 in fragments) {
    if (fragments.hasOwnProperty(_key2)) {
      var fragment = fragments[_key2];
      var item = object[_key2];
      ids[_key2] = getDataIDsFromFragment(fragment, item);
    }
  }

  return ids;
}

function getDataIDsFromFragment(fragment, item) {
  var idOrIDs;

  if (item == null) {
    idOrIDs = item;
  } else if (fragment.metadata && fragment.metadata.plural === true) {
    !Array.isArray(item) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernSelector: Expected value for fragment `%s` to be an array, got `%s`. ' + 'Remove `@relay(plural: true)` from fragment `%s` to allow the prop to be an object.', fragment.name, JSON.stringify(item), fragment.name) : invariant(false) : void 0;
    /* $FlowFixMe(>=0.98.0 site=www,mobile,react_native_fb,oss) This comment
     * suppresses an error found when Flow v0.98 was deployed. To see the error
     * delete this comment and run Flow. */

    idOrIDs = getDataIDs(fragment, item);
  } else {
    !!Array.isArray(item) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernFragmentSpecResolver: Expected value for fragment `%s` to be an object, got `%s`. ' + 'Add `@relay(plural: true)` to fragment `%s` to allow the prop to be an array of items.', fragment.name, JSON.stringify(item), fragment.name) : invariant(false) : void 0;
    idOrIDs = getDataID(fragment, item);
  }

  return idOrIDs;
}
/**
 * @internal
 */


function getDataIDs(fragment, items) {
  var ids;
  items.forEach(function (item) {
    var id = item != null ? getDataID(fragment, item) : null;

    if (id != null) {
      ids = ids || [];
      ids.push(id);
    }
  });
  return ids || null;
}
/**
 * @internal
 */


function getDataID(fragment, item) {
  !(typeof item === 'object' && item !== null && !Array.isArray(item)) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernSelector: Expected value for fragment `%s` to be an object, got ' + '`%s`.', fragment.name, JSON.stringify(item)) : invariant(false) : void 0;
  var dataID = item[ID_KEY];

  if (typeof dataID === 'string') {
    return dataID;
  }

  process.env.NODE_ENV !== "production" ? warning(false, 'RelayModernSelector: Expected object to contain data for fragment `%s`, got ' + '`%s`. Make sure that the parent operation/fragment included fragment ' + '`...%s` without `@relay(mask: false)`.', fragment.name, JSON.stringify(item), fragment.name) : void 0;
  return null;
}
/**
 * @public
 *
 * Given a mapping of keys -> results and a mapping of keys -> fragments,
 * extracts the merged variables that would be in scope for those
 * fragments/results.
 *
 * This can be useful in determing what varaibles were used to fetch the data
 * for a Relay container, for example.
 */


function getVariablesFromObject(operationVariables, fragments, object, owners) {
  var variables = {};

  for (var _key3 in fragments) {
    if (fragments.hasOwnProperty(_key3)) {
      var fragment = fragments[_key3];
      var item = object[_key3];

      if (owners != null) {
        !owners.hasOwnProperty(_key3) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernSelector: Expected explcitly provided owner for ' + 'fragment `%s` under key `%s` to exist.', fragment.name, _key3) : invariant(false) : void 0;
        var explicitOwner = owners[_key3];
        var itemVariables = getVariablesFromFragment(operationVariables, fragment, item, explicitOwner);
        Object.assign(variables, itemVariables);
      } else {
        var _itemVariables = getVariablesFromFragment(operationVariables, fragment, item);

        Object.assign(variables, _itemVariables);
      }
    }
  }

  return variables;
}

function getVariablesFromFragment(operationVariables, fragment, item, explicitOwner) {
  var _fragment$metadata;

  if (item == null) {
    return {};
  } else if (((_fragment$metadata = fragment.metadata) === null || _fragment$metadata === void 0 ? void 0 : _fragment$metadata.plural) === true) {
    !Array.isArray(item) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernSelector: Expected value for fragment `%s` to be an array, got `%s`. ' + 'Remove `@relay(plural: true)` from fragment `%s` to allow the prop to be an object.', fragment.name, JSON.stringify(item), fragment.name) : invariant(false) : void 0;

    if (explicitOwner !== undefined) {
      !Array.isArray(explicitOwner) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernSelector: Expected explcitly provided owner for ' + 'fragment `%s` to be an array, got `%s`.', fragment.name, JSON.stringify(explicitOwner)) : invariant(false) : void 0;
      return getVariablesFromPluralFragment(operationVariables, fragment,
      /* $FlowFixMe(>=0.98.0 site=www,mobile,react_native_fb,oss) This comment
       * suppresses an error found when Flow v0.98 was deployed. To see the
       * error delete this comment and run Flow. */
      item, explicitOwner);
    } else {
      /* $FlowFixMe(>=0.98.0 site=www,mobile,react_native_fb,oss) This comment
       * suppresses an error found when Flow v0.98 was deployed. To see the
       * error delete this comment and run Flow. */
      return getVariablesFromPluralFragment(operationVariables, fragment, item);
    }
  } else {
    !!Array.isArray(item) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernFragmentSpecResolver: Expected value for fragment `%s` to be an object, got `%s`. ' + 'Add `@relay(plural: true)` to fragment `%s` to allow the prop to be an array of items.', fragment.name, JSON.stringify(item), fragment.name) : invariant(false) : void 0;

    if (explicitOwner !== undefined) {
      !!Array.isArray(explicitOwner) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernSelector: Expected explcitly provided owner for ' + 'fragment `%s` not to be an array, got `%s`.', fragment.name, JSON.stringify(explicitOwner)) : invariant(false) : void 0;
      return getVariablesFromSingularFragment(operationVariables, fragment, item, explicitOwner) || {};
    } else {
      return getVariablesFromSingularFragment(operationVariables, fragment, item) || {};
    }
  }
}

function getVariablesFromSingularFragment(operationVariables, fragment, item, owner) {
  var ownedSelector = getSingularSelector(operationVariables, fragment, item, owner);

  if (!ownedSelector) {
    return null;
  }

  return ownedSelector.selector.variables;
}

function getVariablesFromPluralFragment(operationVariables, fragment, items, owners) {
  var variables = {};
  items.forEach(function (value, ii) {
    if (value != null) {
      var owner = owners != null ? owners[ii] : null;
      var itemVariables = getVariablesFromSingularFragment(operationVariables, fragment, value, owner);

      if (itemVariables) {
        Object.assign(variables, itemVariables);
      }
    }
  });
  return variables;
}
/**
 * @public
 *
 * Determine if two selectors are equal (represent the same selection). Note
 * that this function returns `false` when the two queries/fragments are
 * different objects, even if they select the same fields.
 */


function areEqualSelectors(thisSelector, thatSelector) {
  var areVariablesEqual = areEqual(thisSelector.selector.variables, thatSelector.selector.variables);
  var areReaderSelectorsEqual = thisSelector.selector.dataID === thatSelector.selector.dataID && thisSelector.selector.node === thatSelector.selector.node && areVariablesEqual; // NOTE: With fragment ownership we need to also compare if
  // the owners attached to the selectors are the same, otherwise we might
  // skip setting a new selector that has a new owner.

  return areReaderSelectorsEqual && thisSelector.owner === thatSelector.owner;
}

module.exports = {
  areEqualSelectors: areEqualSelectors,
  getDataIDsFromFragment: getDataIDsFromFragment,
  getDataIDsFromObject: getDataIDsFromObject,
  getSingularSelector: getSingularSelector,
  getPluralSelector: getPluralSelector,
  getSelector: getSelector,
  getSelectorsFromObject: getSelectorsFromObject,
  getVariablesFromSingularFragment: getVariablesFromSingularFragment,
  getVariablesFromPluralFragment: getVariablesFromPluralFragment,
  getVariablesFromFragment: getVariablesFromFragment,
  getVariablesFromObject: getVariablesFromObject
};