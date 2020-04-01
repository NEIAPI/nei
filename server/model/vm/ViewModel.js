let NObject = require('../../NObject');

/**
 *  Base View Model Class
 */

class ViewModel extends NObject {
  /**
   * set model data
   * @protected
   * @param  {Object} data - db model data
   * @return {void}
   */
  _set(data) {
    if (!data) {
      return;
    }
    // dump data from model
    Object.keys(data).forEach((key) => {
      let value = data[key];
      // escape private attr
      if (/^_[^_]/.test(key)) {
        return;
      }
      // extend attr
      if (key === 'ext' || /^__/.test(key)) {
        this._set(value);
        return;
      }
      // save data
      this[key] = value;
    });
  }

  _setValidation() {
  }

  _setTransform() {
  }

  /**
   * convert to model
   * @return {Model} - model instance
   */
  toModel() {
    return new (this.getModel())(this);
  }

  /**
   * get model
   * @abstract
   * @return {Model}
   */
  getModel() {
    throw new Error('must be implemented by subclass!');
  }
}

module.exports = ViewModel;
