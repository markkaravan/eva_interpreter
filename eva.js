const assert = require('assert');
const Environment = require('./environment.js');

/**
*     Eva interpreter
*/

class Eva {
  /**
  *     Creates an Eva instance with the global environment
  */
  constructor(global = GlobalEnvironment) {
    this.global = global;
  }

  eval(exp, env = this.global) {
    // -------------------------------------
    // Self-evaluating expressions:
    if (this._isNumber(exp, env)) {
      return exp;
    }

    if (this._isString(exp, env)) {
      return exp.slice(1, -1);
    }

    // -------------------------------------
    // Comparison operations:
    // if (exp[0] === '>') {
    //   return this.eval(exp[1], env) > this.eval(exp[2], env);
    // }
    //
    // if (exp[0] === '>=') {
    //   return this.eval(exp[1], env) >= this.eval(exp[2], env);
    // }
    //
    // if (exp[0] === '<') {
    //   return this.eval(exp[1], env) < this.eval(exp[2], env);
    // }
    //
    // if (exp[0] === '<=') {
    //   return this.eval(exp[1], env) <= this.eval(exp[2], env);
    // }
    //
    // if (exp[0] === '=') {
    //   return this.eval(exp[1], env) === this.eval(exp[2], env);
    // }
    //
    // if (exp[0] === '<>') {
    //   return this.eval(exp[1], env) != this.eval(exp[2], env);
    // }

    // -------------------------------------
    // Blocks:
    if (exp[0] === 'begin') {
      const blockEnv = new Environment({}, env);
      return this._evalBlock(exp, blockEnv);
    }

    // -------------------------------------
    // Variable declaration:
    if (exp[0] === 'var') {
      const [_, name, value] = exp;
      return env.define(name, this.eval(value, env));
    }

    // -------------------------------------
    // Variable update:
    if (exp[0] === 'set') {
      const [_, name, value] = exp;
      return env.assign(name, this.eval(value, env));
    }

    // -------------------------------------
    // Variable access:
    if (this._isVariableName(exp)) {
      return env.lookup(exp);
    }

    // -------------------------------------
    // if expression:
    if (exp[0] === 'if') {
      const [_, condition, consequent, alternative] = exp;
      if (this.eval(condition, env)) {
        return this.eval(consequent, env);
      }
      return this.eval(alternative, env);
    }

    // -------------------------------------
    // while expression:
    if (exp[0] === 'while') {
      const [_, condition, body] = exp;
      let result;
      while (this.eval(condition, env)) {
        result = this.eval(body, env);
      }
      return result;
    }

    // -------------------------------------
    // Function calls:
    //
    // (print "Hello world")
    // (+ x 5)
    // (> foo bar)

    if (Array.isArray(exp)) {

      const fn = this.eval(exp[0], env);

      const args = exp
        .slice(1)
        .map(arg => this.eval(arg, env));

      // 1. Native function:
      if (typeof fn === 'function') {
        return fn(...args);
      }

      // 2. User-defined function:
      // TODO
    }

    throw `Unimplemented: ${JSON.stringify(exp)}`;
  }

  _evalBlock(block, env) {
    let result;

    const [_tag, ...expressions] = block;

    expressions.forEach(exp => {
      result = this.eval(exp, env);
    });

    return result;
  }

  _isNumber(exp) {
    return typeof exp === 'number';
  }

  _isString(exp) {
    return typeof exp === 'string' && exp[0] === '"' && exp.slice(-1) === '"' ;
  }

  _isVariableName(exp) {
    let regexp = /^[+\-*/<>=a-zA-Z0-9_]*$/;
    return typeof exp === 'string' && regexp.test(exp) ;
  }
}

const GlobalEnvironment = new Environment({
  null: null,

  true: true,
  false: false,

  VERSION: '0.1',

  // Math
  '+'(op1, op2) {
    return op1 + op2;
  },

  '*'(op1, op2) {
    return op1 * op2;
  },

  '-'(op1, op2 = null) {
    if (op2 == null) {
      return -op1;
    }
    return op1 - op2;
  },

  '/'(op1, op2) {
    return op1 / op2;
  },

  // Comparison
  '>'(op1, op2) {
    return op1 > op2;
  },

  '<'(op1, op2) {
    return op1 < op2;
  },

  '>='(op1, op2) {
    return op1 >= op2;
  },

  '<='(op1, op2) {
    return op1 <= op2;
  },

  '='(op1, op2) {
    return op1 === op2;
  },

  '<>'(op1, op2) {
    return op1 != op2;
  },

  print(...args) {
    console.log(...args);
  },
});




module.exports = Eva;
