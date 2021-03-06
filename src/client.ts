import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/concat';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';

import { clientConfig, apiTokenConfig } from './client.config';

const API_TOKEN_KEY = "gateway-token";
const AUTH_TOKEN_KEY = "x-auth-token";

let _headers: Headers = new Headers();
_headers.append("Content-Type", "application/x-www-form-urlencoded");

let _tokenConfig: apiTokenConfig;
//是否使用api token
let _useToken: boolean = false;

let _http: Http;

export let clientFactory = (http: Http, jsonIdl: any, config: clientConfig) => {
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

        _useToken = true;
        if (!getTokenFromCookie()) {
            getTokenFromServer().subscribe();
        }
    }


    let jsonidl: any;

    for (let item of jsonIdl.interfaces) {
        if (item.package + "." + item.name === config.facadeName) {
            jsonidl = item;
            break;
        }
    }
    if (!jsonidl) {
        throw new Error(`there is not ${config.facadeName}`);
    }
    let apiBaseUrl = config.apiUrl + '/' + jsonidl.package + '/' + jsonidl.name.replace("Facade", "");
    let proxy: any = {};
    jsonidl.methods.forEach((element: any) => {
        proxy[element.name] = function (): Observable<any> {

            let args: any[] = [];
            for (let i: number = 0; i < element.args.length; i++) {
                if (element.args[i].type.indexOf('.') > -1) {
                    args.push(JSON.stringify(arguments[i]));
                } else if (Array.isArray(arguments[i])) {
                    args.push(`[${arguments[i]}]`);
                } else {
                    args.push(`"${arguments[i]}"`);
                }
            }
            let apiUrl = `${apiBaseUrl}/${element.name}?params=[${encodeURI(args.join(','))}]`;

            return postHandler(apiUrl);

        }
    });
    return proxy;
};


function handleError(error: any) {
    let errMsg = (error.message) ? error.message :
        error.status ? `${error.status} - ${error.statusText}` : 'Server error';
    let errBody: any;
    let errDetail: string;
    if (error._body !== '') {
        if (typeof error._body === "string") {
            errBody = JSON.parse(error._body)
            errDetail = `${errBody.code} = ${errBody.error} - ${errBody.error_description}`;
        } if (typeof error._body === "object") {
            errDetail = `it looks like a http error. status: ${error.status}, ok: ${error.ok}, statusText: ${error.statusText}`;
        }
        else {
            if (error.msg) {//server custom error
                return Observable.throw(error);
            }
        }
    } else {
        return Observable.throw(error);
    }
    console.log(errDetail); // log to console instead
    return Observable.throw(errMsg);
}

function postHandler(apiUrl: string): Observable<any> {
    if (_useToken) {
        let apiToken = getTokenFromCookie();
        if (apiToken) {
            setHeader(apiToken);
            return post(apiUrl, _headers);
        } else {
            return getTokenFromServer()
                .mergeMap(() => {
                    return postHandler(apiUrl);
                });
        }
    } else {
        return post(apiUrl, _headers);
    }
}

function setHeader(apiToken: string) {
    if (!_headers.has("Authorization")) {
        _headers.append("Authorization", `Bearer ${apiToken}`);
    } else {
        _headers.set("Authorization", `Bearer ${apiToken}`);
    }
    let authToken = getAuthToken();
    if (authToken) {
        if (!_headers.has("X-Auth-Token")) {
            _headers.append("X-Auth-Token", authToken);
        } else {
            _headers.set("X-Auth-Token", authToken);
        }
    }
}

function post(apiUrl: string, headers: Headers): Observable<any> {
    return _http.post(apiUrl, null, { headers: headers })
        .map((res: Response) => {
            let data = res.json();
            if (data.err) {
                return Observable.throw(data.err);
            }
            return data.val;
        })
        .catch((error: any) => handleError(error));
}

function getTokenFromCookie(): string {
    let token: string = Cookie.get(API_TOKEN_KEY);

    return token;
}

function getTokenParams(): string {
    return `grant_type=${_tokenConfig.params.grant_type}&client_id=${_tokenConfig.params.client_id}&client_secret=${_tokenConfig.params.client_secret}`;
}

function getTokenFromServer(): Observable<any> {
    _headers.delete("Authorization");
    let params = getTokenParams();
    return _http.post(_tokenConfig.apiTokenUrl, params, { headers: _headers })
        .map((res: Response) => {
            tokenHandler(res);
        })
        .catch((error: any) => handleError(error));
}

function tokenHandler(res: any) {
    let token = res.json();
    setToken(token.access_token, token.expires_in);
    setInterval(getTokenFromServer, token.expires_in * 900);//每隔有效期的90%更新一次token
}

function setToken(token: string, expires: number) {
    Cookie.set(API_TOKEN_KEY, token, expires / 86400); //cookie有效期时间单位是“天”
}

function getAuthToken() {
    return Cookie.get(AUTH_TOKEN_KEY);
}