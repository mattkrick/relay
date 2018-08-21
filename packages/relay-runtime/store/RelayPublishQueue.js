/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const ErrorUtils = require('ErrorUtils');
const RelayInMemoryRecordSource = require('./RelayInMemoryRecordSource');
const RelayReader = require('./RelayReader');
const RelayRecordSourceMutator = require('../mutations/RelayRecordSourceMutator');
const RelayRecordSourceProxy = require('../mutations/RelayRecordSourceProxy');
const RelayRecordSourceSelectorProxy = require('../mutations/RelayRecordSourceSelectorProxy');

const invariant = require('invariant');
const normalizeRelayPayload = require('./normalizeRelayPayload');

import type {HandlerProvider} from '../handlers/RelayDefaultHandlerProvider';
import type {Disposable} from '../util/RelayRuntimeTypes';
import type {
  HandleFieldPayload,
  MutableRecordSource,
  OperationSelector,
  OptimisticUpdate,
  RecordSource,
  RelayResponsePayload,
  SelectorStoreUpdater,
  Store,
  StoreUpdater,
} from './RelayStoreTypes';
import type {SelectorData} from 'react-relay/classic/environment/RelayCombinedEnvironmentTypes';

type Payload = {
  fieldPayloads: ?Array<HandleFieldPayload>,
  operation: OperationSelector,
  source: MutableRecordSource,
  updater: ?SelectorStoreUpdater,
};

type DataToCommit =
  | {
      kind: 'client',
      updater: StoreUpdater,
    }
  | {
      kind: 'optimistic',
      updater: OptimisticUpdate,
    }
  | {
      kind: 'payload',
      payload: Payload,
    }
  | {
      kind: 'source',
      source: RecordSource,
    };

/**
 * Coordinates the concurrent modification of a `Store`
 * due to client, server, and optimistic updates
 * - Applies updates linearly
 * - Executes handlers for "handle" fields
 * - Rebases whenever an optimistic update is committed or reverted
 */

class RelayPublishQueue {
  _store: Store;
  _handlerProvider: ?HandlerProvider;

  // A "negative" of all applied updaters. It can be published to the store to
  // undo them in order to re-apply
  _backup: MutableRecordSource;
  // The index of the most recent update applied to the backup to achieve the
  // current store state
  _currentStoreIdx: number;
  // Garbage collection hold, should rerun gc on dispose
  _gcHold: ?Disposable;
  // True if the next `run()` should apply the backup and rerun all updates
  // performing a rebase.
  _pendingBackupRebase: boolean;
  // All the updates to be processed in order. Updates before the first
  // `optimistic` are committed. The rest are applied and logged to the backup
  // in the event of a revert.
  _pendingUpdates: Array<DataToCommit>;

  constructor(store: Store, handlerProvider?: ?HandlerProvider) {
    this._backup = new RelayInMemoryRecordSource();
    this._currentStoreIdx = 0;
    this._gcHold = null;
    this._handlerProvider = handlerProvider || null;
    this._pendingBackupRebase = false;
    this._pendingUpdates = [];
    this._store = store;
  }

  /**
   * Schedule applying an optimistic updates on the next `run()`.
   */
  applyUpdate(updater: OptimisticUpdate): void {
    invariant(
      findUpdaterIdx(this._pendingUpdates, updater) === -1,
      'RelayPublishQueue: Cannot apply the same update function more than ' +
        'once concurrently.',
    );
    this._pendingUpdates.push({kind: 'optimistic', updater});
  }

  /**
   * Schedule reverting an optimistic updates on the next `run()`.
   */
  revertUpdate(updater: OptimisticUpdate): void {
    const updateIdx = findUpdaterIdx(this._pendingUpdates, updater);
    if (updateIdx !== -1) {
      this._pendingBackupRebase = true;
      this._pendingUpdates.splice(updateIdx, 1);
    }
  }

  /**
   * Schedule a revert of all optimistic updates on the next `run()`.
   */
  revertAll(): void {
    this._pendingBackupRebase = true;
    this._pendingUpdates = this._pendingUpdates.filter(
      update => update.kind !== 'optimistic',
    );
  }

  /**
   * Schedule applying a payload to the store on the next `run()`.
   * If provided, this will revert the corresponding optimistic update
   */
  commitPayload(
    operation: OperationSelector,
    {fieldPayloads, source}: RelayResponsePayload,
    updater?: ?SelectorStoreUpdater,
    optimisticUpdate?: OptimisticUpdate,
  ): void {
    const serverData = {
      kind: 'payload',
      payload: {fieldPayloads, operation, source, updater},
    };
    if (optimisticUpdate) {
      const updateIdx = findUpdaterIdx(this._pendingUpdates, optimisticUpdate);
      if (updateIdx !== -1) {
        this._pendingBackupRebase = true;
        this._pendingUpdates.splice(updateIdx, 1, serverData);
        return;
      }
    }
    this._pendingUpdates.push(serverData);
  }

  /**
   * Schedule an updater to mutate the store on the next `run()` typically to
   * update client schema fields.
   */
  commitUpdate(updater: StoreUpdater): void {
    this._pendingUpdates.push({
      kind: 'client',
      updater,
    });
  }

  /**
   * Schedule a publish to the store from the provided source on the next
   * `run()`. As an example, to update the store with substituted fields that
   * are missing in the store.
   */
  commitSource(source: RecordSource): void {
    this._pendingUpdates.push({kind: 'source', source});
  }

  /**
   * Execute all queued up operations from the other public methods.
   * There is a single queue for all updates to guarantee linearizability
   */
  run(): void {
    if (this._pendingBackupRebase) {
      this._currentStoreIdx = 0;
      if (this._backup.size()) {
        this._store.publish(this._backup);
      }
    }
    this._commitPendingUpdates();
    this._applyPendingUpdates();

    this._pendingBackupRebase = false;
    this._currentStoreIdx = this._pendingUpdates.length;
    this._store.notify();
  }

  _applyPendingUpdates() {
    if (this._currentStoreIdx < this._pendingUpdates.length) {
      const updates = this._pendingUpdates.slice(this._currentStoreIdx);
      this._handleUpdates(updates);
      this._gcHold = this._store.holdGC();
    } else if (this._gcHold) {
      this._gcHold.dispose();
      this._gcHold = null;
    }
  }

  _commitPendingUpdates() {
    const firstOptimisticIdx = this._pendingUpdates.findIndex(
      ({kind}) => kind === 'optimistic',
    );
    const endIdx =
      firstOptimisticIdx === -1
        ? this._pendingUpdates.length
        : firstOptimisticIdx;
    if (endIdx > 0) {
      const updatesToCommit = this._pendingUpdates.splice(0, endIdx);
      this._handleUpdates(updatesToCommit, true);
      this._backup.clear();
    }
  }

  _handleUpdates(updates, isCommit) {
    const sink = new RelayInMemoryRecordSource();
    const mutator = new RelayRecordSourceMutator(
      this._store.getSource(),
      sink,
      isCommit ? undefined : this._backup,
    );
    const store = new RelayRecordSourceProxy(mutator, this._handlerProvider);
    for (let ii = 0; ii < updates.length; ii++) {
      const update = updates[ii];
      switch (update.kind) {
        case 'client':
          ErrorUtils.applyWithGuard(
            update.updater,
            null,
            [store],
            null,
            'RelayPublishQueue:applyUpdates',
          );
          break;
        case 'optimistic':
          applyOptimisticUpdate(update.updater, store);
          break;
        case 'payload':
          applyServerPayloadUpdate(update.payload, store);
          break;
        case 'source':
          store.publishSource(update.source);
          break;
      }
    }
    this._store.publish(sink);
  }
}

function applyOptimisticUpdate(optimisticUpdate, store) {
  if (optimisticUpdate.operation) {
    const {selectorStoreUpdater, operation, response} = optimisticUpdate;

    if (response) {
      const {source, fieldPayloads} = normalizeRelayPayload(
        operation.root,
        response,
      );
      store.publishSource(source, fieldPayloads);
      if (selectorStoreUpdater) {
        const selectorData = lookupSelector(source, operation.fragment);
        const selectorStore = new RelayRecordSourceSelectorProxy(
          store,
          operation.fragment,
        );
        ErrorUtils.applyWithGuard(
          selectorStoreUpdater,
          null,
          [selectorStore, selectorData],
          null,
          'RelayPublishQueue:applyUpdates',
        );
      }
    } else {
      const selectorStore = new RelayRecordSourceSelectorProxy(
        store,
        operation.fragment,
      );
      ErrorUtils.applyWithGuard(
        selectorStoreUpdater,
        null,
        [selectorStore],
        null,
        'RelayPublishQueue:applyUpdates',
      );
    }
  } else if (optimisticUpdate.storeUpdater) {
    const {storeUpdater} = optimisticUpdate;
    ErrorUtils.applyWithGuard(
      storeUpdater,
      null,
      [store],
      null,
      'RelayPublishQueue:applyUpdates',
    );
  } else {
    const {source, fieldPayloads} = optimisticUpdate;
    store.publishSource(source, fieldPayloads);
  }
}

function applyServerPayloadUpdate(payload: Payload, store): void {
  const {fieldPayloads, operation, source, updater} = payload;
  store.publishSource(source, fieldPayloads);
  const selectorStore = new RelayRecordSourceSelectorProxy(
    store,
    operation.fragment,
  );
  if (updater) {
    const selectorData = lookupSelector(source, operation.fragment);
    updater(selectorStore, selectorData);
  }
}

function findUpdaterIdx(
  updates: Array<DataToCommit>,
  updater: StoreUpdater | OptimisticUpdate,
): number {
  // $FlowFixMe
  return updates.findIndex(update => update.updater === updater);
}

function lookupSelector(source, selector): ?SelectorData {
  const selectorData = RelayReader.read(source, selector).data;
  if (__DEV__) {
    const deepFreeze = require('../util/deepFreeze');
    if (selectorData) {
      deepFreeze(selectorData);
    }
  }
  return selectorData;
}

module.exports = RelayPublishQueue;
