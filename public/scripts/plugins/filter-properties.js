var _ = require('underscore');

// Keep a reference to all the keys defined on the root object prototype.
var objectPrototypeKeys = Object.getOwnPropertyNames(Object.prototype);

// Keep a reference to all the keys on a function created by the function.
var functionPropertyKeys = Object.getOwnPropertyNames(function () {});

/**
 * Check if the object has a direct property on it. Uses
 * `Object.prototype.hasOwnProperty` since the object we check against could
 * have been created using `Object.create(null)` which means it wouldn't have
 * `hasOwnProperty` on its prototype.
 *
 * @param  {Object}  object
 * @param  {String}  property
 * @return {Boolean}
 */
var _hasOwnProperty = function (object, property) {
  return Object.prototype.hasOwnProperty.call(object, property);
};

/**
 * Check if the property of the object was inherited from `Object.prototype`.
 * Please note: We can't just compare to `Object.prototype` since objects in an
 * iFrame will have inherited from a different prototype.
 *
 * @param  {Object} object
 * @param  {String} property
 * @return {Boolean}
 */
var isObjectProperty = function (object, property) {
  var obj = object;

  var objectHasOwnProperty = function (property) {
    return _hasOwnProperty(object, property);
  };

  do {
    // Use `hasOwnProperty` from the Object's prototype since the object might
    // not have a property on it called
    if (objectHasOwnProperty(property)) {
      // Do a quick check to see if we are at the end of the prototype chain. If
      // we are, we need to compare the current object properties with
      // `Object.prototype` since we could just be at the end of a chain started
      // with `Object.create(null)`.
      if (Object.getPrototypeOf(object)) { return false; }
      // Don't check for an exact match of keys since if the prototype is from
      // an iFrame, it could have been modified by one of those irritating JS
      // developers that mess with prototypes directly.
      return _.every(objectPrototypeKeys, objectHasOwnProperty);
    }
  } while (object = Object.getPrototypeOf(object));

  return false;
};

/**
 * Check if the property of a function was inherited by the creation of the
 * function.
 *
 * @param  {Function} fn
 * @param  {String}   property
 * @return {Boolean}
 */
var isFunctionProperty = function (fn, property) {
  if (_.contains(functionPropertyKeys, property)) { return true; }

  return !_hasOwnProperty(fn, property);
};

/**
 * Registers the property filtering middleware. It is responsible for
 * @param  {[type]} middleware [description]
 * @return {[type]}            [description]
 */
module.exports = function (middleware) {
  /**
   * Sets whether the property should be filter from autocompletion suggestions.
   *
   * @param  {Object}   data
   * @param  {Function} next
   */
  middleware.use('completion:filter', function (data, next) {
    if (!data.filter) {
      if (typeof data.context === 'object') {
        data.filter = isObjectProperty(data.context, data.string);
      }

      if (typeof data.context === 'function') {
        data.filter = isFunctionProperty(data.context, data.string);
      }
    }

    return next();
  });

  /**
   * Filters properties from being shown in the inspector.
   *
   * @param  {Object}   data
   * @param  {Function} next
   */
  middleware.use('inspector:filter', function (data, next) {
    if (!data.filter && data.internal === '[[Prototype]]') {
      data.filter = true;
    }

    return next();
  });
};
