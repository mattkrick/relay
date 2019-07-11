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

var RelayModernRecord = require("./RelayModernRecord");

var invariant = require("fbjs/lib/invariant");

var _require = require("./RelayConcreteNode"),
    CONDITION = _require.CONDITION,
    CLIENT_EXTENSION = _require.CLIENT_EXTENSION,
    CONNECTION_FIELD = _require.CONNECTION_FIELD,
    FRAGMENT_SPREAD = _require.FRAGMENT_SPREAD,
    INLINE_DATA_FRAGMENT_SPREAD = _require.INLINE_DATA_FRAGMENT_SPREAD,
    INLINE_FRAGMENT = _require.INLINE_FRAGMENT,
    LINKED_FIELD = _require.LINKED_FIELD,
    MODULE_IMPORT = _require.MODULE_IMPORT,
    SCALAR_FIELD = _require.SCALAR_FIELD;

var _require2 = require("./RelayConcreteVariables"),
    getFragmentVariables = _require2.getFragmentVariables;

var _require3 = require("./RelayStoreUtils"),
    FRAGMENTS_KEY = _require3.FRAGMENTS_KEY,
    FRAGMENT_OWNER_KEY = _require3.FRAGMENT_OWNER_KEY,
    FRAGMENT_PROP_NAME_KEY = _require3.FRAGMENT_PROP_NAME_KEY,
    ID_KEY = _require3.ID_KEY,
    MODULE_COMPONENT_KEY = _require3.MODULE_COMPONENT_KEY,
    getArgumentValues = _require3.getArgumentValues,
    getStorageKey = _require3.getStorageKey,
    getModuleComponentKey = _require3.getModuleComponentKey;

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
    for (var i = 0; i < selections.length; i++) {
      var selection = selections[i];

      switch (selection.kind) {
        case SCALAR_FIELD:
          this._readScalar(selection, record, data);

          break;

        case LINKED_FIELD:
          if (selection.plural) {
            this._readPluralLink(selection, record, data);
          } else {
            this._readLink(selection, record, data);
          }

          break;

        case CONDITION:
          var conditionValue = this._getVariableValue(selection.condition);

          if (conditionValue === selection.passingValue) {
            this._traverseSelections(selection.selections, record, data);
          }

          break;

        case INLINE_FRAGMENT:
          var typeName = RelayModernRecord.getType(record);

          if (typeName != null && typeName === selection.type) {
            this._traverseSelections(selection.selections, record, data);
          }

          break;

        case FRAGMENT_SPREAD:
          this._createFragmentPointer(selection, record, data);

          break;

        case MODULE_IMPORT:
          this._readModuleImport(selection, record, data);

          break;

        case INLINE_DATA_FRAGMENT_SPREAD:
          this._createInlineDataFragmentPointer(selection, record, data);

          break;

        case CLIENT_EXTENSION:
          var isMissingData = this._isMissingData;

          this._traverseSelections(selection.selections, record, data);

          this._isMissingData = isMissingData;
          break;

        case CONNECTION_FIELD:
          !false ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayReader(): Connection fields are not supported yet.') : invariant(false) : void 0; // $FlowExpectedError - we need the break; for OSS linter

          break;

        default:
          selection;
          !false ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayReader(): Unexpected ast kind `%s`.', selection.kind) : invariant(false) : void 0;
      }
    }
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
    /* $FlowFixMe(>=0.98.0 site=www,mobile,react_native_fb,oss) This comment
     * suppresses an error found when Flow v0.98 was deployed. To see the error
     * delete this comment and run Flow. */

    data[applicationName] = this._traverse(field, linkedID, prevData);
  };

  _proto._readPluralLink = function _readPluralLink(field, record, data) {
    var _this = this;

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
          _this._isMissingData = true;
        }
        /* $FlowFixMe(>=0.98.0 site=www,mobile,react_native_fb,oss) This comment
         * suppresses an error found when Flow v0.98 was deployed. To see the
         * error delete this comment and run Flow. */


        linkedArray[nextIndex] = linkedID;
        return;
      }

      var prevItem = linkedArray[nextIndex];
      !(prevItem == null || typeof prevItem === 'object') ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayReader(): Expected data for field `%s` on record `%s` ' + 'to be an object, got `%s`.', applicationName, RelayModernRecord.getDataID(record), prevItem) : invariant(false) : void 0;
      /* $FlowFixMe(>=0.98.0 site=www,mobile,react_native_fb,oss) This comment
       * suppresses an error found when Flow v0.98 was deployed. To see the
       * error delete this comment and run Flow. */

      linkedArray[nextIndex] = _this._traverse(field, linkedID, prevItem);
    });
    data[applicationName] = linkedArray;
  }
  /**
   * Reads a ReaderModuleImport, which was generated from using the @module
   * directive.
   */
  ;

  _proto._readModuleImport = function _readModuleImport(moduleImport, record, data) {
    // Determine the component module from the store: if the field is missing
    // it means we don't know what component to render the match with.
    var componentKey = getModuleComponentKey(moduleImport.documentName);
    var component = RelayModernRecord.getValue(record, componentKey);

    if (component == null) {
      if (component === undefined) {
        this._isMissingData = true;
      }

      return;
    } // Otherwise, read the fragment and module associated to the concrete
    // type, and put that data with the result:
    // - For the matched fragment, create the relevant fragment pointer and add
    //   the expected fragmentPropName
    // - For the matched module, create a reference to the module


    this._createFragmentPointer({
      kind: 'FragmentSpread',
      name: moduleImport.fragmentName,
      args: null
    }, record, data);

    data[FRAGMENT_PROP_NAME_KEY] = moduleImport.fragmentPropName;
    data[MODULE_COMPONENT_KEY] = component;
  };

  _proto._createFragmentPointer = function _createFragmentPointer(fragmentSpread, record, data) {
    var fragmentPointers = data[FRAGMENTS_KEY];

    if (fragmentPointers == null) {
      fragmentPointers = data[FRAGMENTS_KEY] = {};
    }

    !(typeof fragmentPointers === 'object' && fragmentPointers != null) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayReader: Expected fragment spread data to be an object, got `%s`.', fragmentPointers) : invariant(false) : void 0;

    if (data[ID_KEY] == null) {
      data[ID_KEY] = RelayModernRecord.getDataID(record);
    } // $FlowFixMe - writing into read-only field


    fragmentPointers[fragmentSpread.name] = fragmentSpread.args ? getArgumentValues(fragmentSpread.args, this._variables) : {};
    data[FRAGMENT_OWNER_KEY] = this._owner;
  };

  _proto._createInlineDataFragmentPointer = function _createInlineDataFragmentPointer(inlineDataFragmentSpread, record, data) {
    var fragmentPointers = data[FRAGMENTS_KEY];

    if (fragmentPointers == null) {
      fragmentPointers = data[FRAGMENTS_KEY] = {};
    }

    !(typeof fragmentPointers === 'object' && fragmentPointers != null) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayReader: Expected fragment spread data to be an object, got `%s`.', fragmentPointers) : invariant(false) : void 0;

    if (data[ID_KEY] == null) {
      data[ID_KEY] = RelayModernRecord.getDataID(record);
    }

    var inlineData = {};

    this._traverseSelections(inlineDataFragmentSpread.selections, record, inlineData); // $FlowFixMe - writing into read-only field


    fragmentPointers[inlineDataFragmentSpread.name] = inlineData;
  };

  return RelayReader;
}();

module.exports = {
  read: read
};