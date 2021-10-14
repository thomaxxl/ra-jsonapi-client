"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _qs = require("qs");

var _deepmerge = _interopRequireDefault(require("deepmerge"));

var _axios = _interopRequireDefault(require("axios"));

var _actions = require("./actions");

var _defaultSettings = _interopRequireDefault(require("./default-settings"));

var _errors = require("./errors");

var _initializer = _interopRequireDefault(require("./initializer"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// Set HTTP interceptors.
(0, _initializer["default"])();
/**
 * Maps react-admin queries to a JSONAPI REST API
 *
 * @param {string} apiUrl the base URL for the JSONAPI
 * @param {Object} userSettings Settings to configure this client.
 *
 * @param {string} type Request type, e.g GET_LIST
 * @param {string} resource Resource name, e.g. "posts"
 * @param {Object} payload Request parameters. Depends on the request type
 * @returns {Promise} the Promise for a data response
 */

var _default = function _default(apiUrl) {
  var userSettings = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  return function (type, resource, params) {
    var url = '';
    var settings = (0, _deepmerge["default"])(_defaultSettings["default"], userSettings);
    var options = {
      headers: settings.headers
    };

    switch (type) {
      case _actions.GET_LIST:
        {
          var _params$pagination = params.pagination,
              page = _params$pagination.page,
              perPage = _params$pagination.perPage; // Create query with pagination params.

          var query = {
            'page[number]': page,
            'page[size]': perPage,
            'page[limit]': perPage
          }; // Add all filter params to query.

          Object.keys(params.filter || {}).forEach(function (key) {
            query["filter[".concat(key, "]")] = params.filter[key];
          }); // Add sort parameter

          if (params.sort && params.sort.field) {
            var prefix = params.sort.order === 'ASC' ? '' : '-';
            query.sort = "".concat(prefix).concat(params.sort.field);
          }

          url = "".concat(apiUrl, "/").concat(resource, "?").concat((0, _qs.stringify)(query));
          break;
        }

      case _actions.GET_ONE:
        url = "".concat(apiUrl, "/").concat(resource, "/").concat(params.id, "?%2Ball");
        break;

      case _actions.CREATE:
        url = "".concat(apiUrl, "/").concat(resource);
        options.method = 'POST';
        options.data = JSON.stringify({
          data: {
            type: resource,
            attributes: params.data
          }
        });
        break;

      case _actions.UPDATE:
        {
          url = "".concat(apiUrl, "/").concat(resource, "/").concat(params.id);
          var attributes = params.data;
          delete attributes.id;
          var data = {
            data: {
              id: params.id,
              type: params.type ? params.type : resource,
              attributes: attributes
            }
          };
          options.method = settings.updateMethod;
          options.data = JSON.stringify(data);
          break;
        }

      case _actions.DELETE:
        url = "".concat(apiUrl, "/").concat(resource, "/").concat(params.id);
        options.method = 'DELETE';
        options["data"] = {};
        break;

      case _actions.GET_MANY:
        {
          var _query = (0, _qs.stringify)({
            'filter[id]': params.ids
          }, {
            arrayFormat: settings.arrayFormat
          });

          url = "".concat(apiUrl, "/").concat(resource, "?").concat(_query);
          break;
        }

      case _actions.GET_MANY_REFERENCE:
        {
          var _params$pagination2 = params === null || params === void 0 ? void 0 : params.pagination,
              _page = _params$pagination2.page,
              _perPage = _params$pagination2.perPage; // Create query with pagination params.


          var _query2 = {
            'page[number]': _page,
            'page[size]': _perPage
          }; // Add all filter params to query.

          Object.keys(params.filter || {}).forEach(function (key) {
            _query2["filter[".concat(key, "]")] = params.filter[key];
          }); // Add the reference id to the filter params.

          _query2["filter[".concat(params.target, "]")] = params.id; // Add sort parameter

          if (params.sort && params.sort.field) {
            var _prefix = params.sort.order === 'ASC' ? '' : '-';

            _query2.sort = "".concat(_prefix).concat(params.sort.field);
          }

          url = "".concat(apiUrl, "/").concat(resource, "?").concat((0, _qs.stringify)(_query2));
          break;
        }

      default:
        throw new _errors.NotImplementedError("Unsupported Data Provider request type ".concat(type));
    }

    return (0, _axios["default"])(_objectSpread({
      url: url
    }, options)).then(function (response) {
      var total; // For all collection requests get the total count.

      if ([_actions.GET_LIST, _actions.GET_MANY, _actions.GET_MANY_REFERENCE].includes(type)) {
        // When meta data and the 'total' setting is provided try
        // to get the total count.
        if (response.data.meta && settings.total) {
          total = response.data.meta[settings.total];
        } // Use the length of the data array as a fallback.


        total = total || response.data.data.length;
      }

      switch (type) {
        case _actions.GET_MANY:
        case _actions.GET_LIST:
          {
            return {
              data: response.data.data.map(function (value) {
                return Object.assign({
                  id: value.id
                }, value.attributes);
              }),
              total: total
            };
          }

        case _actions.GET_MANY_REFERENCE:
          {
            return {
              data: response.data.data.map(function (value) {
                return Object.assign({
                  id: value.id
                }, value.attributes);
              }),
              total: total
            };
          }

        case _actions.GET_ONE:
          {
            var _response$data$data2;

            var _response$data$data = response.data.data,
                id = _response$data$data.id,
                _attributes = _response$data$data.attributes;
            var relationships = (_response$data$data2 = response.data.data) !== null && _response$data$data2 !== void 0 && _response$data$data2.relationships ? response.data.data.relationships : {};
            var attrs_rels = Object.assign({}, _attributes, relationships, {
              "relationships": relationships
            });
            return {
              data: _objectSpread({
                id: id
              }, attrs_rels)
            };
          }

        case _actions.CREATE:
          {
            var _response$data$data3 = response.data.data,
                _id = _response$data$data3.id,
                _attributes2 = _response$data$data3.attributes;
            return {
              data: _objectSpread({
                id: _id
              }, _attributes2)
            };
          }

        case _actions.UPDATE:
          {
            var _response$data$data4 = response.data.data,
                _id2 = _response$data$data4.id,
                _attributes3 = _response$data$data4.attributes;
            return {
              data: _objectSpread({
                id: _id2
              }, _attributes3)
            };
          }

        case _actions.DELETE:
          {
            return {
              data: {
                id: params.id
              }
            };
          }

        default:
          throw new _errors.NotImplementedError("Unsupported Data Provider request type ".concat(type));
      }
    });
  };
};

exports["default"] = _default;