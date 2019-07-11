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

var RelayModernRecord = require("./RelayModernRecord");

var invariant = require("fbjs/lib/invariant");

var _require = require("./RelayRecordState"),
    EXISTENT = _require.EXISTENT;

var _require2 = require("./RelayStoreUtils"),
    UNPUBLISH_FIELD_SENTINEL = _require2.UNPUBLISH_FIELD_SENTINEL,
    UNPUBLISH_RECORD_SENTINEL = _require2.UNPUBLISH_RECORD_SENTINEL;

/**
 * @internal
 *
 * Wrapper API that is an amalgam of the `RelayModernRecord` API and
 * `MutableRecordSource` interface, implementing copy-on-write semantics for
 * records in a record source. If a `backup` is supplied, the mutator will
 * ensure that the backup contains sufficient information to revert all
 * modifications by publishing the backup.
 *
 * Modifications are applied to fresh copies of records with optional backups
 * created:
 * - Records in `base` are never modified.
 * - Modifications cause a fresh version of a record to be created in `sink`.
 *   These sink records contain only modified fields.
 * - If a `backup` is supplied, any modifications to a record will cause the
 *   sink version of the record to be added to the backup.
 * - Creation of a record causes a sentinel object to be added to the backup
 *   so that the new record can be removed from the store by publishing the
 *   backup.
 */
var RelayRecordSourceMutator =
/*#__PURE__*/
function () {
  function RelayRecordSourceMutator(base, sink, backup) {
    this._backup = backup;
    this._base = base;
    this._sink = sink;
    this.__sources = [sink, base];
  }
  /**
   * **UNSTABLE**
   * This method is likely to be removed in an upcoming release
   * and should not be relied upon.
   * TODO T41593196: Remove unstable_getRawRecordWithChanges
   */


  var _proto = RelayRecordSourceMutator.prototype;

  _proto.unstable_getRawRecordWithChanges = function unstable_getRawRecordWithChanges(dataID) {
    var baseRecord = this._base.get(dataID);

    var sinkRecord = this._sink.get(dataID);

    if (sinkRecord === undefined) {
      if (baseRecord == null) {
        return baseRecord;
      }

      var nextRecord = RelayModernRecord.clone(baseRecord);

      if (process.env.NODE_ENV !== "production") {
        // Prevent mutation of a record from outside the store.
        RelayModernRecord.freeze(nextRecord);
      }

      return nextRecord;
    } else if (sinkRecord === null) {
      return null;
    } else if (sinkRecord === UNPUBLISH_RECORD_SENTINEL) {
      return undefined;
    } else if (baseRecord != null) {
      var _nextRecord = RelayModernRecord.update(baseRecord, sinkRecord);

      if (process.env.NODE_ENV !== "production") {
        if (_nextRecord !== baseRecord) {
          // Prevent mutation of a record from outside the store.
          RelayModernRecord.freeze(_nextRecord);
        }
      }

      return _nextRecord;
    } else {
      var _nextRecord2 = RelayModernRecord.clone(sinkRecord);

      if (process.env.NODE_ENV !== "production") {
        // Prevent mutation of a record from outside the store.
        RelayModernRecord.freeze(_nextRecord2);
      }

      return _nextRecord2;
    }
  };

  _proto._createBackupRecord = function _createBackupRecord(dataID) {
    var backup = this._backup;

    if (backup && !backup.has(dataID)) {
      var baseRecord = this._base.get(dataID);

      if (baseRecord != null) {
        backup.set(dataID, baseRecord);
      } else if (baseRecord === null) {
        backup["delete"](dataID);
      }
    }
  };

  _proto._setSentinelFieldsInBackupRecord = function _setSentinelFieldsInBackupRecord(dataID, record) {
    var backup = this._backup;

    if (backup) {
      var backupRecord = backup.get(dataID);

      if (backupRecord && backupRecord !== UNPUBLISH_RECORD_SENTINEL) {
        var copy = null;

        for (var key in record) {
          if (record.hasOwnProperty(key)) {
            if (!(key in backupRecord)) {
              copy = copy || (0, _objectSpread2["default"])({}, backupRecord);
              copy[key] = UNPUBLISH_FIELD_SENTINEL;
            }
          }
        }

        backup.set(dataID, copy || backupRecord);
      }
    }
  };

  _proto._setSentinelFieldInBackupRecord = function _setSentinelFieldInBackupRecord(dataID, storageKey) {
    var backup = this._backup;

    if (backup) {
      var backupRecord = backup.get(dataID);

      if (backupRecord && backupRecord !== UNPUBLISH_RECORD_SENTINEL && !(storageKey in backupRecord)) {
        var copy = (0, _objectSpread2["default"])({}, backupRecord);
        RelayModernRecord.setValue(copy, storageKey, UNPUBLISH_FIELD_SENTINEL);
        backup.set(dataID, copy);
      }
    }
  };

  _proto._getSinkRecord = function _getSinkRecord(dataID) {
    var sinkRecord = this._sink.get(dataID);

    if (!sinkRecord) {
      var baseRecord = this._base.get(dataID);

      !baseRecord ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayRecordSourceMutator: Cannot modify non-existent record `%s`.', dataID) : invariant(false) : void 0;
      sinkRecord = RelayModernRecord.create(dataID, RelayModernRecord.getType(baseRecord));

      this._sink.set(dataID, sinkRecord);
    }

    return sinkRecord;
  };

  _proto.copyFields = function copyFields(sourceID, sinkID) {
    var sinkSource = this._sink.get(sourceID);

    var baseSource = this._base.get(sourceID);

    !(sinkSource || baseSource) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayRecordSourceMutator#copyFields(): Cannot copy fields from ' + 'non-existent record `%s`.', sourceID) : invariant(false) : void 0;

    this._createBackupRecord(sinkID);

    var sink = this._getSinkRecord(sinkID);

    if (baseSource) {
      RelayModernRecord.copyFields(baseSource, sink);
    }

    if (sinkSource) {
      RelayModernRecord.copyFields(sinkSource, sink);
    }

    this._setSentinelFieldsInBackupRecord(sinkID, sink);
  };

  _proto.copyFieldsFromRecord = function copyFieldsFromRecord(record, sinkID) {
    this._createBackupRecord(sinkID);

    var sink = this._getSinkRecord(sinkID);

    RelayModernRecord.copyFields(record, sink);

    this._setSentinelFieldsInBackupRecord(sinkID, sink);
  };

  _proto.create = function create(dataID, typeName) {
    !(this._base.getStatus(dataID) !== EXISTENT && this._sink.getStatus(dataID) !== EXISTENT) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayRecordSourceMutator#create(): Cannot create a record with id ' + '`%s`, this record already exists.', dataID) : invariant(false) : void 0;

    if (this._backup) {
      this._backup.set(dataID, UNPUBLISH_RECORD_SENTINEL);
    }

    var record = RelayModernRecord.create(dataID, typeName);

    this._sink.set(dataID, record);
  };

  _proto["delete"] = function _delete(dataID) {
    this._createBackupRecord(dataID);

    this._sink["delete"](dataID);
  };

  _proto.getStatus = function getStatus(dataID) {
    return this._sink.has(dataID) ? this._sink.getStatus(dataID) : this._base.getStatus(dataID);
  };

  _proto.getType = function getType(dataID) {
    for (var ii = 0; ii < this.__sources.length; ii++) {
      var record = this.__sources[ii].get(dataID);

      if (record) {
        return RelayModernRecord.getType(record);
      } else if (record === null) {
        return null;
      }
    }
  };

  _proto.getValue = function getValue(dataID, storageKey) {
    for (var ii = 0; ii < this.__sources.length; ii++) {
      var record = this.__sources[ii].get(dataID);

      if (record) {
        var value = RelayModernRecord.getValue(record, storageKey);

        if (value !== undefined) {
          return value;
        }
      } else if (record === null) {
        return null;
      }
    }
  };

  _proto.setValue = function setValue(dataID, storageKey, value) {
    this._createBackupRecord(dataID);

    var sinkRecord = this._getSinkRecord(dataID);

    RelayModernRecord.setValue(sinkRecord, storageKey, value);

    this._setSentinelFieldInBackupRecord(dataID, storageKey);
  };

  _proto.getLinkedRecordID = function getLinkedRecordID(dataID, storageKey) {
    for (var ii = 0; ii < this.__sources.length; ii++) {
      var record = this.__sources[ii].get(dataID);

      if (record) {
        var linkedID = RelayModernRecord.getLinkedRecordID(record, storageKey);

        if (linkedID !== undefined) {
          return linkedID;
        }
      } else if (record === null) {
        return null;
      }
    }
  };

  _proto.setLinkedRecordID = function setLinkedRecordID(dataID, storageKey, linkedID) {
    this._createBackupRecord(dataID);

    var sinkRecord = this._getSinkRecord(dataID);

    RelayModernRecord.setLinkedRecordID(sinkRecord, storageKey, linkedID);

    this._setSentinelFieldInBackupRecord(dataID, storageKey);
  };

  _proto.getLinkedRecordIDs = function getLinkedRecordIDs(dataID, storageKey) {
    for (var ii = 0; ii < this.__sources.length; ii++) {
      var record = this.__sources[ii].get(dataID);

      if (record) {
        var linkedIDs = RelayModernRecord.getLinkedRecordIDs(record, storageKey);

        if (linkedIDs !== undefined) {
          return linkedIDs;
        }
      } else if (record === null) {
        return null;
      }
    }
  };

  _proto.setLinkedRecordIDs = function setLinkedRecordIDs(dataID, storageKey, linkedIDs) {
    this._createBackupRecord(dataID);

    var sinkRecord = this._getSinkRecord(dataID);

    RelayModernRecord.setLinkedRecordIDs(sinkRecord, storageKey, linkedIDs);

    this._setSentinelFieldInBackupRecord(dataID, storageKey);
  };

  return RelayRecordSourceMutator;
}();

module.exports = RelayRecordSourceMutator;