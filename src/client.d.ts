import { Http } from '@angular/http';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/toPromise';
import { clientConfig } from './client.config';
export declare let clientFactory: (http: Http, jsonIdl: any, config: clientConfig) => any;
