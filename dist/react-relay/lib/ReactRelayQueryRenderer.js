/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 * @format
 */

'use strict';

var _classCallCheck3 = _interopRequireDefault(require('babel-runtime/helpers/classCallCheck'));

var _possibleConstructorReturn3 = _interopRequireDefault(require('babel-runtime/helpers/possibleConstructorReturn'));

var _inherits3 = _interopRequireDefault(require('babel-runtime/helpers/inherits'));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function getLoadingRenderProps() {
  return {
    error: null,
    props: null, // `props: null` indicates that the data is being fetched (i.e. loading)
    retry: null
  };
}

function getEmptyRenderProps() {
  return {
    error: null,
    props: {}, // `props: {}` indicates no data available
    retry: null
  };
}

/**
 * @public
 *
 * Orchestrates fetching and rendering data for a single view or view hierarchy:
 * - Fetches the query/variables using the given network implementation.
 * - Normalizes the response(s) to that query, publishing them to the given
 *   store.
 * - Renders the pending/fail/success states with the provided render function.
 * - Subscribes for updates to the root data and re-renders with any changes.
 */
var ReactRelayQueryRenderer = function (_React$Component) {
  (0, _inherits3['default'])(ReactRelayQueryRenderer, _React$Component);

  function ReactRelayQueryRenderer(props, context) {
    (0, _classCallCheck3['default'])(this, ReactRelayQueryRenderer);

    var _this = (0, _possibleConstructorReturn3['default'])(this, _React$Component.call(this, props, context));

    _this._queryFetcher = new (require('./ReactRelayQueryFetcher'))();

    _this._onDataChange = function (_ref) {
      var error = _ref.error,
          snapshot = _ref.snapshot;

      _this.setState({ renderProps: _this._getRenderProps({ error: error, snapshot: snapshot }) });
    };

    _this.state = { renderProps: _this._fetchForProps(_this.props) };
    return _this;
  }

  ReactRelayQueryRenderer.prototype.componentWillReceiveProps = function componentWillReceiveProps(nextProps) {
    if (nextProps.query !== this.props.query || nextProps.environment !== this.props.environment || !require('fbjs/lib/areEqual')(nextProps.variables, this.props.variables)) {
      this.setState({
        renderProps: this._fetchForProps(nextProps)
      });
    }
  };

  ReactRelayQueryRenderer.prototype.componentWillUnmount = function componentWillUnmount() {
    this._queryFetcher.dispose();
  };

  ReactRelayQueryRenderer.prototype.shouldComponentUpdate = function shouldComponentUpdate(nextProps, nextState) {
    return nextProps.render !== this.props.render || nextState.renderProps !== this.state.renderProps;
  };

  ReactRelayQueryRenderer.prototype._getRenderProps = function _getRenderProps(_ref2) {
    var _this2 = this;

    var snapshot = _ref2.snapshot,
        error = _ref2.error;

    return {
      error: error ? error : null,
      props: snapshot ? snapshot.data : null,
      retry: function retry() {
        var syncSnapshot = _this2._queryFetcher.retry();
        if (syncSnapshot) {
          _this2._onDataChange({ snapshot: syncSnapshot });
        } else if (error) {
          // If retrying after an error and no synchronous result available,
          // reset the render props
          _this2.setState({ renderProps: getLoadingRenderProps() });
        }
      }
    };
  };

  ReactRelayQueryRenderer.prototype._fetchForProps = function _fetchForProps(props) {
    // TODO (#16225453) QueryRenderer works with old and new environment, but
    // the flow typing doesn't quite work abstracted.
    var environment = props.environment;

    var query = props.query,
        variables = props.variables;

    if (query) {
      var _environment$unstable = environment.unstable_internal,
          createOperationSelector = _environment$unstable.createOperationSelector,
          getRequest = _environment$unstable.getRequest;

      var request = getRequest(query);
      var operation = createOperationSelector(request, variables);

      this._relayContext = {
        environment: environment,
        variables: operation.variables
      };

      try {
        var snapshot = this._queryFetcher.fetch({
          cacheConfig: props.cacheConfig,
          dataFrom: props.dataFrom,
          environment: environment,
          onDataChange: this._onDataChange,
          operation: operation
        });
        if (!snapshot) {
          return getLoadingRenderProps();
        }
        return this._getRenderProps({ snapshot: snapshot });
      } catch (error) {
        return this._getRenderProps({ error: error });
      }
    }

    this._relayContext = {
      environment: environment,
      variables: variables
    };
    this._queryFetcher.dispose();
    return getEmptyRenderProps();
  };

  ReactRelayQueryRenderer.prototype.getChildContext = function getChildContext() {
    return {
      relay: this._relayContext
    };
  };

  ReactRelayQueryRenderer.prototype.render = function render() {
    // Note that the root fragment results in `renderProps.props` is already
    // frozen by the store; this call is to freeze the renderProps object and
    // error property if set.
    if (process.env.NODE_ENV !== 'production') {
      require('./deepFreeze')(this.state.renderProps);
    }
    return this.props.render(this.state.renderProps);
  };

  return ReactRelayQueryRenderer;
}(require('react').Component);

ReactRelayQueryRenderer.childContextTypes = {
  relay: require('./RelayPropTypes').Relay
};

module.exports = ReactRelayQueryRenderer;