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
 * const childSelector = getSelector(queryVariables, Child, parent);
 * const childData = environment.lookup(childSelector).data;
 * ```
 */
function getSelector(operationVariables, fragment, item, explicitOwner) {
  !(typeof item === 'object' && item !== null && !Array.isArray(item)) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernSelector: Expected value for fragment `%s` to be an object, got ' + '`%s`.', fragment.name, JSON.stringify(item)) : invariant(false) : void 0;
  var dataID = item[ID_KEY];
  var fragments = item[FRAGMENTS_KEY];

  if (typeof dataID === 'string' && typeof fragments === 'object' && fragments !== null && typeof fragments[fragment.name] === 'object' && fragments[fragment.name] !== null) {
    var _explicitOwner;

    var argumentVariables = fragments[fragment.name]; // We only use the owner to compute the selector variables if an owner
    // was explicitly passed by the caller, for backwards compatibility.
    // See TODO(T39494051) for details

    if (explicitOwner != null && typeof explicitOwner === 'object') {
      var ownerOperationVariables = explicitOwner.variables;

      var _fragmentVariables = getFragmentVariables(fragment, ownerOperationVariables, argumentVariables);

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


    var owner = (_explicitOwner = explicitOwner) !== null && _explicitOwner !== void 0 ? _explicitOwner : item[FRAGMENT_OWNER_KEY];
    var fragmentVariables = getFragmentVariables(fragment, operationVariables, argumentVariables);
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

  process.env.NODE_ENV !== "production" ? warning(false, 'RelayModernSelector: Expected object to contain data for fragment `%s`, got ' + '`%s`. Make sure that the parent operation/fragment included fragment ' + '`...%s` without `@relay(mask: false)`.', fragment.name, JSON.stringify(item), fragment.name) : void 0;
  return null;
}
/**
 * @public
 *
 * Given the result `items` from a parent that fetched `fragment`, creates a
 * selector that can be used to read the results of that fragment on those
 * items. This is similar to `getSelector` but for "plural" fragments that
 * expect an array of results and therefore return an array of selectors.
 */


function getSelectorList(operationVariables, fragment, items, owners) {
  var selectors = null;

  if (process.env.NODE_ENV !== "production") {
    if (owners != null) {
      process.env.NODE_ENV !== "production" ? warning(items.length !== owners.length, 'RelayModernSelector: Expected number of plural values for fragment ' + '`%s` to match number of owners. Received %s values and %s owners.', fragment.name, items.length, owners.length) : void 0;
    }
  }

  items.forEach(function (item, ii) {
    var owner = owners != null ? owners[ii] : null;
    var selector = item != null ? getSelector(operationVariables, fragment, item, owner) : null;

    if (selector != null) {
      selectors = selectors || [];
      selectors.push(selector);
    }
  });
  return selectors;
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

      if (item == null) {
        selectors[_key] = item;
      } else if (fragment.metadata && fragment.metadata.plural === true) {
        !Array.isArray(item) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernSelector: Expected value for key `%s` to be an array, got `%s`. ' + 'Remove `@relay(plural: true)` from fragment `%s` to allow the prop to be an object.', _key, JSON.stringify(item), fragment.name) : invariant(false) : void 0;

        if (owners != null) {
          var owner = owners[_key];
          !Array.isArray(owner) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernSelector: Expected explcitly provided owner for ' + 'fragment `%s` under key `%s` to be an array, got `%s`.', fragment.name, _key, JSON.stringify(owner)) : invariant(false) : void 0;
          selectors[_key] = getSelectorList(operationVariables, fragment, item, owner);
        } else {
          selectors[_key] = getSelectorList(operationVariables, fragment, item);
        }
      } else {
        !!Array.isArray(item) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernFragmentSpecResolver: Expected value for key `%s` to be an object, got `%s`. ' + 'Add `@relay(plural: true)` to fragment `%s` to allow the prop to be an array of items.', _key, JSON.stringify(item), fragment.name) : invariant(false) : void 0;

        if (owners != null) {
          var _owner = owners[_key];
          !(_owner != null) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernSelector: Expected explcitly provided owner for ' + 'fragment `%s` under key `%s` to be defined.', fragment.name, _key) : invariant(false) : void 0;
          !!Array.isArray(_owner) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernSelector: Expected explcitly provided owner for ' + 'fragment `%s` under key `%s` not to be an array, got `%s`.', fragment.name, _key, JSON.stringify(_owner)) : invariant(false) : void 0;
          selectors[_key] = getSelector(operationVariables, fragment, item, _owner);
        } else {
          selectors[_key] = getSelector(operationVariables, fragment, item);
        }
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

      if (item == null) {
        ids[_key2] = item;
      } else if (fragment.metadata && fragment.metadata.plural === true) {
        !Array.isArray(item) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernSelector: Expected value for key `%s` to be an array, got `%s`. ' + 'Remove `@relay(plural: true)` from fragment `%s` to allow the prop to be an object.', _key2, JSON.stringify(item), fragment.name) : invariant(false) : void 0;
        ids[_key2] = getDataIDs(fragment, item);
      } else {
        !!Array.isArray(item) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernFragmentSpecResolver: Expected value for key `%s` to be an object, got `%s`. ' + 'Add `@relay(plural: true)` to fragment `%s` to allow the prop to be an array of items.', _key2, JSON.stringify(item), fragment.name) : invariant(false) : void 0;
        ids[_key2] = getDataID(fragment, item);
      }
    }
  }

  return ids;
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

      if (item == null) {
        continue;
      } else if (fragment.metadata && fragment.metadata.plural === true) {
        !Array.isArray(item) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernSelector: Expected value for key `%s` to be an array, got `%s`. ' + 'Remove `@relay(plural: true)` from fragment `%s` to allow the prop to be an object.', _key3, JSON.stringify(item), fragment.name) : invariant(false) : void 0;

        if (owners != null) {
          var owner = owners[_key3];
          !Array.isArray(owner) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernSelector: Expected explcitly provided owner for ' + 'fragment `%s` under key `%s` to be an array, got `%s`.', fragment.name, _key3, JSON.stringify(owner)) : invariant(false) : void 0;
          var itemVariables = getVariablesFromList(operationVariables, fragment, item, owner);
          Object.assign(variables, itemVariables);
        } else {
          var _itemVariables = getVariablesFromList(operationVariables, fragment, item);

          Object.assign(variables, _itemVariables);
        }
      } else {
        !!Array.isArray(item) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernFragmentSpecResolver: Expected value for key `%s` to be an object, got `%s`. ' + 'Add `@relay(plural: true)` to fragment `%s` to allow the prop to be an array of items.', _key3, JSON.stringify(item), fragment.name) : invariant(false) : void 0;

        if (owners != null) {
          var _owner2 = owners[_key3];
          !(_owner2 != null) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernSelector: Expected explcitly provided owner for ' + 'fragment `%s` under key `%s` to be defined.', fragment.name, _key3) : invariant(false) : void 0;
          !!Array.isArray(_owner2) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernSelector: Expected explcitly provided owner for ' + 'fragment `%s` under key `%s` not to be an array, got `%s`.', fragment.name, _key3, JSON.stringify(_owner2)) : invariant(false) : void 0;

          var _itemVariables2 = getVariables(operationVariables, fragment, item, _owner2);

          if (_itemVariables2) {
            Object.assign(variables, _itemVariables2);
          }
        } else {
          var _itemVariables3 = getVariables(operationVariables, fragment, item);

          if (_itemVariables3) {
            Object.assign(variables, _itemVariables3);
          }
        }
      }
    }
  }

  return variables;
}
/**
 * @internal
 */


function getVariables(operationVariables, fragment, item, owner) {
  var ownedSelector = getSelector(operationVariables, fragment, item, owner);

  if (!ownedSelector) {
    return null;
  }

  return ownedSelector.selector.variables;
}
/**
 * @internal
 */


function getVariablesFromList(operationVariables, fragment, items, owners) {
  var variables = {};
  items.forEach(function (value, ii) {
    if (value != null) {
      var owner = owners != null ? owners[ii] : null;
      var itemVariables = getVariables(operationVariables, fragment, value, owner);

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
  // NOTE: areEqualSelectors temporarily ignores fragment ownership when
  // comparing selectors, to preserve current behavior of RelayFragmentSpecResolver
  // TODO(T39494051)
  return thisSelector.selector.dataID === thatSelector.selector.dataID && thisSelector.selector.node === thatSelector.selector.node && areEqual(thisSelector.selector.variables, thatSelector.selector.variables);
}

module.exports = {
  areEqualSelectors: areEqualSelectors,
  getDataIDsFromObject: getDataIDsFromObject,
  getSelector: getSelector,
  getSelectorList: getSelectorList,
  getSelectorsFromObject: getSelectorsFromObject,
  getVariablesFromObject: getVariablesFromObject
};