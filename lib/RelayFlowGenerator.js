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

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var ConnectionFieldTransform = require("./ConnectionFieldTransform");

var FlattenTransform = require("./FlattenTransform");

var IRVisitor = require("./GraphQLIRVisitor");

var Profiler = require("./GraphQLCompilerProfiler");

var RelayMaskTransform = require("./RelayMaskTransform");

var RelayMatchTransform = require("./RelayMatchTransform");

var RelayRefetchableFragmentTransform = require("./RelayRefetchableFragmentTransform");

var RelayRelayDirectiveTransform = require("./RelayRelayDirectiveTransform");

var _require = require("./GraphQLSchemaUtils"),
    isAbstractType = _require.isAbstractType;

var _require2 = require("./RelayFlowBabelFactories"),
    anyTypeAlias = _require2.anyTypeAlias,
    declareExportOpaqueType = _require2.declareExportOpaqueType,
    exactObjectTypeAnnotation = _require2.exactObjectTypeAnnotation,
    exportType = _require2.exportType,
    exportTypes = _require2.exportTypes,
    importTypes = _require2.importTypes,
    intersectionTypeAnnotation = _require2.intersectionTypeAnnotation,
    lineComments = _require2.lineComments,
    readOnlyArrayOfType = _require2.readOnlyArrayOfType,
    readOnlyObjectTypeProperty = _require2.readOnlyObjectTypeProperty,
    unionTypeAnnotation = _require2.unionTypeAnnotation;

var _require3 = require("./RelayFlowTypeTransformers"),
    transformInputType = _require3.transformInputType,
    transformScalarType = _require3.transformScalarType;

var _require4 = require("relay-runtime"),
    getModuleComponentKey = _require4.getModuleComponentKey,
    getModuleOperationKey = _require4.getModuleOperationKey;

var babelGenerator = require("@babel/generator")["default"];

var t = require("@babel/types");

var _require5 = require("graphql"),
    GraphQLInputObjectType = _require5.GraphQLInputObjectType,
    GraphQLNonNull = _require5.GraphQLNonNull,
    GraphQLString = _require5.GraphQLString;

var invariant = require("fbjs/lib/invariant");

var nullthrows = require("nullthrows");

function generate(node, options) {
  var ast = IRVisitor.visit(node, createVisitor(options));
  return babelGenerator(ast).code;
}

function makeProp(_ref, state, unmasked, concreteType) {
  var key = _ref.key,
      schemaName = _ref.schemaName,
      value = _ref.value,
      conditional = _ref.conditional,
      nodeType = _ref.nodeType,
      nodeSelections = _ref.nodeSelections;

  if (nodeType) {
    value = transformScalarType(nodeType, state, selectionsToBabel([Array.from(nullthrows(nodeSelections).values())], state, unmasked));
  }

  if (schemaName === '__typename' && concreteType) {
    value = t.stringLiteralTypeAnnotation(concreteType);
  }

  var typeProperty = readOnlyObjectTypeProperty(key, value);

  if (conditional) {
    typeProperty.optional = true;
  }

  return typeProperty;
}

var isTypenameSelection = function isTypenameSelection(selection) {
  return selection.schemaName === '__typename';
};

var hasTypenameSelection = function hasTypenameSelection(selections) {
  return selections.some(isTypenameSelection);
};

var onlySelectsTypename = function onlySelectsTypename(selections) {
  return selections.every(isTypenameSelection);
};

function selectionsToBabel(selections, state, unmasked, fragmentTypeName) {
  var baseFields = new Map();
  var byConcreteType = {};
  flattenArray(selections).forEach(function (selection) {
    var concreteType = selection.concreteType;

    if (concreteType) {
      var _byConcreteType$concr;

      byConcreteType[concreteType] = (_byConcreteType$concr = byConcreteType[concreteType]) !== null && _byConcreteType$concr !== void 0 ? _byConcreteType$concr : [];
      byConcreteType[concreteType].push(selection);
    } else {
      var previousSel = baseFields.get(selection.key);
      baseFields.set(selection.key, previousSel ? mergeSelection(selection, previousSel) : selection);
    }
  });
  var types = [];

  if (Object.keys(byConcreteType).length > 0 && onlySelectsTypename(Array.from(baseFields.values())) && (hasTypenameSelection(Array.from(baseFields.values())) || Object.keys(byConcreteType).every(function (type) {
    return hasTypenameSelection(byConcreteType[type]);
  }))) {
    (function () {
      var typenameAliases = new Set();

      var _loop = function _loop(concreteType) {
        types.push(groupRefs([].concat((0, _toConsumableArray2["default"])(Array.from(baseFields.values())), (0, _toConsumableArray2["default"])(byConcreteType[concreteType]))).map(function (selection) {
          if (selection.schemaName === '__typename') {
            typenameAliases.add(selection.key);
          }

          return makeProp(selection, state, unmasked, concreteType);
        }));
      };

      for (var concreteType in byConcreteType) {
        _loop(concreteType);
      } // It might be some other type then the listed concrete types. Ideally, we
      // would set the type to diff(string, set of listed concrete types), but
      // this doesn't exist in Flow at the time.


      types.push(Array.from(typenameAliases).map(function (typenameAlias) {
        var otherProp = readOnlyObjectTypeProperty(typenameAlias, t.stringLiteralTypeAnnotation('%other'));
        otherProp.leadingComments = lineComments("This will never be '%other', but we need some", 'value in case none of the concrete values match.');
        return otherProp;
      }));
    })();
  } else {
    var selectionMap = selectionsToMap(Array.from(baseFields.values()));

    for (var concreteType in byConcreteType) {
      selectionMap = mergeSelections(selectionMap, selectionsToMap(byConcreteType[concreteType].map(function (sel) {
        return (0, _objectSpread2["default"])({}, sel, {
          conditional: true
        });
      })));
    }

    var selectionMapValues = groupRefs(Array.from(selectionMap.values())).map(function (sel) {
      return isTypenameSelection(sel) && sel.concreteType ? makeProp((0, _objectSpread2["default"])({}, sel, {
        conditional: false
      }), state, unmasked, sel.concreteType) : makeProp(sel, state, unmasked);
    });
    types.push(selectionMapValues);
  }

  return unionTypeAnnotation(types.map(function (props) {
    if (fragmentTypeName) {
      props.push(readOnlyObjectTypeProperty('$refType', t.genericTypeAnnotation(t.identifier(fragmentTypeName))));
    }

    return unmasked ? t.objectTypeAnnotation(props) : exactObjectTypeAnnotation(props);
  }));
}

function mergeSelection(a, b) {
  var shouldSetConditional = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

  if (!a) {
    if (shouldSetConditional) {
      return (0, _objectSpread2["default"])({}, b, {
        conditional: true
      });
    }

    return b;
  }

  return (0, _objectSpread2["default"])({}, a, {
    nodeSelections: a.nodeSelections ? mergeSelections(a.nodeSelections, nullthrows(b.nodeSelections), shouldSetConditional) : null,
    conditional: a.conditional && b.conditional
  });
}

function mergeSelections(a, b) {
  var shouldSetConditional = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
  var merged = new Map();
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = a.entries()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var _step$value = _step.value,
          key = _step$value[0],
          value = _step$value[1];
      merged.set(key, value);
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator["return"] != null) {
        _iterator["return"]();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = b.entries()[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var _step2$value = _step2.value,
          key = _step2$value[0],
          value = _step2$value[1];
      merged.set(key, mergeSelection(a.get(key), value, shouldSetConditional));
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
        _iterator2["return"]();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  return merged;
}

function isPlural(node) {
  return Boolean(node.metadata && node.metadata.plural);
}

function createVisitor(options) {
  var state = {
    customScalars: options.customScalars,
    enumsHasteModule: options.enumsHasteModule,
    existingFragmentNames: options.existingFragmentNames,
    generatedFragments: new Set(),
    generatedInputObjectTypes: {},
    optionalInputFields: options.optionalInputFields,
    usedEnums: {},
    usedFragments: new Set(),
    useHaste: options.useHaste,
    useSingleArtifactDirectory: options.useSingleArtifactDirectory,
    noFutureProofEnums: options.noFutureProofEnums
  };
  return {
    leave: {
      Root: function Root(node) {
        var inputVariablesType = generateInputVariablesType(node, state);
        var inputObjectTypes = generateInputObjectTypes(state);
        var responseType = exportType("".concat(node.name, "Response"), selectionsToBabel(
        /* $FlowFixMe: selections have already been transformed */
        node.selections, state, false));
        var operationTypes = [t.objectTypeProperty(t.identifier('variables'), t.genericTypeAnnotation(t.identifier("".concat(node.name, "Variables")))), t.objectTypeProperty(t.identifier('response'), t.genericTypeAnnotation(t.identifier("".concat(node.name, "Response"))))]; // Generate raw response type

        var rawResponseType;
        var normalizationIR = options.normalizationIR;

        if (normalizationIR && node.directives.some(function (d) {
          return d.name === DIRECTIVE_NAME;
        })) {
          rawResponseType = IRVisitor.visit(normalizationIR, createRawResponseTypeVisitor(state));
        }

        var refetchableFragmentName = getRefetchableQueryParentFragmentName(state, node.metadata);
        var babelNodes = [].concat((0, _toConsumableArray2["default"])(refetchableFragmentName ? generateFragmentRefsForRefetchable(refetchableFragmentName) : getFragmentImports(state)), (0, _toConsumableArray2["default"])(getEnumDefinitions(state)), (0, _toConsumableArray2["default"])(inputObjectTypes), [inputVariablesType, responseType]);

        if (rawResponseType) {
          operationTypes.push(t.objectTypeProperty(t.identifier('rawResponse'), t.genericTypeAnnotation(t.identifier("".concat(node.name, "RawResponse")))));
          babelNodes.push(rawResponseType);
        }

        babelNodes.push(exportType(node.name, exactObjectTypeAnnotation(operationTypes)));
        return t.program(babelNodes);
      },
      Fragment: function Fragment(node) {
        var selections = flattenArray(
        /* $FlowFixMe: selections have already been transformed */
        node.selections);
        var numConecreteSelections = selections.filter(function (s) {
          return s.concreteType;
        }).length;
        selections = selections.map(function (selection) {
          if (numConecreteSelections <= 1 && isTypenameSelection(selection) && !isAbstractType(node.type)) {
            return [(0, _objectSpread2["default"])({}, selection, {
              concreteType: node.type.toString()
            })];
          }

          return [selection];
        });
        state.generatedFragments.add(node.name);
        var fragmentTypes = getFragmentTypes(node.name, getRefetchableQueryPath(state, node.directives));
        var refTypeName = getRefTypeName(node.name);
        var refTypeDataProperty = readOnlyObjectTypeProperty('$data', t.genericTypeAnnotation(t.identifier("".concat(node.name, "$data"))));
        refTypeDataProperty.optional = true;
        var refTypeFragmentRefProperty = readOnlyObjectTypeProperty('$fragmentRefs', t.genericTypeAnnotation(t.identifier(getOldFragmentTypeName(node.name))));
        var refType = t.objectTypeAnnotation([refTypeDataProperty, refTypeFragmentRefProperty]);
        var dataTypeName = getDataTypeName(node.name);
        var dataType = t.genericTypeAnnotation(t.identifier(node.name));
        var unmasked = node.metadata != null && node.metadata.mask === false;
        var baseType = selectionsToBabel(selections, state, unmasked, unmasked ? undefined : getOldFragmentTypeName(node.name));
        var type = isPlural(node) ? readOnlyArrayOfType(baseType) : baseType;
        var importedTypes = ['FragmentReference'];
        return t.program([].concat((0, _toConsumableArray2["default"])(getFragmentImports(state)), (0, _toConsumableArray2["default"])(getEnumDefinitions(state)), [importTypes(importedTypes, 'relay-runtime')], (0, _toConsumableArray2["default"])(fragmentTypes), [exportType(node.name, type), exportType(dataTypeName, dataType), exportType(refTypeName, refType)]));
      },
      InlineFragment: function InlineFragment(node) {
        var typeCondition = node.typeCondition;
        return flattenArray(
        /* $FlowFixMe: selections have already been transformed */
        node.selections).map(function (typeSelection) {
          return isAbstractType(typeCondition) ? (0, _objectSpread2["default"])({}, typeSelection, {
            conditional: true
          }) : (0, _objectSpread2["default"])({}, typeSelection, {
            concreteType: typeCondition.toString()
          });
        });
      },
      Condition: visitCondition,
      ScalarField: function ScalarField(node) {
        return visitScalarField(node, state);
      },
      ConnectionField: visitConnectionField,
      LinkedField: visitLinkedField,
      ModuleImport: function ModuleImport(node) {
        return [{
          key: '__fragmentPropName',
          conditional: true,
          value: transformScalarType(GraphQLString, state)
        }, {
          key: '__module_component',
          conditional: true,
          value: transformScalarType(GraphQLString, state)
        }, {
          key: '__fragments_' + node.name,
          ref: node.name
        }];
      },
      FragmentSpread: function FragmentSpread(node) {
        state.usedFragments.add(node.name);
        return [{
          key: '__fragments_' + node.name,
          ref: node.name
        }];
      }
    }
  };
}

function visitCondition(node, state) {
  return flattenArray(
  /* $FlowFixMe: selections have already been transformed */
  node.selections).map(function (selection) {
    return (0, _objectSpread2["default"])({}, selection, {
      conditional: true
    });
  });
}

function visitScalarField(node, state) {
  return [{
    key: node.alias,
    schemaName: node.name,
    value: transformScalarType(node.type, state)
  }];
}

function visitConnectionField(node) {
  return [{
    key: node.alias,
    schemaName: node.name,
    nodeType: node.type,
    nodeSelections: selectionsToMap(flattenArray( // $FlowFixMe
    node.selections),
    /*
     * append concreteType to key so overlapping fields with different
     * concreteTypes don't get overwritten by each other
     */
    true)
  }];
}

function visitLinkedField(node) {
  return [{
    key: node.alias,
    schemaName: node.name,
    nodeType: node.type,
    nodeSelections: selectionsToMap(flattenArray(
    /* $FlowFixMe: selections have already been transformed */
    node.selections),
    /*
     * append concreteType to key so overlapping fields with different
     * concreteTypes don't get overwritten by each other
     */
    true)
  }];
}

function makeRawResponseProp(_ref2, state, concreteType) {
  var key = _ref2.key,
      schemaName = _ref2.schemaName,
      value = _ref2.value,
      conditional = _ref2.conditional,
      nodeType = _ref2.nodeType,
      nodeSelections = _ref2.nodeSelections;

  if (nodeType) {
    value = transformScalarType(nodeType, state, selectionsToRawResponseBabel([Array.from(nullthrows(nodeSelections).values())], state, isAbstractType(nodeType) ? null : nodeType.name));
  }

  if (schemaName === '__typename' && concreteType) {
    value = t.stringLiteralTypeAnnotation(concreteType);
  }

  var typeProperty = readOnlyObjectTypeProperty(key, value);

  if (conditional) {
    typeProperty.optional = true;
  }

  return typeProperty;
} // Trasform the codegen IR selections into Babel flow types


function selectionsToRawResponseBabel(selections, state, nodeTypeName) {
  var baseFields = [];
  var byConcreteType = {};
  flattenArray(selections).forEach(function (selection) {
    var concreteType = selection.concreteType;

    if (concreteType) {
      var _byConcreteType$concr2;

      byConcreteType[concreteType] = (_byConcreteType$concr2 = byConcreteType[concreteType]) !== null && _byConcreteType$concr2 !== void 0 ? _byConcreteType$concr2 : [];
      byConcreteType[concreteType].push(selection);
    } else {
      baseFields.push(selection);
    }
  });
  var types = [];

  if (Object.keys(byConcreteType).length) {
    var baseFieldsMap = selectionsToMap(baseFields);

    var _loop2 = function _loop2(concreteType) {
      types.push(Array.from(mergeSelections(baseFieldsMap, selectionsToMap(byConcreteType[concreteType]), false).values()).map(function (selection) {
        if (isTypenameSelection(selection)) {
          return makeRawResponseProp((0, _objectSpread2["default"])({}, selection, {
            conditional: false
          }), state, concreteType);
        }

        return makeRawResponseProp(selection, state, concreteType);
      }));
    };

    for (var concreteType in byConcreteType) {
      _loop2(concreteType);
    }
  }

  if (baseFields.length) {
    types.push(baseFields.map(function (selection) {
      if (isTypenameSelection(selection)) {
        return makeRawResponseProp((0, _objectSpread2["default"])({}, selection, {
          conditional: false
        }), state, nodeTypeName);
      }

      return makeRawResponseProp(selection, state, null);
    }));
  }

  return unionTypeAnnotation(types.map(function (props) {
    return exactObjectTypeAnnotation(props);
  }));
} // Visitor for generating raw reponse type


function createRawResponseTypeVisitor(state) {
  var visitor = {
    enter: {
      ClientExtension: function ClientExtension(node) {
        // client fields are not supposed to be in the response
        return null;
      }
    },
    leave: {
      Root: function Root(node) {
        return exportType("".concat(node.name, "RawResponse"), selectionsToRawResponseBabel(
        /* $FlowFixMe: selections have already been transformed */
        node.selections, state, null));
      },
      InlineFragment: function InlineFragment(node) {
        var typeCondition = node.typeCondition;
        return flattenArray(
        /* $FlowFixMe: selections have already been transformed */
        node.selections).map(function (typeSelection) {
          return isAbstractType(typeCondition) ? typeSelection : (0, _objectSpread2["default"])({}, typeSelection, {
            concreteType: typeCondition.toString()
          });
        });
      },
      Condition: visitCondition,
      ScalarField: function ScalarField(node) {
        return visitScalarField(node, state);
      },
      ConnectionField: visitConnectionField,
      LinkedField: visitLinkedField,
      Defer: function Defer(node) {
        return flattenArray(
        /* $FlowFixMe: selections have already been transformed */
        node.selections);
      },
      Stream: function Stream(node) {
        return flattenArray(
        /* $FlowFixMe: selections have already been transformed */
        node.selections);
      },
      ModuleImport: function ModuleImport(node) {
        return [{
          key: getModuleOperationKey(node.name),
          value: t.mixedTypeAnnotation()
        }, {
          key: getModuleComponentKey(node.name),
          value: t.mixedTypeAnnotation()
        }];
      },
      FragmentSpread: function FragmentSpread(node) {
        !false ? process.env.NODE_ENV !== "production" ? invariant(false, 'A fragment spread is found when traversing the AST, ' + 'make sure you are passing the codegen IR') : invariant(false) : void 0;
      }
    }
  };
  return visitor;
}

function selectionsToMap(selections, appendType) {
  var map = new Map();
  selections.forEach(function (selection) {
    var key = appendType && selection.concreteType ? "".concat(selection.key, "::").concat(selection.concreteType) : selection.key;
    var previousSel = map.get(key);
    map.set(key, previousSel ? mergeSelection(previousSel, selection) : selection);
  });
  return map;
}

function flattenArray(arrayOfArrays) {
  var result = [];
  arrayOfArrays.forEach(function (array) {
    result.push.apply(result, (0, _toConsumableArray2["default"])(array));
  });
  return result;
}

function generateInputObjectTypes(state) {
  return Object.keys(state.generatedInputObjectTypes).map(function (typeIdentifier) {
    var inputObjectType = state.generatedInputObjectTypes[typeIdentifier];
    !(typeof inputObjectType !== 'string') ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayCompilerFlowGenerator: Expected input object type to have been' + ' defined before calling `generateInputObjectTypes`') : invariant(false) : void 0;
    return exportType(typeIdentifier, inputObjectType);
  });
}

function generateInputVariablesType(node, state) {
  return exportType("".concat(node.name, "Variables"), exactObjectTypeAnnotation(node.argumentDefinitions.map(function (arg) {
    var property = t.objectTypeProperty(t.identifier(arg.name), transformInputType(arg.type, state));

    if (!(arg.type instanceof GraphQLNonNull)) {
      property.optional = true;
    }

    return property;
  })));
}

function groupRefs(props) {
  var result = [];
  var refs = [];
  props.forEach(function (prop) {
    if (prop.ref) {
      refs.push(prop.ref);
    } else {
      result.push(prop);
    }
  });

  if (refs.length > 0) {
    var value = intersectionTypeAnnotation(refs.map(function (ref) {
      return t.genericTypeAnnotation(t.identifier(getOldFragmentTypeName(ref)));
    }));
    result.push({
      key: '$fragmentRefs',
      conditional: false,
      value: value
    });
  }

  return result;
}

function getFragmentImports(state) {
  var imports = [];

  if (state.usedFragments.size > 0) {
    var usedFragments = Array.from(state.usedFragments).sort();
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = usedFragments[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var usedFragment = _step3.value;
        var fragmentTypeName = getOldFragmentTypeName(usedFragment);

        if (!state.generatedFragments.has(usedFragment)) {
          if (state.useHaste && state.existingFragmentNames.has(usedFragment)) {
            // TODO(T22653277) support non-haste environments when importing
            // fragments
            imports.push(importTypes([fragmentTypeName], usedFragment + '.graphql'));
          } else if (state.useSingleArtifactDirectory && state.existingFragmentNames.has(usedFragment)) {
            imports.push(importTypes([fragmentTypeName], './' + usedFragment + '.graphql'));
          } else {
            imports.push(anyTypeAlias(fragmentTypeName));
          }
        }
      }
    } catch (err) {
      _didIteratorError3 = true;
      _iteratorError3 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion3 && _iterator3["return"] != null) {
          _iterator3["return"]();
        }
      } finally {
        if (_didIteratorError3) {
          throw _iteratorError3;
        }
      }
    }
  }

  return imports;
}

function getEnumDefinitions(_ref3) {
  var enumsHasteModule = _ref3.enumsHasteModule,
      usedEnums = _ref3.usedEnums,
      noFutureProofEnums = _ref3.noFutureProofEnums;
  var enumNames = Object.keys(usedEnums).sort();

  if (enumNames.length === 0) {
    return [];
  }

  if (enumsHasteModule) {
    return [importTypes(enumNames, enumsHasteModule)];
  }

  return enumNames.map(function (name) {
    var values = usedEnums[name].getValues().map(function (_ref4) {
      var value = _ref4.value;
      return value;
    });
    values.sort();

    if (!noFutureProofEnums) {
      values.push('%future added value');
    }

    return exportType(name, t.unionTypeAnnotation(values.map(function (value) {
      return t.stringLiteralTypeAnnotation(value);
    })));
  });
} // If it's a @refetchable fragment, we generate the $fragmentRef in generated
// query, and import it in the fragment to avoid circular dependencies


function getRefetchableQueryParentFragmentName(state, metadata) {
  if (!(metadata === null || metadata === void 0 ? void 0 : metadata.isRefetchableQuery) || !state.useHaste && !state.useSingleArtifactDirectory) {
    return null;
  }

  var derivedFrom = metadata === null || metadata === void 0 ? void 0 : metadata.derivedFrom;

  if (derivedFrom != null && typeof derivedFrom === 'string') {
    return derivedFrom;
  }

  return null;
}

function getRefetchableQueryPath(state, directives) {
  var _directives$find;

  var refetchableQuery;

  if (!state.useHaste && !state.useSingleArtifactDirectory) {
    return;
  }

  var refetchableArgs = (_directives$find = directives.find(function (d) {
    return d.name === 'refetchable';
  })) === null || _directives$find === void 0 ? void 0 : _directives$find.args;

  if (!refetchableArgs) {
    return;
  }

  var argument = refetchableArgs.find(function (arg) {
    return arg.kind === 'Argument' && arg.name === 'queryName';
  });

  if (argument && argument.value && argument.value.kind === 'Literal' && typeof argument.value.value === 'string') {
    refetchableQuery = argument.value.value;

    if (!state.useHaste) {
      refetchableQuery = './' + refetchableQuery;
    }

    refetchableQuery += '.graphql';
  }

  return refetchableQuery;
}

function generateFragmentRefsForRefetchable(name) {
  var oldFragmentTypeName = getOldFragmentTypeName(name);
  var newFragmentTypeName = getNewFragmentTypeName(name);
  return [importTypes(['FragmentReference'], 'relay-runtime'), declareExportOpaqueType(oldFragmentTypeName, 'FragmentReference'), declareExportOpaqueType(newFragmentTypeName, oldFragmentTypeName)];
}

function getFragmentTypes(name, refetchableQueryPath) {
  var oldFragmentTypeName = getOldFragmentTypeName(name);
  var newFragmentTypeName = getNewFragmentTypeName(name);

  if (refetchableQueryPath) {
    return [importTypes([oldFragmentTypeName, newFragmentTypeName], refetchableQueryPath), exportTypes([oldFragmentTypeName, newFragmentTypeName])];
  }

  return [declareExportOpaqueType(oldFragmentTypeName, 'FragmentReference'), declareExportOpaqueType(newFragmentTypeName, oldFragmentTypeName)];
}

function getOldFragmentTypeName(name) {
  return "".concat(name, "$ref");
}

function getNewFragmentTypeName(name) {
  return "".concat(name, "$fragmentType");
}

function getRefTypeName(name) {
  return "".concat(name, "$key");
}

function getDataTypeName(name) {
  return "".concat(name, "$data");
}

var FLOW_TRANSFORMS = [RelayRelayDirectiveTransform.transform, RelayMaskTransform.transform, ConnectionFieldTransform.transform, RelayMatchTransform.transform, FlattenTransform.transformWithOptions({}), RelayRefetchableFragmentTransform.transform];
var DIRECTIVE_NAME = 'raw_response_type';
module.exports = {
  generate: Profiler.instrument(generate, 'RelayFlowGenerator.generate'),
  transforms: FLOW_TRANSFORMS,
  SCHEMA_EXTENSION: "directive @".concat(DIRECTIVE_NAME, " on QUERY | MUTATION | SUBSCRIPTION")
};