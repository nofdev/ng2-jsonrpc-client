"use strict";
var http_1 = require('@angular/http');
var ng2_cookies_1 = require('ng2-cookies/ng2-cookies');
require('rxjs/add/observable/throw');
require('rxjs/add/operator/toPromise');
var API_TOKEN_KEY = "api_token";
var _headers = new http_1.Headers();
_headers.append("Content-Type", "application/x-www-form-urlencoded");
var _tokenConfig;
var _getToken = false;
var _http;
exports.clientFactory = function (http, jsonIdl, config) {
    _http = http;
    _tokenConfig = config.apiTokenConfig;
    if (!config.apiUrl || !config.facadeName) {
        throw Error("config's apiUrl and facadeName can not be null!");
    }
    if (_tokenConfig) {
        if (!_tokenConfig.apiTokenUrl
            || !_tokenConfig.params.client_id || !_tokenConfig.params.client_secret || !_tokenConfig.params.grant_type) {
            throw Error("apiTokenUrl and params's client_id/client_secret/grant_type of config's api_tokenConfig can not be null!");
        }
        _getToken = true;
        if (!getTokenFromCookie()) {
            getToken();
        }
    }
    var jsonidl;
    for (var _i = 0, _a = jsonIdl.interfaces; _i < _a.length; _i++) {
        var item = _a[_i];
        if (item.package + "." + item.name === config.facadeName) {
            jsonidl = item;
            break;
        }
    }
    if (!jsonidl) {
        throw new Error("there is not " + config.facadeName);
    }
    var apiBaseUrl = config.apiUrl + '/' + jsonidl.package + '/' + jsonidl.name.replace("Facade", "");
    var proxy = {};
    jsonidl.methods.forEach(function (element) {
        proxy[element.name] = function () {
            var args = [];
            for (var i = 0; i < element.args.length; i++) {
                args.push("\"" + arguments[i] + "\"");
            }
            var apiUrl = apiBaseUrl + "/" + element.name + "?params=[" + args.join(',') + "]";
            return postHandle(apiUrl, args);
        };
    });
    return proxy;
};
function handleError(error) {
    var errMsg = (error.message) ? error.message :
        error.status ? error.status + " - " + error.statusText : 'Server error';
    var errBody = JSON.parse(error._body);
    var errDetail = errBody.code + " = " + errBody.error + " - " + errBody.error_description;
    console.error(errDetail); // log to console instead
    return Promise.reject(errMsg);
}
function postHandle(apiUrl, args) {
    if (_getToken) {
        var apiToken = getTokenFromCookie();
        _headers.append("Authorization", "Bearer " + apiToken);
        return post(apiUrl, _headers);
    }
    else {
        return post(apiUrl, _headers);
    }
}
function post(apiUrl, headers) {
    return _http.post(apiUrl, null, { headers: headers })
        .toPromise()
        .then(function (res) { return res.json(); })
        .catch(function (error) { return handleError(error); });
}
function getTokenFromCookie() {
    var token = ng2_cookies_1.Cookie.get(API_TOKEN_KEY);
    return token;
}
function getToken() {
    _headers.delete("Authorization");
    var params = "grant_type=" + _tokenConfig.params.grant_type + "&client_id=" + _tokenConfig.params.client_id + "&client_secret=" + _tokenConfig.params.client_secret;
    return _http.post(_tokenConfig.apiTokenUrl, params, { headers: _headers })
        .toPromise()
        .then(function (res) {
        var token = res.json();
        var tokenValue = token.access_token;
        setToken(tokenValue, token.expires_in);
        setInterval(getToken, token.expires_in * 900); //每隔有效期的90%更新一次token
    })
        .catch(function (error) { return handleError(error); });
}
function setToken(token, expires) {
    ng2_cookies_1.Cookie.set(API_TOKEN_KEY, token, expires / 86400);
}
//# sourceMappingURL=client.js.map