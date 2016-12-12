var config = require("config");

/**
 * facade name/api url/token api config class
 * 
 * @export
 * @class clientConfig
 */
export class clientConfig {
  clientConfig(configName: string) {
    if (configName) {
      this.facadeName = config.get('proxy.'+configName+'interface');
      this.apiUrl = config.get('proxy.'+configName+'url');
    }
  }
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
}