import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { clientConfig } from './client.config';
export declare let clientFactory: (http: Http, jsonIdl: any, config: clientConfig) => any;
