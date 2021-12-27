/**
*     Environment interface
*/

class Environment {

  /**
  *   Creates an Environment
  */
  constructor(record = {}, parent = null) {
    this.record = record;
    this.parent = parent;
  }

  /**
  *   Creates a variable with a given name and value
  */
  define(name, value){
    this.record[name] = value;
    return value;
  }

  /**
  *   Updates an existing variable
  */
  assign(name, value){
    this._resolve(name).record[name] = value;
    return value;
  }

  /**
  *   Returns the value of a defined variable, or throws
  *   if the variable is not defined.
  */
  lookup(name) {
    return this._resolve(name).record[name];
  }

  /**
  *   Returns a specific environment in which a variables is defined, or
  *   throws if a variable is not defined
  */
  _resolve(name) {
    if (this.record.hasOwnProperty(name)) {
      return this;
    }

    if (this.parent == null) {
      throw new ReferenceError(`Variable "${name}" is not defined.`);
    }

    return this.parent._resolve(name);
  }
}

module.exports = Environment;
