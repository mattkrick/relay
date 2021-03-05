/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<5c5b793ceeda90a48ed1c1236f19b4d4>>
 * @flow
 * @lightSyntaxTransform
 * @nogrep
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
import type { FragmentReference } from "relay-runtime";
declare export opaque type RelayModernFragmentSpecResolverTestQueryUserFragment$ref: FragmentReference;
declare export opaque type RelayModernFragmentSpecResolverTestQueryUserFragment$fragmentType: RelayModernFragmentSpecResolverTestQueryUserFragment$ref;
export type RelayModernFragmentSpecResolverTestQueryUserFragment = {|
  +id: string,
  +name: ?string,
  +profilePicture?: ?{|
    +uri: ?string,
  |},
  +$refType: RelayModernFragmentSpecResolverTestQueryUserFragment$ref,
|};
export type RelayModernFragmentSpecResolverTestQueryUserFragment$data = RelayModernFragmentSpecResolverTestQueryUserFragment;
export type RelayModernFragmentSpecResolverTestQueryUserFragment$key = {
  +$data?: RelayModernFragmentSpecResolverTestQueryUserFragment$data,
  +$fragmentRefs: RelayModernFragmentSpecResolverTestQueryUserFragment$ref,
  ...
};
*/

var node/*: ReaderFragment*/ = {
  "argumentDefinitions": [
    {
      "kind": "RootArgument",
      "name": "fetchSize"
    },
    {
      "kind": "RootArgument",
      "name": "size"
    }
  ],
  "kind": "Fragment",
  "metadata": null,
  "name": "RelayModernFragmentSpecResolverTestQueryUserFragment",
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "id",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "name",
      "storageKey": null
    },
    {
      "condition": "fetchSize",
      "kind": "Condition",
      "passingValue": true,
      "selections": [
        {
          "alias": null,
          "args": [
            {
              "kind": "Variable",
              "name": "size",
              "variableName": "size"
            }
          ],
          "concreteType": "Image",
          "kind": "LinkedField",
          "name": "profilePicture",
          "plural": false,
          "selections": [
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "uri",
              "storageKey": null
            }
          ],
          "storageKey": null
        }
      ]
    }
  ],
  "type": "User",
  "abstractKey": null
};

if (__DEV__) {
  (node/*: any*/).hash = "307c9d6b156252938357d44fe889c8d4";
}

module.exports = node;
