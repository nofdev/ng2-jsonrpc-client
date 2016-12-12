import { Http, Response, Headers,URLSearchParams } from '@angular/http';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/toPromise';

import { clientConfig } from './client.config';

let _http: Http;

export let clientFactory = (http: Http, jsonIdl: any, config: clientConfig) => {
    _http = http;
    if (!config.apiUrl || !config.facadeName) {
        throw Error("config's apiUrl and facadeName can not be null!");
    }
    let itemidl: any;
    for (let item of jsonIdl.interfaces) {
        if (item.package + "." + item.name === config.facadeName) {
            itemidl = item;
            break;
        }
    }
    if (!itemidl) {
        throw new Error(`there is not ${config.facadeName}`);
    }
    let apiBaseUrl = config.apiUrl + '/json/facade/' + itemidl.package + '/' + itemidl.name.replace("Facade", "");
    let proxy: any = {};
    let _headers: Headers = new Headers();
    _headers.append("Content-Type", "application/x-www-form-urlencoded");

    itemidl.methods.forEach((element: any) => {
        proxy[element.name] = function (): Promise<any> {
            let args: any[] = [];
            for (let i: number = 0; i < element.args.length; i++) {
                args.push(`"${arguments[i]}"`);
            }
            let apiUrl = `${apiBaseUrl}/${element.name}`;
            return post(apiUrl, args, _headers);
        }
    });
    return proxy;
};

function post(apiUrl: string, args: Array<any>, headers: Headers): Promise<any> {
    return _http.post(apiUrl, paramsEncode(args), { headers: headers })
        .toPromise()
        .then(extractData)
        .catch(handleError);
}

let extractData = (res: Response) => {
    let data = res.json();
    if (data.err) {
        return Promise.reject(data.err);
    } else {
        return (res.json().val)
    }
};

let handleError = (error: any) => {
    let errMsg = (error.message) ? error.message :
        error.status ? `${error.status} - ${error.statusText}` : 'Server error';
    let errBody: any;
    let errDetail: string;
    if (typeof error._body === "string") {
        errBody = JSON.parse(error._body)
        errDetail = `${errBody.code} = ${errBody.error} - ${errBody.error_description}`;
    } if (typeof error._body === "object") {
        errDetail = `it looks like a http error. status: ${error.status}, ok: ${error.ok}, statusText: ${error.statusText}`;
    }
    else {
        if (error.msg) {//server custom error
            return Promise.reject(error);
        }
    }
    console.error(errDetail); // log to console instead
    return Promise.reject(errMsg);
};

function paramsEncode(obj: Array<Object>): string {
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('params', JSON.stringify(obj));
    return urlSearchParams.toString();
}