"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var types_1 = require("@babel/types");

var util_1 = require("./util");

function convertFlowType(path) {
  if (util_1.isNodePath(types_1.isAnyTypeAnnotation, path)) {
    return types_1.tsAnyKeyword();
  }

  if (util_1.isNodePath(types_1.isArrayTypeAnnotation, path)) {
    return types_1.tsArrayType(convertFlowType(path.get('elementType')));
  }

  if (util_1.isNodePath(types_1.isBooleanTypeAnnotation, path)) {
    return types_1.tsBooleanKeyword();
  }

  if (util_1.isNodePath(types_1.isBooleanLiteralTypeAnnotation, path)) {
    return types_1.tsLiteralType(types_1.booleanLiteral(path.node.value));
  }

  if (util_1.isNodePath(types_1.isEmptyTypeAnnotation, path)) {
    return types_1.tsNeverKeyword();
  }

  if (util_1.isNodePath(types_1.isExistsTypeAnnotation, path)) {
    util_1.warnOnlyOnce('Existential type (*) in Flow is converted to "any" in TypeScript, and this conversion loses some type information.');
    return types_1.tsAnyKeyword();
  }

  if (util_1.isNodePath(types_1.isGenericTypeAnnotation, path)) {
    var typeParameterPath = path.get('typeParameters');
    var tsTypeParameters = null;

    if (typeParameterPath.node) {
      var tsParams = typeParameterPath.node.params.map(function (_, i) {
        return convertFlowType(typeParameterPath.get("params.".concat(i)));
      });
      tsTypeParameters = types_1.tsTypeParameterInstantiation(tsParams);
    }

    var id = path.node.id;

    if (id.name === '$Keys') {
      // $Keys -> keyof
      var ret = types_1.tsTypeOperator(tsTypeParameters.params[0]);
      ret.operator = 'keyof';
      return ret;
    } else if (id.name === '$Values') {
      // $Values<X> -> X[keyof X]
      var tsType = tsTypeParameters.params[0];
      var tsKey = types_1.tsTypeOperator(tsType);
      tsKey.operator = 'keyof';
      return types_1.tsIndexedAccessType(tsType, tsKey);
    } else if (id.name === '$ReadOnly') {
      // $ReadOnly<X> -> Readonly<X>
      return types_1.tsTypeReference(types_1.identifier('Readonly'), tsTypeParameters);
    } else if (id.name === '$ReadOnlyArray') {
      // $ReadOnlyArray<X> -> ReadonlyArray<X>
      return types_1.tsTypeReference(types_1.identifier('ReadonlyArray'), tsTypeParameters);
    } else if (id.name === '$Exact') {
      util_1.warnOnlyOnce('Exact object type annotation in Flow is ignored. In TypeScript, it\'s always regarded as exact type');
      return tsTypeParameters.params[0];
    } else if (id.name === '$Diff') {
      // $Diff<X, Y> -> Pick<X, Exclude<keyof X, keyof Y>>
      var _tsTypeParameters$par = tsTypeParameters.params,
          tsX = _tsTypeParameters$par[0],
          tsY = _tsTypeParameters$par[1];
      var tsKeyofX = types_1.tsTypeOperator(tsX);
      var tsKeyofY = types_1.tsTypeOperator(tsY);
      tsKeyofX.operator = 'keyof';
      tsKeyofY.operator = 'keyof';
      var tsExclude = types_1.tsTypeReference(types_1.identifier('Exclude'), types_1.tsTypeParameterInstantiation([tsKeyofX, tsKeyofY]));
      return types_1.tsTypeReference(types_1.identifier('Pick'), types_1.tsTypeParameterInstantiation([tsX, tsExclude]));
    } else if (id.name === '$Rest') {
      throw new util_1.UnsupportedError('$Rest in GenericTypeAnnotation');
    } else if (id.name === '$PropertyType') {
      // $PropertyType<T, k> -> T[k]
      var _tsTypeParameters$par2 = tsTypeParameters.params,
          tsT = _tsTypeParameters$par2[0],
          tsK = _tsTypeParameters$par2[1];
      return types_1.tsIndexedAccessType(tsT, tsK);
    } else if (id.name === '$ElementType') {
      // $ElementType<T, k> -> T[k]
      var _tsTypeParameters$par3 = tsTypeParameters.params,
          _tsT = _tsTypeParameters$par3[0],
          _tsK = _tsTypeParameters$par3[1];
      return types_1.tsIndexedAccessType(_tsT, _tsK); //TODO: $ObjMap<T, F>, $TupleMap<T, F>, $Call<F>, $Supertype<T>, $Subtype<T>
    } else if (id.name === '$Shape') {
      // $Shape<T> -> Partial<T>
      return types_1.tsTypeReference(types_1.identifier('Partial'), tsTypeParameters);
    } else if (id.name === 'Class') {
      // Class<T> -> typeof T
      var _tsType = tsTypeParameters.params[0];
      var tsTypeofT = types_1.tsTypeOperator(_tsType);
      tsTypeofT.operator = 'typeof';
      return tsTypeofT;
    } else if (types_1.isQualifiedTypeIdentifier(id)) {
      if (types_1.isQualifiedTypeIdentifier(id.qualification)) {
        throw path.buildCodeFrameError('Nested qualification is not supported', util_1.UnsupportedError);
      }

      var tsQ = types_1.tsQualifiedName(id.qualification, id.id);
      return types_1.tsTypeReference(tsQ, tsTypeParameters);
    } else {
      return types_1.tsTypeReference(id, tsTypeParameters);
    }
  }

  if (util_1.isNodePath(types_1.isIntersectionTypeAnnotation, path)) {
    var flowTypes = path.node.types;
    return types_1.tsIntersectionType(flowTypes.map(function (_, i) {
      return convertFlowType(path.get("types.".concat(i)));
    }));
  }

  if (util_1.isNodePath(types_1.isMixedTypeAnnotation, path)) {
    return types_1.tsTypeLiteral([]);
  }

  if (util_1.isNodePath(types_1.isNullableTypeAnnotation, path)) {
    var _tsT2 = convertFlowType(path.get('typeAnnotation')); // Note: for convenience, path stack is stacked in order that parent item is located before child one.


    var pathStack = [path];

    while (types_1.isFlowType(pathStack[0].node) || types_1.isTypeAnnotation(pathStack[0].node) || types_1.isIdentifier(pathStack[0].node)) {
      pathStack.unshift(pathStack[0].parentPath);
    }

    if (types_1.isFunctionDeclaration(pathStack[0].node)) {
      if (pathStack[1].node === pathStack[0].node.returnType) {
        // f(): ?T {} -> f(): T | null | undefined {}
        return types_1.tsUnionType([_tsT2, types_1.tsUndefinedKeyword(), types_1.tsNullKeyword()]);
      } else {
        // Type annotation for function parameter
        var identifierPath = pathStack[1];

        if (identifierPath.node.optional) {
          // ( arg?: ?T ) -> ( arg?: T | null )
          return types_1.tsUnionType([_tsT2, types_1.tsNullKeyword()]);
        } else {
          var argumentIndex = pathStack[0].node.params.indexOf(identifierPath.node);

          if (pathStack[0].node.params.slice(argumentIndex).every(function (node) {
            return node.optional;
          })) {
            // TODO:
            // In Flow, required parameter which accepts undefined also accepts missing value,
            // if the missing value is automatically filled with undefined.
            // (= No required parameters are exist after the parameter).
            //
            // TypeScript doesn't allow missing value for parameter annotated with undefined.
            // Therefore we need to modify the parameter as optional.
            //
            // f( arg: ?T ) -> f( arg?: T | null )
            return types_1.tsUnionType([_tsT2, types_1.tsUndefinedKeyword(), types_1.tsNullKeyword()]);
          } else {
            // Some required parameters are exist after this parameter.
            // f( arg1: ?T, arg2: U ) -> f( arg1: T | null | undefined, arg2: U )
            return types_1.tsUnionType([_tsT2, types_1.tsUndefinedKeyword(), types_1.tsNullKeyword()]);
          }
        }
      }
    }

    if (types_1.isObjectTypeProperty(pathStack[0].node)) {
      if (pathStack[0].node.optional) {
        // { key?: ?T } -> { key?: T | null }
        return types_1.tsUnionType([_tsT2, types_1.tsNullKeyword()]);
      } else {
        // { key: ?T } -> { key: T | null | undefined }
        return types_1.tsUnionType([_tsT2, types_1.tsUndefinedKeyword(), types_1.tsNullKeyword()]);
      }
    } // var x: X<?T> -> var x: X<T | null | undefined>
    // var x:?T -> var x:T | null | undefined


    return types_1.tsUnionType([_tsT2, types_1.tsUndefinedKeyword(), types_1.tsNullKeyword()]);
  }

  if (util_1.isNodePath(types_1.isNullLiteralTypeAnnotation, path)) {
    return types_1.tsNullKeyword();
  }

  if (util_1.isNodePath(types_1.isNumberLiteralTypeAnnotation, path)) {
    return types_1.tsLiteralType(types_1.numericLiteral(path.node.value));
  }

  if (util_1.isNodePath(types_1.isNumberTypeAnnotation, path)) {
    return types_1.tsNumberKeyword();
  }

  if (util_1.isNodePath(types_1.isObjectTypeAnnotation, path)) {
    var members = [];
    var spreads = [];
    var objectTypeNode = path.node;

    if (objectTypeNode.exact) {
      util_1.warnOnlyOnce('Exact object type annotation in Flow is ignored. In TypeScript, it\'s always regarded as exact type');
      objectTypeNode.exact = false;
    }

    if (objectTypeNode.properties && objectTypeNode.properties.length > 0) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = objectTypeNode.properties.entries()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _step$value = _step.value,
              i = _step$value[0],
              property = _step$value[1];

          if (types_1.isObjectTypeProperty(property)) {
            var tsPropSignature = types_1.tsPropertySignature(property.key, types_1.tsTypeAnnotation(convertFlowType(path.get("properties.".concat(i)).get('value'))));
            tsPropSignature.optional = property.optional;
            tsPropSignature.readonly = property.variance && property.variance.kind === 'plus';
            members.push(tsPropSignature);
          }

          if (types_1.isObjectTypeSpreadProperty(property)) {
            // {p1:T, ...U} -> {p1:T} | U
            spreads.push(convertFlowType(path.get("properties.".concat(i)).get('argument')));
          }
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
    }

    if (objectTypeNode.indexers && objectTypeNode.indexers.length > 0) {
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = objectTypeNode.indexers.entries()[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var _step2$value = _step2.value,
              i = _step2$value[0],
              indexer = _step2$value[1];
          var tsIndex = indexer.id || types_1.identifier('x');
          tsIndex.typeAnnotation = types_1.tsTypeAnnotation(convertFlowType(path.get("indexers.".concat(i)).get('key')));
          var member = types_1.tsIndexSignature([tsIndex], types_1.tsTypeAnnotation(convertFlowType(path.get("indexers.".concat(i)).get('value'))));
          members.push(member);
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
    }

    if (objectTypeNode.callProperties && objectTypeNode.callProperties.length > 0) {
      throw new util_1.UnsupportedError('TSCallSignatureDeclaration'); // TODO
      // for (const [i, callProperty] of objectTypeNode.callProperties.entries()) {
      //     //parameters: Array<Identifier>, typeAnnotation?: TSTypeAnnotation | null, readonly?: boolean | null
      //     const tsIndex = indexer.id || identifier('x');
      //     tsIndex.typeAnnotation = tsTypeAnnotation(convertFlowType(path.get(`indexers.${i}`).get('key') as NodePath<FlowType>));
      //     const member = tsCallSignatureDeclaration([tsIndex], tsTypeAnnotation(convertFlowType(path.get(`indexers.${i}`).get('value') as NodePath<FlowType>)));
      //     members.push(member);
      // }
    } // TSCallSignatureDeclaration | TSConstructSignatureDeclaration | TSMethodSignature ;


    var _ret = types_1.tsTypeLiteral(members);

    if (spreads.length > 0) {
      spreads.unshift(_ret);
      _ret = types_1.tsUnionType(spreads);
    }

    return _ret;
  }

  if (util_1.isNodePath(types_1.isStringLiteralTypeAnnotation, path)) {
    return types_1.tsLiteralType(types_1.stringLiteral(path.node.value));
  }

  if (util_1.isNodePath(types_1.isStringTypeAnnotation, path)) {
    return types_1.tsStringKeyword();
  }

  if (util_1.isNodePath(types_1.isThisTypeAnnotation, path)) {
    return types_1.tsThisType();
  }

  if (util_1.isNodePath(types_1.isTypeofTypeAnnotation, path)) {
    var typeOp = types_1.tsTypeOperator(convertFlowType(path.get('argument')));
    typeOp.operator = 'typeof';
    return typeOp;
  }

  if (util_1.isNodePath(types_1.isUnionTypeAnnotation, path)) {
    var _flowTypes = path.node.types;
    return types_1.tsUnionType(_flowTypes.map(function (_, i) {
      return convertFlowType(path.get("types.".concat(i)));
    }));
  }

  if (util_1.isNodePath(types_1.isVoidTypeAnnotation, path)) {
    return types_1.tsVoidKeyword();
  }

  if (util_1.isNodePath(types_1.isFunctionTypeAnnotation, path)) {
    // https://github.com/bcherny/flow-to-typescript/blob/f1dbe3d1f97b97d655ea6c5f1f5caaaa9f1e0c9f/src/convert.ts
    var node = path.node;
    var typeParams = undefined;

    if (node.typeParameters) {
      typeParams = types_1.tsTypeParameterDeclaration(node.typeParameters.params.map(function (_, i) {
        // TODO: How is this possible?
        if (types_1.isTSTypeParameter(_)) {
          return _;
        }

        var param = types_1.tsTypeParameter(convertFlowType(path.get("typeParameters.params.".concat(i, ".bound"))));
        param.name = _.name;
        return param;
      }));
    }

    var f = types_1.tsFunctionType(typeParams); // Params

    if (node.params) {
      var paramNames = node.params.map(function (_) {
        return _.name;
      }).filter(function (_) {
        return _ !== null;
      }).map(function (_) {
        return _.name;
      });
      f.parameters = node.params.map(function (_, i) {
        var name = _.name && _.name.name; // Generate param name? (Required in TS, optional in Flow)

        if (name == null) {
          name = util_1.generateFreeIdentifier(paramNames);
          paramNames.push(name);
        }

        var id = types_1.identifier(name);

        if (_.typeAnnotation) {
          id.typeAnnotation = types_1.tsTypeAnnotation(convertFlowType(path.get("params.".concat(i, ".typeAnnotation"))));
        }

        return id;
      });
    } // rest parameters


    if (node.rest) {
      if (f.parameters == null) {
        f.parameters = [];
      }

      if (node.rest.name) {
        var _id = types_1.restElement(node.rest.name);

        _id.typeAnnotation = types_1.tsTypeAnnotation(convertFlowType(path.get("rest.typeAnnotation")));
        f.parameters.push(_id);
      }
    } // Return type


    if (node.returnType) {
      f.typeAnnotation = types_1.tsTypeAnnotation(convertFlowType(path.get('returnType')));
    }

    return f;
  }

  if (util_1.isNodePath(types_1.isTupleTypeAnnotation, path)) {
    var _flowTypes2 = path.node.types;
    return types_1.tsTupleType(_flowTypes2.map(function (_, i) {
      return convertFlowType(path.get("types.".concat(i)));
    }));
  }

  throw new util_1.UnsupportedError("FlowType(type=".concat(path.node.type, ")"));
}

exports.convertFlowType = convertFlowType;