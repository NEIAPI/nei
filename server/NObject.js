/**
 * Base Class for NEI System
 */

class NObject {
  /**
   * convert to JSON Object
   *
   * @return {Object} - to json object
   */
  toNObject() {
    return JSON.parse(this.toNObjectString());
  }

  /**
   * serialize to json string
   *
   * @return {String} json string
   */
  toNObjectString() {
    return JSON.stringify(this);
  }
}

module.exports = NObject;
