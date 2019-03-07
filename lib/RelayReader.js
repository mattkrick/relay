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

var RelayModernRecord = require("./RelayModernRecord");

var invariant = require("fbjs/lib/invariant");

var _require = require("./RelayConcreteNode"),
    CONDITION = _require.CONDITION,
    FRAGMENT_SPREAD = _require.FRAGMENT_SPREAD,
    INLINE_FRAGMENT = _require.INLINE_FRAGMENT,
    LINKED_FIELD = _require.LINKED_FIELD,
    MATCH_FIELD = _require.MATCH_FIELD,
    SCALAR_FIELD = _require.SCALAR_FIELD;

var _require2 = require("./RelayStoreUtils"),
    FRAGMENTS_KEY = _require2.FRAGMENTS_KEY,
    FRAGMENT_OWNER_KEY = _require2.FRAGMENT_OWNER_KEY,
    FRAGMENT_PROP_NAME_KEY = _require2.FRAGMENT_PROP_NAME_KEY,
    ID_KEY = _require2.ID_KEY,
    MATCH_COMPONENT_KEY = _require2.MATCH_COMPONENT_KEY,
    MODULE_KEY = _require2.MODULE_KEY,
    getArgumentValues = _require2.getArgumentValues,
    getStorageKey = _require2.getStorageKey;

function read(recordSource, selector, owner) {
  var _owner;

  var dataID = selector.dataID,
      node = selector.node,
      variables = selector.variables;
  var reader = new RelayReader(recordSource, variables, (_owner = owner) !== null && _owner !== void 0 ? _owner : null);
  return reader.read(node, dataID);
}
/**
 * @private
 */


var RelayReader =
/*#__PURE__*/
function () {
  function RelayReader(recordSource, variables, owner) {
    this._recordSource = recordSource;
    this._seenRecords = {};
    this._isMissingData = false;
    this._variables = variables;
    this._owner = owner;
  }

  var _proto = RelayReader.prototype;

  _proto.read = function read(node, dataID) {
    var data = this._traverse(node, dataID, null);

    return {
      data: data,
      dataID: dataID,
      node: node,
      seenRecords: this._seenRecords,
      variables: this._variables,
      isMissingData: this._isMissingData,
      owner: this._owner
    };
  };

  _proto._traverse = function _traverse(node, dataID, prevData) {
    var record = this._recordSource.get(dataID);

    this._seenRecords[dataID] = record;

    if (record == null) {
      if (record === undefined) {
        this._isMissingData = true;
      }

      return record;
    }

    var data = prevData || {};

    this._traverseSelections(node.selections, record, data);

    return data;
  };

  _proto._getVariableValue = function _getVariableValue(name) {
    !this._variables.hasOwnProperty(name) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayReader(): Undefined variable `%s`.', name) : invariant(false) : void 0;
    return this._variables[name];
  };

  _proto._traverseSelections = function _traverseSelections(selections, record, data) {
    var _this = this;

    selections.forEach(function (selection) {
      if (selection.kind === SCALAR_FIELD) {
        _this._readScalar(selection, record, data);
      } else if (selection.kind === LINKED_FIELD) {
        if (selection.plural) {
          _this._readPluralLink(selection, record, data);
        } else {
          _this._readLink(selection, record, data);
        }
      } else if (selection.kind === CONDITION) {
        var conditionValue = _this._getVariableValue(selection.condition);

        if (conditionValue === selection.passingValue) {
          _this._traverseSelections(selection.selections, record, data);
        }
      } else if (selection.kind === INLINE_FRAGMENT) {
        var typeName = RelayModernRecord.getType(record);

        if (typeName != null && typeName === selection.type) {
          _this._traverseSelections(selection.selections, record, data);
        }
      } else if (selection.kind === FRAGMENT_SPREAD) {
        _this._createFragmentPointer(selection, record, data, _this._variables);
      } else if (selection.kind === MATCH_FIELD) {
        _this._readMatchField(selection, record, data);
      } else {
        !false ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayReader(): Unexpected ast kind `%s`.', selection.kind) : invariant(false) : void 0;
      }
    });
  };

  _proto._readScalar = function _readScalar(field, record, data) {
    var _field$alias;

    var applicationName = (_field$alias = field.alias) !== null && _field$alias !== void 0 ? _field$alias : field.name;
    var storageKey = getStorageKey(field, this._variables);
    var value = RelayModernRecord.getValue(record, storageKey);

    if (value === undefined) {
      this._isMissingData = true;
    }

    data[applicationName] = value;
  };

  _proto._readLink = function _readLink(field, record, data) {
    var _field$alias2;

    var applicationName = (_field$alias2 = field.alias) !== null && _field$alias2 !== void 0 ? _field$alias2 : field.name;
    var storageKey = getStorageKey(field, this._variables);
    var linkedID = RelayModernRecord.getLinkedRecordID(record, storageKey);

    if (linkedID == null) {
      data[applicationName] = linkedID;

      if (linkedID === undefined) {
        this._isMissingData = true;
      }

      return;
    }

    var prevData = data[applicationName];
    !(prevData == null || typeof prevData === 'object') ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayReader(): Expected data for field `%s` on record `%s` ' + 'to be an object, got `%s`.', applicationName, RelayModernRecord.getDataID(record), prevData) : invariant(false) : void 0;
    data[applicationName] = this._traverse(field, linkedID, prevData);
  };

  _proto._readPluralLink = function _readPluralLink(field, record, data) {
    var _this2 = this;

    var _field$alias3;

    var applicationName = (_field$alias3 = field.alias) !== null && _field$alias3 !== void 0 ? _field$alias3 : field.name;
    var storageKey = getStorageKey(field, this._variables);
    var linkedIDs = RelayModernRecord.getLinkedRecordIDs(record, storageKey);

    if (linkedIDs == null) {
      data[applicationName] = linkedIDs;

      if (linkedIDs === undefined) {
        this._isMissingData = true;
      }

      return;
    }

    var prevData = data[applicationName];
    !(prevData == null || Array.isArray(prevData)) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayReader(): Expected data for field `%s` on record `%s` ' + 'to be an array, got `%s`.', applicationName, RelayModernRecord.getDataID(record), prevData) : invariant(false) : void 0;
    var linkedArray = prevData || [];
    linkedIDs.forEach(function (linkedID, nextIndex) {
      if (linkedID == null) {
        if (linkedID === undefined) {
          _this2._isMissingData = true;
        }

        linkedArray[nextIndex] = linkedID;
        return;
      }

      var prevItem = linkedArray[nextIndex];
      !(prevItem == null || typeof prevItem === 'object') ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayReader(): Expected data for field `%s` on record `%s` ' + 'to be an object, got `%s`.', applicationName, RelayModernRecord.getDataID(record), prevItem) : invariant(false) : void 0;
      linkedArray[nextIndex] = _this2._traverse(field, linkedID, prevItem);
    });
    data[applicationName] = linkedArray;
  };
  /**
   * Reads a ReaderMatchField, which was generated from using the @match
   * directive
   */


  _proto._readMatchField = function _readMatchField(field, record, data) {
    var _field$alias4;

    var applicationName = (_field$alias4 = field.alias) !== null && _field$alias4 !== void 0 ? _field$alias4 : field.name;
    var storageKey = getStorageKey(field, this._variables);
    var linkedID = RelayModernRecord.getLinkedRecordID(record, storageKey);

    if (linkedID == null) {
      data[applicationName] = linkedID;

      if (linkedID === undefined) {
        this._isMissingData = true;
      }

      return;
    }

    var prevData = data[applicationName];
    !(prevData == null || typeof prevData === 'object') ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayReader(): Expected data for field `%s` on record `%s` ' + 'to be an object, got `%s`.', applicationName, RelayModernRecord.getDataID(record), prevData) : invariant(false) : void 0; // Instead of recursing into the traversal again, let's manually traverse
    // one level to get the record associated with the match field

    var linkedRecord = this._recordSource.get(linkedID);

    this._seenRecords[linkedID] = linkedRecord;

    if (linkedRecord == null) {
      if (linkedRecord === undefined) {
        this._isMissingData = true;
      }

      data[applicationName] = linkedRecord;
      return;
    } // Determine the concrete type for the match field record. The type of a
    // match field must be a union type (i.e. abstract type), so here we
    // read the concrete type on the record, which should be the type resolved
    // by the server in the response.


    var concreteType = RelayModernRecord.getType(linkedRecord);
    !(typeof concreteType === 'string') ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayReader(): Expected to be able to resolve concrete type for ' + 'field `%s` on record `%s`', applicationName, RelayModernRecord.getDataID(linkedRecord)) : invariant(false) : void 0; // If we can't find a match provided in the directive for the concrete
    // type, return null as the result

    var match = field.matchesByType[concreteType];

    if (match == null) {
      data[applicationName] = null;
      return;
    } // Determine the component module from the store: if the field is missing
    // it means we don't know what component to render the match with.


    var matchComponent = RelayModernRecord.getValue(linkedRecord, MATCH_COMPONENT_KEY);

    if (matchComponent == null) {
      if (matchComponent === undefined) {
        this._isMissingData = true;
      }

      data[applicationName] = null;
      return;
    } // Otherwise, read the fragment and module associated to the concrete
    // type, and put that data with the result:
    // - For the matched fragment, create the relevant fragment pointer and add
    //   the expected fragmentPropName
    // - For the matched module, create a reference to the module


    var matchResult = {};

    this._createFragmentPointer({
      kind: 'FragmentSpread',
      name: match.fragmentName,
      args: null
    }, linkedRecord, matchResult, this._variables);

    matchResult[FRAGMENT_PROP_NAME_KEY] = match.fragmentPropName;
    matchResult[MODULE_KEY] = matchComponent; // Attach the match result to the data being read

    data[applicationName] = matchResult;
  };

  _proto._createFragmentPointer = function _createFragmentPointer(fragmentSpread, record, data, variables) {
    var fragmentPointers = data[FRAGMENTS_KEY];

    if (fragmentPointers == null) {
      fragmentPointers = data[FRAGMENTS_KEY] = {};
    }

    !(typeof fragmentPointers === 'object' && fragmentPointers) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayReader: Expected fragment spread data to be an object, got `%s`.', fragmentPointers) : invariant(false) : void 0;

    if (data[ID_KEY] == null) {
      data[ID_KEY] = RelayModernRecord.getDataID(record);
    }

    fragmentPointers[fragmentSpread.name] = fragmentSpread.args ? getArgumentValues(fragmentSpread.args, variables) : {};
    data[FRAGMENT_OWNER_KEY] = this._owner;
  };

  return RelayReader;
}();

module.exports = {
  read: read
};