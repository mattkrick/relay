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

var ClientExtensionsTransform = require("./ClientExtensionsTransform");

var ConnectionFieldTransform = require("./ConnectionFieldTransform");

var FilterDirectivesTransform = require("./FilterDirectivesTransform");

var FlattenTransform = require("./FlattenTransform");

var InlineDataFragmentTransform = require("./InlineDataFragmentTransform");

var InlineFragmentsTransform = require("./InlineFragmentsTransform");

var RefineOperationVariablesTransform = require("./RefineOperationVariablesTransform");

var RelayApplyFragmentArgumentTransform = require("./RelayApplyFragmentArgumentTransform");

var RelayConnectionTransform = require("./RelayConnectionTransform");

var RelayDeferStreamTransform = require("./RelayDeferStreamTransform");

var RelayFieldHandleTransform = require("./RelayFieldHandleTransform");

var RelayFlowGenerator = require("./RelayFlowGenerator");

var RelayGenerateIDFieldTransform = require("./RelayGenerateIDFieldTransform");

var RelayGenerateTypeNameTransform = require("./RelayGenerateTypeNameTransform");

var RelayMaskTransform = require("./RelayMaskTransform");

var RelayMatchTransform = require("./RelayMatchTransform");

var RelayRefetchableFragmentTransform = require("./RelayRefetchableFragmentTransform");

var RelayRelayDirectiveTransform = require("./RelayRelayDirectiveTransform");

var RelaySkipHandleFieldTransform = require("./RelaySkipHandleFieldTransform");

var RelaySplitModuleImportTransform = require("./RelaySplitModuleImportTransform");

var RelayTestOperationTransform = require("./RelayTestOperationTransform");

var SkipClientExtensionsTransform = require("./SkipClientExtensionsTransform");

var SkipRedundantNodesTransform = require("./SkipRedundantNodesTransform");

var SkipUnreachableNodeTransform = require("./SkipUnreachableNodeTransform");

// Transforms applied to the code used to process a query response.
var relaySchemaExtensions = [RelayConnectionTransform.SCHEMA_EXTENSION, RelayMatchTransform.SCHEMA_EXTENSION, ConnectionFieldTransform.SCHEMA_EXTENSION, RelayRelayDirectiveTransform.SCHEMA_EXTENSION, RelayRefetchableFragmentTransform.SCHEMA_EXTENSION, RelayTestOperationTransform.SCHEMA_EXTENSION, InlineDataFragmentTransform.SCHEMA_EXTENSION, RelayFlowGenerator.SCHEMA_EXTENSION]; // Transforms applied to both operations and fragments for both reading and
// writing from the store.

var relayCommonTransforms = [RelayConnectionTransform.transform, RelayRelayDirectiveTransform.transform, RelayMaskTransform.transform, RelayMatchTransform.transform, ConnectionFieldTransform.transform, RelayRefetchableFragmentTransform.transform]; // Transforms applied to fragments used for reading data from a store

var relayFragmentTransforms = [ClientExtensionsTransform.transform, RelayFieldHandleTransform.transform, InlineDataFragmentTransform.transform, FlattenTransform.transformWithOptions({
  flattenAbstractTypes: true
}), SkipRedundantNodesTransform.transform]; // Transforms applied to queries/mutations/subscriptions that are used for
// fetching data from the server and parsing those responses.

var relayQueryTransforms = [RelayApplyFragmentArgumentTransform.transform, RelayGenerateIDFieldTransform.transform, RelayDeferStreamTransform.transform, RelayTestOperationTransform.transform]; // Transforms applied to the code used to process a query response.

var relayCodegenTransforms = [SkipUnreachableNodeTransform.transform, RelaySplitModuleImportTransform.transform, InlineFragmentsTransform.transform, // NOTE: For the codegen context, we make sure to run ClientExtensions
// transform after we've inlined fragment spreads (i.e. InlineFragmentsTransform)
// This will ensure that we don't generate nested ClientExtension nodes
ClientExtensionsTransform.transform, FlattenTransform.transformWithOptions({
  flattenAbstractTypes: true
}), SkipRedundantNodesTransform.transform, RelayGenerateTypeNameTransform.transform, FilterDirectivesTransform.transform, RefineOperationVariablesTransform.transformWithOptions({
  removeUnusedVariables: false
})]; // Transforms applied before printing the query sent to the server.

var relayPrintTransforms = [// NOTE: Skipping client extensions might leave empty selections, which we
// skip by running SkipUnreachableNodeTransform immediately after.
ClientExtensionsTransform.transform, SkipClientExtensionsTransform.transform, SkipUnreachableNodeTransform.transform, FlattenTransform.transformWithOptions({}), RelayGenerateTypeNameTransform.transform, RelaySkipHandleFieldTransform.transform, FilterDirectivesTransform.transform, RefineOperationVariablesTransform.transformWithOptions({
  removeUnusedVariables: true
})];
module.exports = {
  commonTransforms: relayCommonTransforms,
  codegenTransforms: relayCodegenTransforms,
  fragmentTransforms: relayFragmentTransforms,
  printTransforms: relayPrintTransforms,
  queryTransforms: relayQueryTransforms,
  schemaExtensions: relaySchemaExtensions
};