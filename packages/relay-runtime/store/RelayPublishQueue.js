/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const RelayInMemoryRecordSource = require('RelayInMemoryRecordSource');
const RelayReader = require('RelayReader');
const RelayRecordSourceMutator = require('RelayRecordSourceMutator');
const RelayRecordSourceProxy = require('RelayRecordSourceProxy');
const RelayRecordSourceSelectorProxy = require('RelayRecordSourceSelectorProxy');

const invariant = require('invariant');
const normalizeRelayPayload = require('normalizeRelayPayload');

import type {HandlerProvider} from 'RelayDefaultHandlerProvider';
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
} from 'RelayStoreTypes';
import type {SelectorData} from 'react-relay/classic/environment/RelayCombinedEnvironmentTypes';

type Payload = {
  fieldPayloads: ?Array<HandleFieldPayload>,
  operation: OperationSelector,
  source: MutableRecordSource,
  updater: ?SelectorStoreUpdater,
};

type DataToCommit =
  | {
  type: 'client',
  updater: StoreUpdater
}
  | {
  type: 'optimistic',
  updater: OptimisticUpdate
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
  // True if the next `run()` should publish to the store
  // even if no changes to the sink has been made. Useful for queries.
  _forcePublish: boolean;
  // True if the next `run()` should apply the backup and rerun all updates
  // performing a rebase.
  _pendingBackupRebase: boolean;
  // All the pending updates, starting with the first optimistic updater
  // that is awaiting a server response
  _pendingUpdates: Array<DataToCommit>;

  constructor(store: Store, handlerProvider?: ?HandlerProvider) {
    this._backup = new RelayInMemoryRecordSource();
    this._currentStoreIdx = 0;
    this._forcePublish = false;
    this._handlerProvider = handlerProvider || null;
    this._pendingBackupRebase = false;
    this._pendingUpdates = [];
    this._store = store;
  }

  /**
   * Schedule applying an optimistic updates on the next `run()`.
   */
  applyUpdate(updater: OptimisticUpdate): void {
    invariant(findUpdaterIdx(this._pendingUpdates, updater) === -1,
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
    this._pendingUpdates = this._pendingUpdates
      .filter((update) => update.kind !== 'optimistic');
  }

  /**
   * Schedule applying a payload to the store on the next `run()`.
   * If provided, this will revert the corresponding optimistic update
   */
  commitPayload(
    operation: OperationSelector,
    {fieldPayloads, source}: RelayResponsePayload,
    updater?: ?SelectorStoreUpdater,
    optimisticUpdate: OptimisticUpdate,
  ): void {
    const serverData = {
      kind: 'payload',
      payload: {fieldPayloads, operation, source, updater},
    };
    let spliceIdx = this._pendingUpdates.length;
    if (optimisticUpdate) {
      const updateIdx = findUpdaterIdx(this._pendingUpdates, updater);
      if (updateIdx !== -1) {
        spliceIdx = updateIdx;
        this._pendingBackupRebase = true;
        this._pendingUpdates.splice(spliceIdx, 1, serverData);
        return;
      }
    }
    this._pendingUpdates.push(serverData);
    this._forcePublish = true;
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
    const sink = new RelayInMemoryRecordSource();
    if (this._pendingBackupRebase) {
      this._currentStoreIdx = 0;
      if (this._backup.size() || this._currentStoreIdx > 0) {
        this._store.publish(this._backup);
      }
    }
    this._commitPendingUpdates(sink);
    this._applyPendingUpdates(sink);

    if (this._sink.size() || this._forcePublish) {
      this._store.publish(this._sink);
      this._forcePublish = false;
    }
    this._pendingBackupRebase = false;
    this._currentStoreIdx = this._pendingUpdates.length;
    this._store.notify();
  }

  _applyPendingUpdates(sink) {
    const updates = this._pendingUpdates.slice(this._currentStoreIdx);
    const store = this._makeStore(sink);
    handleUpdates(updates, store);
  }

  _commitPendingUpdates(sink) {
    const firstOptimisticIdx = this._pendingUpdates
      .findIndex((update) => update.kind === 'optimistic');
    const endIdx = firstOptimisticIdx === -1 ? this._pendingUpdates.length : firstOptimisticIdx;
    const updatesToCommit = this._pendingUpdates.splice(0, endIdx);
    if (updatesToCommit.length) {
      const store = this._makeStore(sink, true);
      handleUpdates(updatesToCommit, store);
      this._backup = new RelayInMemoryRecordSource();
    }
  }

  _makeStore(sink, isCommit) {
    const mutator = new RelayRecordSourceMutator(
      this._store.getSource(),
      sink,
      isCommit ? undefined : this._backup,
    );
    return new RelayRecordSourceProxy(mutator, this._handlerProvider);
  }
}

function applyOptimisticUpdate(optimisticUpdate, store) {
  if (optimisticUpdate.operation) {
    const {
      selectorStoreUpdater,
      operation,
      response,
    } = optimisticUpdate;

    if (response) {
      const {source, fieldPayloads} = normalizeRelayPayload(
        operation.root,
        response,
      );
      store.publishSource(source, fieldPayloads);
      if (selectorStoreUpdater) {
        const selectorData = lookupSelector(source, operation.fragment);
        const selectorStore =
          new RelayRecordSourceSelectorProxy(store, operation.fragment);
        selectorStoreUpdater(selectorStore, selectorData);
      }
    } else {
      const selectorStore =
        new RelayRecordSourceSelectorProxy(store, operation.fragment);
      selectorStoreUpdater(selectorStore);
    }
  } else if (optimisticUpdate.storeUpdater) {
    const {storeUpdater} = optimisticUpdate;
    storeUpdater(store);
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
  return updates.findIndex((update) => update.updater === updater);
}

function handleUpdates(updates, store) {
  for (let ii = 0; ii < updates.length; ii++) {
    const update = updates[ii];
    const {kind, updater, payload, source} = update;
    switch (kind) {
      case 'client':
        updater(store);
        break;
      case 'optimistic':
        applyOptimisticUpdate(updater, store);
        break;
      case 'payload':
        applyServerPayloadUpdate(payload, store);
        break;
      case 'source':
        store.publishSource(source);
        break;
    }
  }
}

function lookupSelector(source, selector): ?SelectorData {
  const selectorData = RelayReader.read(source, selector).data;
  if (__DEV__) {
    const deepFreeze = require('deepFreeze');
    if (selectorData) {
      deepFreeze(selectorData);
    }
  }
  return selectorData;
}

module.exports = RelayPublishQueue;
