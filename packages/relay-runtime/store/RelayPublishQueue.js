/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const ErrorUtils = require('ErrorUtils');
const RelayReader = require('./RelayReader');
const RelayRecordSource = require('./RelayRecordSource');
const RelayRecordSourceMutator = require('../mutations/RelayRecordSourceMutator');
const RelayRecordSourceProxy = require('../mutations/RelayRecordSourceProxy');
const RelayRecordSourceSelectorProxy = require('../mutations/RelayRecordSourceSelectorProxy');

const invariant = require('invariant');

import type {HandlerProvider} from '../handlers/RelayDefaultHandlerProvider';
import type {Disposable} from '../util/RelayRuntimeTypes';
import type {GetDataID} from './RelayResponseNormalizer';
import type {
  MutableRecordSource,
  OperationDescriptor,
  OptimisticUpdate,
  PublishQueue,
  RecordSource,
  RelayResponsePayload,
  RequestDescriptor,
  SelectorData,
  SelectorStoreUpdater,
  SingularReaderSelector,
  Store,
  StoreUpdater,
} from './RelayStoreTypes';

type ClientPayload = {
  kind: 'client',
  updater: StoreUpdater
}

type OptimisticPayload = {
  kind: 'optimistic',
  updater: OptimisticUpdate
}

type ServerPayload = {
  kind: 'payload',
  payload: RelayResponsePayload,
  operation: OperationDescriptor,
  updater: SelectorStoreUpdater
}

type SourcePayload = {
  kind: 'source',
  source: RecordSource
}

type DataToCommit = ClientPayload | OptimisticPayload | ServerPayload | SourcePayload

/**
 * Coordinates the concurrent modification of a `Store` due to optimistic and
 * non-revertable client updates and server payloads:
 * - Applies optimistic updates.
 * - Reverts optimistic updates, rebasing any subsequent updates.
 * - Commits client updates (typically for client schema extensions).
 * - Commits server updates:
 *   - Normalizes query/mutation/subscription responses.
 *   - Executes handlers for "handle" fields.
 *   - Reverts and reapplies pending optimistic updates.
 */
class RelayPublishQueue {
  _store: Store
  _handlerProvider: HandlerProvider | null
  _getDataID: GetDataID
  // A "negative" of all applied updaters. It can be published to the store to
  // undo them in order to re-apply
  _hasStoreSnapshot: false
  // The index of the most recent update applied to the backup to achieve the
  // current store state
  _currentStoreIdx: number
  // Garbage collection hold, should rerun gc on dispose
  _gcHold: Disposable | null
  // True if the next `run()` should apply the backup and rerun all updates
  // performing a rebase.
  _pendingBackupRebase: boolean
  // All the updates to be processed in order. Updates before the first
  // `optimistic` are committed. The rest are applied and logged to the backup
  // in the event of a revert.
  _pendingUpdates: Array<DataToCommit>

  constructor (store: Store, handlerProvider: HandlerProvider | null, getDataID: GetDataID) {
    this._hasStoreSnapshot = false
    this._currentStoreIdx = 0
    this._gcHold = null
    this._getDataID = getDataID
    this._handlerProvider = handlerProvider || null
    this._pendingBackupRebase = false
    this._pendingUpdates = []
    this._store = store
  }

  /**
   * Schedule applying an optimistic updates on the next `run()`.
   */
  applyUpdate (updater: OptimisticUpdate): void {
    invariant(
      findUpdaterIdx(this._pendingUpdates, updater) === -1,
      'LinearPublishQueue: Cannot apply the same update function more than ' + 'once concurrently.'
    )
    this._pendingUpdates.push({kind: 'optimistic', updater})
  }

  /**
   * Schedule reverting an optimistic updates on the next `run()`.
   */
  revertUpdate (updater: OptimisticUpdate): void {
    const updateIdx = findUpdaterIdx(this._pendingUpdates, updater)
    if (updateIdx !== -1) {
      this._pendingBackupRebase = true
      this._pendingUpdates.splice(updateIdx, 1)
    }
  }

  /**
   * Schedule a revert of all optimistic updates on the next `run()`.
   */
  revertAll (): void {
    this._pendingBackupRebase = true
    this._pendingUpdates = this._pendingUpdates.filter((update) => update.kind !== 'optimistic')
  }

  /**
   * Schedule applying a payload to the store on the next `run()`.
   * If provided, this will revert the corresponding optimistic update
   */
  commitPayload (
    operation: OperationDescriptor,
    payload: RelayResponsePayload,
    updater?: SelectorStoreUpdater | null,
    optimisticUpdates?: OptimisticUpdate[] | null
  ): void {
    const serverData: ServerPayload = {
      kind: 'payload',
      operation,
      payload,
      updater
    }
    if (optimisticUpdates) {
      for (let ii = 0; ii < optimisticUpdates.length; ii++) {
        const optimisticUpdate = optimisticUpdates[ii]
        const updateIdx = findUpdaterIdx(this._pendingUpdates, optimisticUpdate)
        if (updateIdx !== -1) {
          this._pendingBackupRebase = true
          this._pendingUpdates.splice(updateIdx, 1)
        }
      }
    }
    this._pendingUpdates.push(serverData)
  }

  /**
   * Schedule an updater to mutate the store on the next `run()` typically to
   * update client schema fields.
   */
  commitUpdate (updater: StoreUpdater): void {
    this._pendingUpdates.push({
      kind: 'client',
      updater
    })
  }

  /**
   * Schedule a publish to the store from the provided source on the next
   * `run()`. As an example, to update the store with substituted fields that
   * are missing in the store.
   */
  commitSource (source: RecordSource): void {
    this._pendingUpdates.push({kind: 'source', source})
  }

  /**
   * Execute all queued up operations from the other public methods.
   * There is a single queue for all updates to guarantee linearizability
   */
  run () {
    if (this._pendingBackupRebase) {
      this._currentStoreIdx = 0
      if (this._hasStoreSnapshot) {
        this._store.restore()
        this._hasStoreSnapshot = false
      }
    }
    this._commitPendingUpdates()
    this._applyPendingUpdates()

    this._pendingBackupRebase = false
    this._currentStoreIdx = this._pendingUpdates.length
    return this._store.notify()
  }

  _applyPendingUpdates () {
    if (this._currentStoreIdx < this._pendingUpdates.length) {
      const updates = this._pendingUpdates.slice(this._currentStoreIdx)
      this._handleUpdates(updates)
      if (!this._gcHold) {
        this._gcHold = this._store.holdGC()
      }
    } else if (this._gcHold && this._pendingUpdates.length === 0) {
      this._gcHold.dispose()
      this._gcHold = null
    }
  }

  _commitPendingUpdates () {
    const firstOptimisticIdx = this._pendingUpdates.findIndex(({kind}) => kind === 'optimistic')
    const endIdx = firstOptimisticIdx === -1 ? this._pendingUpdates.length : firstOptimisticIdx
    if (endIdx > 0) {
      const updatesToCommit = this._pendingUpdates.splice(0, endIdx)
      this._handleUpdates(updatesToCommit, true)
    }
  }

  _handleUpdates (updates: DataToCommit[], final?: boolean) {
    if (!final && !this._hasStoreSnapshot) {
      this._store.snapshot()
      this._hasStoreSnapshot = true
    }
    const sink = RelayRecordSource.create()
    const combinedConnectionEvents = []
    const mutator = new RelayRecordSourceMutator(
      this._store.getSource(),
      sink,
      combinedConnectionEvents
    )
    const store = new RelayRecordSourceProxy(mutator, this._getDataID, this._handlerProvider)
    for (let ii = 0; ii < updates.length; ii++) {
      const update = updates[ii]
      switch (update.kind) {
        case 'client':
          ErrorUtils.applyWithGuard(
            update.updater,
            null,
            [store],
            null,
            'LinearPublishQueue:applyUpdates'
          )
          break
        case 'optimistic':
          applyOptimisticUpdate(update.updater, combinedConnectionEvents, store, this._getDataID)
          break
        case 'payload':
          combinedConnectionEvents.push(...update.payload.connectionEvents || [])
          applyServerPayloadUpdate(update, store)
          break
        case 'source':
          store.publishSource(update.source)
          break
      }
    }
    this._store.publish(sink)
    if (combinedConnectionEvents.length !== 0) {
      this._store.publishConnectionEvents_UNSTABLE(
        combinedConnectionEvents,
        final,
      );
    }
  }
}

function applyOptimisticUpdate (optimisticUpdate: any, combinedConnectionEvents: any[], store: any, getDataID: any) {
  if (optimisticUpdate.storeUpdater) {
    const {storeUpdater} = optimisticUpdate
    ErrorUtils.applyWithGuard(storeUpdater, null, [store], null, 'LinearPublishQueue:applyUpdates')
  } else {
    const {operation, payload, updater} = optimisticUpdate
    const {connectionEvents, source, fieldPayloads} = payload
    const selectorStore = new RelayRecordSourceSelectorProxy(
      store.__mutator,
      store,
      operation.fragment,
    )
    let selectorData
    if (source) {
      store.publishSource(source, fieldPayloads)
      selectorData = lookupSelector(source, operation.fragment)
    }
    if (connectionEvents) {
      combinedConnectionEvents.push(...connectionEvents)
    }
    if (updater) {
      ErrorUtils.applyWithGuard(
        updater,
        null,
        [selectorStore, selectorData],
        null,
        'RelayPublishQueue:applyUpdates',
      )
    }
  }
}

function applyServerPayloadUpdate (pendingPayload: ServerPayload, store: any): void {
  const {payload, operation, updater} = pendingPayload
  const {source, fieldPayloads} = payload
  store.publishSource(source, fieldPayloads)
  if (updater) {
    const selector = operation.fragment
    invariant(
      selector != null,
      'RelayModernEnvironment: Expected a selector to be provided with updater function.'
    )
    const selectorData = lookupSelector(source, selector, operation)
    const selectorStore = new RelayRecordSourceSelectorProxy(store.__mutator, store, selector)
    updater(selectorStore, selectorData)
  }
}

function findUpdaterIdx (
  updates: Array<DataToCommit>,
  updater: StoreUpdater | OptimisticUpdate
): number {
  return updates.findIndex((update) => update.updater === updater)
}

type ReaderSelector = any

function lookupSelector (
  source: RecordSource,
  selector: ReaderSelector,
  owner: OperationDescriptor | null
): SelectorData | null {
  return RelayReader.read(source, selector, owner).data
}

module.exports = RelayPublishQueue;
