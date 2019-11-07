/**
 * Relay v7.0.0
 */
!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t(require("relay-runtime"),require("react"),require("@babel/runtime/helpers/interopRequireDefault"),require("@babel/runtime/helpers/objectSpread"),require("fbjs/lib/areEqual"),require("fbjs/lib/invariant"),require("@babel/runtime/helpers/inheritsLoose"),require("@babel/runtime/helpers/defineProperty"),require("@babel/runtime/helpers/objectWithoutPropertiesLoose"),require("@babel/runtime/helpers/assertThisInitialized"),require("@babel/runtime/helpers/extends"),require("fbjs/lib/warning"),require("fbjs/lib/mapObject")):"function"==typeof define&&define.amd?define(["relay-runtime","react","@babel/runtime/helpers/interopRequireDefault","@babel/runtime/helpers/objectSpread","fbjs/lib/areEqual","fbjs/lib/invariant","@babel/runtime/helpers/inheritsLoose","@babel/runtime/helpers/defineProperty","@babel/runtime/helpers/objectWithoutPropertiesLoose","@babel/runtime/helpers/assertThisInitialized","@babel/runtime/helpers/extends","fbjs/lib/warning","fbjs/lib/mapObject"],t):"object"==typeof exports?exports.ReactRelay=t(require("relay-runtime"),require("react"),require("@babel/runtime/helpers/interopRequireDefault"),require("@babel/runtime/helpers/objectSpread"),require("fbjs/lib/areEqual"),require("fbjs/lib/invariant"),require("@babel/runtime/helpers/inheritsLoose"),require("@babel/runtime/helpers/defineProperty"),require("@babel/runtime/helpers/objectWithoutPropertiesLoose"),require("@babel/runtime/helpers/assertThisInitialized"),require("@babel/runtime/helpers/extends"),require("fbjs/lib/warning"),require("fbjs/lib/mapObject")):e.ReactRelay=t(e["relay-runtime"],e.react,e["@babel/runtime/helpers/interopRequireDefault"],e["@babel/runtime/helpers/objectSpread"],e["fbjs/lib/areEqual"],e["fbjs/lib/invariant"],e["@babel/runtime/helpers/inheritsLoose"],e["@babel/runtime/helpers/defineProperty"],e["@babel/runtime/helpers/objectWithoutPropertiesLoose"],e["@babel/runtime/helpers/assertThisInitialized"],e["@babel/runtime/helpers/extends"],e["fbjs/lib/warning"],e["fbjs/lib/mapObject"])}(window,function(e,t,r,n,o,a,i,s,u,l,c,p,f){return function(e){var t={};function r(n){if(t[n])return t[n].exports;var o=t[n]={i:n,l:!1,exports:{}};return e[n].call(o.exports,o,o.exports,r),o.l=!0,o.exports}return r.m=e,r.c=t,r.d=function(e,t,n){r.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},r.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(r.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)r.d(n,o,function(t){return e[t]}.bind(null,o));return n},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="",r(r.s=18)}([function(t,r){t.exports=e},function(e,r){e.exports=t},function(e,t){e.exports=r},function(e,t,r){"use strict";var n=r(1),o=r(0).__internal.createRelayContext;e.exports=o(n)},function(e,t){e.exports=n},function(e,t){e.exports=o},function(e,t){e.exports=a},function(e,t){e.exports=i},function(e,t){e.exports=s},function(e,t,r){"use strict";function n(e){return e.displayName||e.name||"Component"}e.exports={getComponentName:n,getContainerName:function(e){return"Relay("+n(e)+")"}}},function(e,t){e.exports=u},function(e,t){e.exports=l},function(e,t,r){"use strict";var n=r(2)(r(13)),o=r(1),a=r(3),i=r(20),s=r(6),u=r(21),l=r(22),c=r(9),p=c.getComponentName,f=c.getContainerName,h=r(0).getFragment;e.exports=function(e,t,r){var c=f(e);i(p(e),t);var d=r(e,u(t,h));function v(e,t){var r=l(a);return null==r&&s(!1,"`%s` tried to render a context that was not valid this means that `%s` was rendered outside of a query renderer.",c,c),o.createElement(d,(0,n.default)({},e,{__relayContext:r,componentRef:e.componentRef||t}))}d.displayName=c,v.displayName=c;var b=o.forwardRef(v);return b.__ComponentClass=e,b.displayName=c,b}},function(e,t){e.exports=c},function(e,t,r){"use strict";var n=r(2)(r(4)),o=r(0).getSelector;e.exports=function(e,t){var r={};return Object.keys(e).forEach(function(a){var i,s,u,l=e[a],c=t[a],p=o(l,c),f=null!=p&&"PluralReaderSelector"===p.kind?null!==(i=null===(s=p.selectors[0])||void 0===s?void 0:s.owner.variables)&&void 0!==i?i:{}:null!==(u=null==p?void 0:p.owner.variables)&&void 0!==u?u:{};r=(0,n.default)({},r,f)}),r}},function(e,t,r){"use strict";var n=r(6),o=r(23);function a(e){return"object"==typeof e&&null!==e&&!Array.isArray(e)&&o(e.environment)}e.exports={assertRelayContext:function(e){return a(e)||n(!1,"RelayContext: Expected `context.relay` to be an object conforming to the `RelayContext` interface, got `%s`.",e),e},isRelayContext:a}},function(e,t,r){"use strict";var n=r(2)(r(8)),o=r(6),a=r(0),i=a.isRelayModernEnvironment,s=a.__internal.fetchQuery,u=function(){function e(e){(0,n.default)(this,"_selectionReferences",[]),(0,n.default)(this,"_callOnDataChangeWhenSet",!1),null!=e&&(this._cacheSelectionReference=e.cacheSelectionReference,this._selectionReferences=e.selectionReferences)}var t=e.prototype;return t.getSelectionReferences=function(){return{cacheSelectionReference:this._cacheSelectionReference,selectionReferences:this._selectionReferences}},t.lookupInStore=function(e,t,r){return"store-and-network"!==r&&"store-or-network"!==r||!e.check(t.root)?null:(this._retainCachedOperation(e,t),e.lookup(t.fragment))},t.execute=function(e){var t=this,r=e.environment,n=e.operation,o=e.cacheConfig,a=e.preservePreviousReferences,u=void 0!==a&&a,l=r.retain(n.root),c=null!=o?{networkCacheConfig:o}:{},p=function(){t._selectionReferences=t._selectionReferences.concat(l)},f=function(){u||t.disposeSelectionReferences(),t._selectionReferences=t._selectionReferences.concat(l)},h=function(){t._selectionReferences=t._selectionReferences.concat(l)};return i(r)?s(r,n,c).do({error:p,complete:f,unsubscribe:h}):r.execute({operation:n,cacheConfig:o}).do({error:p,complete:f,unsubscribe:h})},t.setOnDataChange=function(e){this._fetchOptions||o(!1,"ReactRelayQueryFetcher: `setOnDataChange` should have been called after having called `fetch`"),"function"==typeof e&&(this._fetchOptions.onDataChangeCallbacks=this._fetchOptions.onDataChangeCallbacks||[],this._fetchOptions.onDataChangeCallbacks.push(e),this._callOnDataChangeWhenSet&&(null!=this._error?e({error:this._error}):null!=this._snapshot&&e({snapshot:this._snapshot})))},t.fetch=function(e,t){var r,n,o=this,a=e.cacheConfig,i=e.environment,s=e.operation,u=e.onDataChange,l=!1;this.disposeRequest();var c=this._fetchOptions&&this._fetchOptions.onDataChangeCallbacks;this._fetchOptions={cacheConfig:a,environment:i,onDataChangeCallbacks:c||[],operation:s},u&&-1===this._fetchOptions.onDataChangeCallbacks.indexOf(u)&&this._fetchOptions.onDataChangeCallbacks.push(u);var p=this.execute({environment:i,operation:s,cacheConfig:null!==(r=t)&&void 0!==r?r:a}).finally(function(){o._pendingRequest=null}).subscribe({next:function(){o._callOnDataChangeWhenSet=!0,o._error=null,o._onQueryDataAvailable({notifyFirstResult:l})},error:function(e){o._callOnDataChangeWhenSet=!0,o._error=e,o._snapshot=null;var t=o._fetchOptions&&o._fetchOptions.onDataChangeCallbacks;l?t&&t.forEach(function(t){t({error:e})}):n=e}});if(this._pendingRequest={dispose:function(){p.unsubscribe()}},l=!0,n)throw n;return this._snapshot},t.retry=function(e){return this._fetchOptions||o(!1,"ReactRelayQueryFetcher: `retry` should be called after having called `fetch`"),this.fetch({cacheConfig:this._fetchOptions.cacheConfig,environment:this._fetchOptions.environment,operation:this._fetchOptions.operation,onDataChange:null},e)},t.dispose=function(){this.disposeRequest(),this.disposeSelectionReferences()},t.disposeRequest=function(){this._error=null,this._snapshot=null,this._pendingRequest&&this._pendingRequest.dispose(),this._rootSubscription&&(this._rootSubscription.dispose(),this._rootSubscription=null)},t._retainCachedOperation=function(e,t){this._disposeCacheSelectionReference(),this._cacheSelectionReference=e.retain(t.root)},t._disposeCacheSelectionReference=function(){this._cacheSelectionReference&&this._cacheSelectionReference.dispose(),this._cacheSelectionReference=null},t.disposeSelectionReferences=function(){this._disposeCacheSelectionReference(),this._selectionReferences.forEach(function(e){return e.dispose()}),this._selectionReferences=[]},t._onQueryDataAvailable=function(e){var t=this,r=e.notifyFirstResult;this._fetchOptions||o(!1,"ReactRelayQueryFetcher: `_onQueryDataAvailable` should have been called after having called `fetch`");var n=this._fetchOptions,a=n.environment,i=n.onDataChangeCallbacks,s=n.operation;if(!this._snapshot&&(this._snapshot=a.lookup(s.fragment),this._rootSubscription=a.subscribe(this._snapshot,function(e){if(null!=t._fetchOptions){var r=t._fetchOptions.onDataChangeCallbacks;Array.isArray(r)&&r.forEach(function(t){return t({snapshot:e})})}}),this._snapshot&&r&&Array.isArray(i))){var u=this._snapshot;i.forEach(function(e){return e({snapshot:u})})}},e}();e.exports=u},function(e,t){e.exports=p},function(e,t,r){"use strict";var n=r(3),o=r(19),a=r(24),i=r(25),s=r(26),u=r(27),l=r(0);e.exports={ConnectionHandler:l.ConnectionHandler,QueryRenderer:s,LocalQueryRenderer:a,MutationTypes:l.MutationTypes,RangeOperations:l.RangeOperations,ReactRelayContext:n,applyOptimisticMutation:l.applyOptimisticMutation,commitLocalUpdate:l.commitLocalUpdate,commitMutation:l.commitMutation,createFragmentContainer:o.createContainer,createPaginationContainer:i.createContainer,createRefetchContainer:u.createContainer,fetchQuery:l.fetchQuery,graphql:l.graphql,readInlineData:l.readInlineData,requestSubscription:l.requestSubscription}},function(e,t,r){"use strict";var n=r(2),o=n(r(4)),a=n(r(10)),i=n(r(11)),s=n(r(7)),u=n(r(8)),l=r(1),c=r(5),p=r(12),f=(r(14),r(9).getContainerName),h=r(15).assertRelayContext,d=r(0),v=d.createFragmentSpecResolver,b=d.getDataIDsFromObject,y=d.isScalarAndEqual;function m(e,t){var r,n,p=f(e);return n=r=function(r){function n(e){var n;n=r.call(this,e)||this,(0,u.default)((0,i.default)(n),"_handleFragmentDataUpdate",function(){var e=n.state.resolver;n.setState(function(t){return e===t.resolver?{data:t.resolver.resolve(),relayProp:_(t.relayProp.environment)}:null})});var o=h(e.__relayContext),a=v(o,p,t,e);return n.state={data:a.resolve(),prevProps:e,prevPropsContext:o,relayProp:_(o.environment),resolver:a},n}(0,s.default)(n,r),n.getDerivedStateFromProps=function(e,r){var n=r.prevProps,o=h(e.__relayContext),a=b(t,n),i=b(t,e),s=r.resolver;if(r.prevPropsContext.environment!==o.environment||!c(a,i))return{data:(s=v(o,p,t,e)).resolve(),prevPropsContext:o,prevProps:e,relayProp:_(o.environment),resolver:s};s.setProps(e);var u=s.resolve();return u!==r.data?{data:u,prevProps:e,prevPropsContext:o,relayProp:_(o.environment)}:null};var f=n.prototype;return f.componentDidMount=function(){this._subscribeToNewResolver(),this._rerenderIfStoreHasChanged()},f.componentDidUpdate=function(e,t){this.state.resolver!==t.resolver&&(t.resolver.dispose(),this._subscribeToNewResolver()),this._rerenderIfStoreHasChanged()},f.componentWillUnmount=function(){this.state.resolver.dispose()},f.shouldComponentUpdate=function(e,r){if(r.data!==this.state.data)return!0;for(var n=Object.keys(e),o=0;o<n.length;o++){var a=n[o];if("__relayContext"===a){if(r.prevPropsContext.environment!==this.state.prevPropsContext.environment)return!0}else if(!t.hasOwnProperty(a)&&!y(e[a],this.props[a]))return!0}return!1},f._rerenderIfStoreHasChanged=function(){var e=this.state,t=e.data,r=e.resolver.resolve();t!==r&&this.setState({data:r})},f._subscribeToNewResolver=function(){this.state.resolver.setCallback(this._handleFragmentDataUpdate)},f.render=function(){var t=this.props,r=t.componentRef,n=(t.__relayContext,(0,a.default)(t,["componentRef","__relayContext"]));return l.createElement(e,(0,o.default)({},n,this.state.data,{ref:r,relay:this.state.relayProp}))},n}(l.Component),(0,u.default)(r,"displayName",p),n}function _(e){return{environment:e}}e.exports={createContainer:function(e,t){return p(e,t,m)}}},function(e,t,r){"use strict";var n=r(6);e.exports=function(e,t){for(var r in t&&"object"==typeof t||n(!1,"Could not create Relay Container for `%s`. Expected a set of GraphQL fragments, got `%s` instead.",e,t),t)if(t.hasOwnProperty(r)){var o=t[r];(!o||"object"!=typeof o&&"function"!=typeof o)&&n(!1,"Could not create Relay Container for `%s`. The value of fragment `%s` was expected to be a fragment, got `%s` instead.",e,r,o)}}},function(e,t){e.exports=f},function(e,t,r){"use strict";var n=r(1).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,o=n.ReactCurrentDispatcher,a=n.ReactCurrentOwner;e.exports=function(e){return(null!=o?o.current:a.currentDispatcher).readContext(e)}},function(e,t,r){"use strict";e.exports=function(e){return"object"==typeof e&&null!==e&&"function"==typeof e.check&&"function"==typeof e.lookup&&"function"==typeof e.retain&&"function"==typeof e.execute&&"function"==typeof e.subscribe}},function(e,t,r){"use strict";var n=r(1),o=r(3),a=n.useLayoutEffect,i=n.useState,s=n.useRef,u=n.useMemo,l=r(0),c=l.createOperationDescriptor,p=l.deepFreeze,f=l.getRequest,h=r(5);e.exports=function(e){var t,r,l=e.environment,d=e.query,v=e.variables,b=e.render,y=(t=v,r=n.useRef(t),h(r.current,t)||(p(t),r.current=t),r.current),m=u(function(){var e=f(d);return c(e,y)},[d,y]),_=u(function(){return{environment:l}},[l]),C=s(null),g=i(null)[1],R=s(null),x=u(function(){l.check(m.root);var e=l.lookup(m.fragment);C.current=e.data;var t=l.retain(m.root),r=l.subscribe(e,function(e){C.current=e.data,g(C.current)}),n=!1;return R.current&&R.current(),R.current=function(){n||(n=!0,R.current=null,t.dispose(),r.dispose())},e},[l,m]);return a(function(){var e=R.current;return function(){e&&e()}},[x]),n.createElement(o.Provider,{value:_},b({props:C.current}))}},function(e,t,r){"use strict";var n=r(2),o=n(r(13)),a=n(r(10)),i=n(r(11)),s=n(r(7)),u=n(r(8)),l=n(r(4)),c=r(1),p=r(3),f=r(16),h=r(5),d=r(12),v=r(14),b=r(6),y=r(17),m=r(9),_=m.getComponentName,C=m.getContainerName,g=r(15).assertRelayContext,R=r(0),x=R.ConnectionInterface,P=R.Observable,q=R.createFragmentSpecResolver,S=R.createOperationDescriptor,F=R.getDataIDsFromObject,O=R.getRequest,D=(R.getSelector,R.getVariablesFromObject),j=R.isScalarAndEqual,E="forward";function w(e){return"function"==typeof e?{error:e,complete:e,unsubscribe:function(t){"function"==typeof e&&e()}}:e||{}}function k(e,t,r){var n,d,m=_(e),R=C(e),k=function(e){var t=null,r=!1;for(var n in e){var o=e[n],a=o.metadata&&o.metadata.connection;void 0!==o.metadata&&(r=!0),a&&(1!==a.length&&b(!1,"ReactRelayPaginationContainer: Only a single @connection is supported, `%s` has %s.",n,a.length),t&&b(!1,"ReactRelayPaginationContainer: Only a single fragment with @connection is supported."),t=(0,l.default)({},a[0],{fragmentName:n}))}return r&&null===t&&b(!1,"ReactRelayPaginationContainer: A @connection directive must be present."),t||{}}(t),U=r.getConnectionFromProps||function(e){var t=e.path;return t||b(!1,"ReactRelayPaginationContainer: Unable to synthesize a getConnectionFromProps function."),function(r){for(var n=r[e.fragmentName],o=0;o<t.length;o++){if(!n||"object"!=typeof n)return null;n=n[t[o]]}return n}}(k),A=r.direction||k.direction;A||b(!1,"ReactRelayPaginationContainer: Unable to infer direction of the connection, possibly because both first and last are provided.");var N=r.getFragmentVariables||function(e){var t=e.count;return t||b(!1,"ReactRelayPaginationContainer: Unable to synthesize a getFragmentVariables function."),function(e,r){return(0,l.default)({},e,(0,u.default)({},t,r))}}(k);return d=n=function(n){function d(e){var r;r=n.call(this,e)||this,(0,u.default)((0,i.default)(r),"_handleFragmentDataUpdate",function(){r.setState({data:r._resolver.resolve()})}),(0,u.default)((0,i.default)(r),"_hasMore",function(){var e=r._getConnectionData();return!!(e&&e.hasMore&&e.cursor)}),(0,u.default)((0,i.default)(r),"_isLoading",function(){return!!r._refetchSubscription}),(0,u.default)((0,i.default)(r),"_refetchConnection",function(e,t,n){if(!r._canFetchPage("refetchConnection"))return{dispose:function(){}};r._refetchVariables=n;var o={count:e,cursor:null,totalCount:e};return{dispose:r._fetchPage(o,w(t),{force:!0}).unsubscribe}}),(0,u.default)((0,i.default)(r),"_loadMore",function(e,t,n){if(!r._canFetchPage("loadMore"))return{dispose:function(){}};var o=w(t),a=r._getConnectionData();if(!a)return P.create(function(e){return e.complete()}).subscribe(o),null;var i=a.edgeCount+e;if(n&&n.force)return r._refetchConnection(i,t);var s=x.get(),u=s.END_CURSOR,l=s.START_CURSOR,c=a.cursor;y(null!=c&&""!==c,"ReactRelayPaginationContainer: Cannot `loadMore` without valid `%s` (got `%s`)",A===E?u:l,c);var p={count:e,cursor:c,totalCount:i};return{dispose:r._fetchPage(p,o,n).unsubscribe}});var o=g(e.__relayContext);return r._isARequestInFlight=!1,r._refetchSubscription=null,r._refetchVariables=null,r._resolver=q(o,R,t,e,r._handleFragmentDataUpdate),r.state={data:r._resolver.resolve(),prevContext:o,contextForChildren:o,relayProp:r._buildRelayProp(o)},r._isUnmounted=!1,r._hasFetched=!1,r}(0,s.default)(d,n);var _=d.prototype;return _.UNSAFE_componentWillReceiveProps=function(e){var r=g(e.__relayContext),n=F(t,this.props),o=F(t,e),a=v(t,this.props),i=v(t,e);r.environment===this.state.prevContext.environment&&h(a,i)&&h(n,o)?this._hasFetched||this._resolver.setProps(e):(this._cleanup(),this._resolver=q(r,R,t,e,this._handleFragmentDataUpdate),this.setState({prevContext:r,contextForChildren:r,relayProp:this._buildRelayProp(r)}));var s=this._resolver.resolve();s!==this.state.data&&this.setState({data:s})},_.componentWillUnmount=function(){this._isUnmounted=!0,this._cleanup()},_.shouldComponentUpdate=function(e,r){if(r.data!==this.state.data||r.relayProp!==this.state.relayProp)return!0;for(var n=Object.keys(e),o=0;o<n.length;o++){var a=n[o];if("__relayContext"===a){if(r.prevContext.environment!==this.state.prevContext.environment)return!0}else if(!t.hasOwnProperty(a)&&!j(e[a],this.props[a]))return!0}return!1},_._buildRelayProp=function(e){return{hasMore:this._hasMore,isLoading:this._isLoading,loadMore:this._loadMore,refetchConnection:this._refetchConnection,environment:e.environment}},_._getConnectionData=function(){var e=this.props,t=(e.componentRef,(0,a.default)(e,["componentRef"])),r=(0,l.default)({},t,this.state.data),n=U(r);if(null==n)return null;var o=x.get(),i=o.EDGES,s=o.PAGE_INFO,u=o.HAS_NEXT_PAGE,c=o.HAS_PREV_PAGE,p=o.END_CURSOR,f=o.START_CURSOR;"object"!=typeof n&&b(!1,"ReactRelayPaginationContainer: Expected `getConnectionFromProps()` in `%s`to return `null` or a plain object with %s and %s properties, got `%s`.",m,i,s,n);var h=n[i],d=n[s];if(null==h||null==d)return null;Array.isArray(h)||b(!1,"ReactRelayPaginationContainer: Expected `getConnectionFromProps()` in `%s`to return an object with %s: Array, got `%s`.",m,i,h),"object"!=typeof d&&b(!1,"ReactRelayPaginationContainer: Expected `getConnectionFromProps()` in `%s`to return an object with %s: Object, got `%s`.",m,s,d);var v=A===E?d[u]:d[c],_=A===E?d[p]:d[f];return"boolean"!=typeof v||0!==h.length&&void 0===_?(y(!1,"ReactRelayPaginationContainer: Cannot paginate without %s fields in `%s`. Be sure to fetch %s (got `%s`) and %s (got `%s`).",s,m,A===E?u:c,v,A===E?p:f,_),null):{cursor:_,edgeCount:h.length,hasMore:v}},_._getQueryFetcher=function(){return this._queryFetcher||(this._queryFetcher=new f),this._queryFetcher},_._canFetchPage=function(e){return!this._isUnmounted||(y(!1,"ReactRelayPaginationContainer: Unexpected call of `%s` on unmounted container `%s`. It looks like some instances of your container still trying to fetch data but they already unmounted. Please make sure you clear all timers, intervals, async calls, etc that may trigger `%s` call.",e,R,e),!1)},_._fetchPage=function(e,n,o){var i,s=this,u=g(this.props.__relayContext).environment,c=this.props,p=(c.componentRef,c.__relayContext,(0,a.default)(c,["componentRef","__relayContext"])),f=(0,l.default)({},p,this.state.data),d=v(t,p);i=D(t,p),i=(0,l.default)({},d,i,this._refetchVariables);var y=r.getVariables(f,{count:e.count,cursor:e.cursor},i);("object"!=typeof y||null===y)&&b(!1,"ReactRelayPaginationContainer: Expected `getVariables()` to return an object, got `%s` in `%s`.",y,m),y=(0,l.default)({},y,this._refetchVariables),i=(0,l.default)({},y,i);var _=o?{force:!!o.force}:void 0;null!=_&&null!=(null==o?void 0:o.metadata)&&(_.metadata=null==o?void 0:o.metadata);var C=O(r.query),R=S(C,y),x=null;this._refetchSubscription&&this._refetchSubscription.unsubscribe(),this._hasFetched=!0;var q=function(){s._refetchSubscription===x&&(s._refetchSubscription=null,s._isARequestInFlight=!1)};return this._isARequestInFlight=!0,x=this._getQueryFetcher().execute({environment:u,operation:R,cacheConfig:_,preservePreviousReferences:!0}).mergeMap(function(t){return P.create(function(t){!function(t,r){var n=s._resolver.resolve();s._resolver.setVariables(N(i,e.totalCount),R.request.node);var o=s._resolver.resolve();h(n,o)?r():s.setState({data:o,contextForChildren:{environment:s.props.__relayContext.environment}},r)}(0,function(){t.next(),t.complete()})})}).do({error:q,complete:q,unsubscribe:q}).subscribe(n||{}),this._refetchSubscription=this._isARequestInFlight?x:null,x},_._cleanup=function(){this._resolver.dispose(),this._refetchVariables=null,this._hasFetched=!1,this._refetchSubscription&&(this._refetchSubscription.unsubscribe(),this._refetchSubscription=null,this._isARequestInFlight=!1),this._queryFetcher&&this._queryFetcher.dispose()},_.render=function(){var t=this.props,r=t.componentRef,n=(t.__relayContext,(0,a.default)(t,["componentRef","__relayContext"]));return c.createElement(p.Provider,{value:this.state.contextForChildren},c.createElement(e,(0,o.default)({},n,this.state.data,{ref:r,relay:this.state.relayProp})))},d}(c.Component),(0,u.default)(n,"displayName",R),d}e.exports={createContainer:function(e,t,r){return d(e,t,function(e,t){return k(e,t,r)})}}},function(e,t,r){"use strict";var n=r(2),o=n(r(4)),a=n(r(7)),i=r(1),s=r(3),u=r(16),l=r(5),c=r(0),p=c.createOperationDescriptor,f=c.deepFreeze,h=c.getRequest,d={},v=function(e){function t(t){var r;r=e.call(this,t)||this;var n,a,i={handleDataChange:null,handleRetryAfterError:null};if(t.query){var s=t.query;a=y(h(s).params,t.variables),n=d[a]?d[a].queryFetcher:new u}else n=new u;return r.state=(0,o.default)({prevPropsEnvironment:t.environment,prevPropsVariables:t.variables,prevQuery:t.query,queryFetcher:n,retryCallbacks:i},m(t,n,i,a)),r}(0,a.default)(t,e),t.getDerivedStateFromProps=function(e,t){if(t.prevQuery!==e.query||t.prevPropsEnvironment!==e.environment||!l(t.prevPropsVariables,e.variables)){var r,n=e.query,a=t.queryFetcher.getSelectionReferences();if(t.queryFetcher.disposeRequest(),n){var i=y(h(n).params,e.variables);r=d[i]?d[i].queryFetcher:new u(a)}else r=new u(a);return(0,o.default)({prevQuery:e.query,prevPropsEnvironment:e.environment,prevPropsVariables:e.variables,queryFetcher:r},m(e,r,t.retryCallbacks))}return null};var r=t.prototype;return r.componentDidMount=function(){var e=this,t=this.state,r=t.retryCallbacks,n=t.queryFetcher,o=t.requestCacheKey;o&&delete d[o],r.handleDataChange=function(t){var r=null==t.error?null:t.error,n=null==t.snapshot?null:t.snapshot;e.setState(function(e){var t=e.requestCacheKey;return t&&delete d[t],n===e.snapshot&&r===e.error?null:{renderProps:b(r,n,e.queryFetcher,e.retryCallbacks),snapshot:n,requestCacheKey:null}})},r.handleRetryAfterError=function(t){return e.setState(function(e){var t=e.requestCacheKey;return t&&delete d[t],{renderProps:{error:null,props:null,retry:null},requestCacheKey:null}})},this.props.query&&n.setOnDataChange(r.handleDataChange)},r.componentDidUpdate=function(){var e=this.state.requestCacheKey;e&&(delete d[e],delete this.state.requestCacheKey)},r.componentWillUnmount=function(){var e=this.state.queryFetcher,t=this.props,r=t.environment,n=t.query,o=t.variables;setTimeout(function(){if(e.dispose(),r&&r.unregisterQuery){var t=y(h(n).params,o);r.unregisterQuery(t)}},3e5)},r.shouldComponentUpdate=function(e,t){return e.render!==this.props.render||t.renderProps!==this.state.renderProps},r.render=function(){var e=this.state,t=e.renderProps,r=e.relayContext;return f(t),i.createElement(s.Provider,{value:r},this.props.render(t))},t}(i.Component);function b(e,t,r,n){return{error:e||null,props:t?t.data:null,retry:function(t){var o=r.retry(t);o&&"function"==typeof n.handleDataChange?n.handleDataChange({snapshot:o}):e&&"function"==typeof n.handleRetryAfterError&&n.handleRetryAfterError(e)}}}function y(e,t){var r=e.id||e.text;return JSON.stringify({id:String(r),variables:t})}function m(e,t,r,n){var o=e.environment,a=e.query,i=e.variables,s=o;if(!a)return t.dispose(),{error:null,relayContext:{environment:s},renderProps:{error:null,props:{},retry:null},requestCacheKey:null};var u=h(a),l=p(u,i),c={environment:s};if("string"==typeof n&&d[n]){var f=d[n].snapshot;return f?{error:null,relayContext:c,renderProps:b(null,f,t,r),snapshot:f,requestCacheKey:n}:{error:null,relayContext:c,renderProps:{error:null,props:null,retry:null},snapshot:null,requestCacheKey:n}}try{var v=t.lookupInStore(s,l,e.fetchPolicy),m="store-or-network"!==e.fetchPolicy||!v,_=m?t.fetch({cacheConfig:e.cacheConfig,environment:s,onDataChange:r.handleDataChange,operation:l}):null;m||(t._fetchOptions={cacheConfig:e.cacheConfig,environment:e.environment,onDataChange:r.handleDataChange,operation:l});var C=_||v;return n=n||y(u.params,e.variables),d[n]={queryFetcher:t,snapshot:C},C?{error:null,relayContext:c,renderProps:b(null,C,t,r),snapshot:C,requestCacheKey:n}:{error:null,relayContext:c,renderProps:{error:null,props:null,retry:null},snapshot:null,requestCacheKey:n}}catch(e){return{error:e,relayContext:c,renderProps:b(e,null,t,r),snapshot:null,requestCacheKey:n}}}e.exports=v},function(e,t,r){"use strict";var n=r(2),o=n(r(13)),a=n(r(10)),i=n(r(4)),s=n(r(11)),u=n(r(7)),l=n(r(8)),c=r(1),p=r(3),f=r(16),h=r(5),d=r(12),v=r(14),b=r(17),y=r(9).getContainerName,m=r(15).assertRelayContext,_=r(0),C=_.Observable,g=_.createFragmentSpecResolver,R=_.createOperationDescriptor,x=_.getDataIDsFromObject,P=_.getRequest,q=(_.getSelector,_.getVariablesFromObject),S=_.isScalarAndEqual;function F(e,t){return{environment:e,refetch:t}}e.exports={createContainer:function(e,t,r){return d(e,t,function(e,t){return function(e,t,r){var n,d,_=y(e);return d=n=function(n){function d(e){var o;o=n.call(this,e)||this,(0,l.default)((0,s.default)(o),"_handleFragmentDataUpdate",function(){var e=o.state.resolver;o.setState(function(t){return e===t.resolver?{data:t.resolver.resolve()}:null})}),(0,l.default)((0,s.default)(o),"_refetch",function(e,n,a,s){if(o._isUnmounted)return b(!1,"ReactRelayRefetchContainer: Unexpected call of `refetch` on unmounted container `%s`. It looks like some instances of your container still trying to refetch the data but they already unmounted. Please make sure you clear all timers, intervals, async calls, etc that may trigger `refetch`.",_),{dispose:function(){}};var u=m(o.props.__relayContext).environment,l=v(t,o.props),c="function"==typeof e?e(o._getFragmentVariables()):e;c=(0,i.default)({},l,c);var p=n?(0,i.default)({},c,n):c,f=s?{force:!!s.force}:void 0;null!=f&&null!=(null==s?void 0:s.metadata)&&(f.metadata=null==s?void 0:s.metadata);var h,d="function"==typeof a?{next:a,error:a}:a||{},y=P(r),g=R(y,c);return o.state.localVariables=c,o._refetchSubscription&&o._refetchSubscription.unsubscribe(),null!=o._getQueryFetcher().lookupInStore(u,g,null==s?void 0:s.fetchPolicy)?(o.state.resolver.setVariables(p,g.request.node),o.setState(function(e){return{data:e.resolver.resolve(),contextForChildren:{environment:o.props.__relayContext.environment}}},function(){d.next&&d.next(),d.complete&&d.complete()}),{dispose:function(){}}):(o._getQueryFetcher().execute({environment:u,operation:g,cacheConfig:f,preservePreviousReferences:!0}).mergeMap(function(e){return o.state.resolver.setVariables(p,g.request.node),C.create(function(e){return o.setState(function(e){return{data:e.resolver.resolve(),contextForChildren:{environment:o.props.__relayContext.environment}}},function(){e.next(),e.complete()})})}).finally(function(){o._refetchSubscription===h&&(o._refetchSubscription=null)}).subscribe((0,i.default)({},d,{start:function(e){o._refetchSubscription=h=e,d.start&&d.start(e)}})),{dispose:function(){h&&h.unsubscribe()}})});var a=m(e.__relayContext);o._refetchSubscription=null;var u=g(a,_,t,e);return o.state={data:u.resolve(),localVariables:null,prevProps:e,prevPropsContext:a,contextForChildren:a,relayProp:F(a.environment,o._refetch),resolver:u},o._isUnmounted=!1,o}(0,u.default)(d,n);var y=d.prototype;return y.componentDidMount=function(){this._subscribeToNewResolver()},y.componentDidUpdate=function(e,t){this.state.resolver!==t.resolver&&(t.resolver.dispose(),this._queryFetcher&&this._queryFetcher.dispose(),this._refetchSubscription&&this._refetchSubscription.unsubscribe(),this._subscribeToNewResolver())},d.getDerivedStateFromProps=function(e,r){var n=r.prevProps,o=m(e.__relayContext),a=x(t,n),i=x(t,e),s=v(t,n),u=v(t,e),l=r.resolver;if(r.prevPropsContext.environment!==o.environment||!h(s,u)||!h(a,i))return{data:(l=g(o,_,t,e)).resolve(),localVariables:null,prevProps:e,prevPropsContext:o,contextForChildren:o,relayProp:F(o.environment,r.relayProp.refetch),resolver:l};r.localVariables||l.setProps(e);var c=l.resolve();return c!==r.data?{data:c,prevProps:e}:null},y.componentWillUnmount=function(){this._isUnmounted=!0,this.state.resolver.dispose(),this._queryFetcher&&this._queryFetcher.dispose(),this._refetchSubscription&&this._refetchSubscription.unsubscribe()},y.shouldComponentUpdate=function(e,r){if(r.data!==this.state.data||r.relayProp!==this.state.relayProp)return!0;for(var n=Object.keys(e),o=0;o<n.length;o++){var a=n[o];if("__relayContext"===a){if(this.state.prevPropsContext.environment!==r.prevPropsContext.environment)return!0}else if(!t.hasOwnProperty(a)&&!S(e[a],this.props[a]))return!0}return!1},y._subscribeToNewResolver=function(){var e=this.state,t=e.data,r=e.resolver;r.setCallback(this._handleFragmentDataUpdate);var n=r.resolve();t!==n&&this.setState({data:n})},y._getFragmentVariables=function(){return q(t,this.props)},y._getQueryFetcher=function(){return this._queryFetcher||(this._queryFetcher=new f),this._queryFetcher},y.render=function(){var t=this.props,r=t.componentRef,n=(t.__relayContext,(0,a.default)(t,["componentRef","__relayContext"])),i=this.state,s=i.relayProp,u=i.contextForChildren;return c.createElement(p.Provider,{value:u},c.createElement(e,(0,o.default)({},n,this.state.data,{ref:r,relay:s})))},d}(c.Component),(0,l.default)(n,"displayName",_),d}(e,t,r)})}}}])});