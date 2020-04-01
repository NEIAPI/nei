/**
 *  NotificationUser ViewModel Class
 */
// variable transform bewteen model and viewmodel
// viewmodel_field:model_field
const TRANSFORM = {
  // TODO
};
// variable validation
const VALIDATION = {
  // TODO
};

/**
 * Base View Model Class
 *
 * @extends ViewModel
 */
class NotificationUser extends require('./ViewModel') {
  /**
   * Create a View Model
   *
   * @param  {Object} data - model data
   */
  constructor(data, arr) {
    super(data);
    this._setValidation(VALIDATION);
    this._setTransform(TRANSFORM);
    this._set(data, arr);
  }

  /**
   * get Model class bind with ViewModel
   * @return {Model} - Model class
   */
  getModel() {
    return require('../db/NotificationUser');
  }
}

// export NotificationUser class
module.exports = NotificationUser;
