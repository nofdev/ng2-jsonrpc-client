
/**
 * facade name/api url/token api config class
 * 
 * @export
 * @class clientConfig
 */
export class clientConfig {
  /**
   * name of facade interface,must with namespace if had multiple same name interface
   * 
   * @type {string}
   * @memberOf clientConfig
   */
  facadeName: string;
  /**
   * the facade's api url
   * 
   * @type {string}
   * @memberOf clientConfig
   */
  apiUrl: string;
  /**
   * api token config if had
   * 
   * @type {apiTokenConfig}
   * @memberOf clientConfig
   */
  apiTokenConfig: apiTokenConfig;
}

/**
 * token api url and params's config class
 * 
 * @export
 * @class apiTokenConfig
 */
export class apiTokenConfig {

  apiTokenUrl: string;
  params: apiTokenParams;

}

/**
 * token api params class
 * 
 * @class apiTokenParams
 */
export class apiTokenParams {

  grant_type: string;
  client_id: string;
  client_secret: string;

}