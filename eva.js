const assert = require('assert');
const Environment = require('./environment.js');
const Transformer = require('./transform/Transformer.js');

/**
*     Eva interpreter
*/

class Eva {
  /**
  *     Creates an Eva instance with the global environment
  */
  constructor(global = GlobalEnvironment) {
    this.global = global;
    this._transformer = new Transformer();
  }

  /**
  *   Implicit "begin" wrapper
  */
  evalGlobal(expressions) {
    return this._evalBlock(
      ['block', expressions],
      this.global,
    );
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
      const [_, ref, value] = exp;

      // Assignment to a property
      if (ref[0] === 'prop') {
        const [_, instance, propName] = ref;
        const instanceEnv = this.eval(instance, env);

        return instanceEnv.define(
          propName,
          this.eval(value, env),
        );
      }

      // Simple assignment
      return env.assign(ref, this.eval(value, env));
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
    // Switch-expression: (switch (cond1, block1) ... )
    //
    // Syntactic sugar for: nested ifs

    if (exp[0] === 'switch') {
      const ifExp = this._transformer
        .transformSwitchToIf(exp);

      return this.eval(ifExp, env);
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
    // for expression: TODO


    // -------------------------------------
    // Function declaration: (def square (x) (* x x))
    //
    // Syntactic sugar for: (var square (lambda (x) (* x x)))

    if (exp[0] === 'def') {
      const varExp = this._transformer
        .transformDefToLambda(exp);

      return this.eval(varExp, env);
    }

    // -------------------------------------
    // Lambda function: (lambda (x) (* x x))
    if (exp[0] === 'lambda') {
      const [_, params, body] = exp;

      return {
        params,
        body,
        env,      // closure
      };
    }

    // -------------------------------------
    // Class declaratiion (class <Name> <Parent> <Body>)

    if (exp[0] === 'class') {
      const [_, name, parent, body] = exp;

      // A class is an environment: storage of methods and properties
      const parentEnv = this.eval(parent, env) || env;
      const classEnv = new Environment({}, parentEnv);

      // Body is evaluated in the class environment.
      this._evalBody(body, classEnv);

      // Class is accessible by name.
      return env.define(name, classEnv);
    }

    // -------------------------------------
    // Super expressions: (super <ClassName>)
    if (exp[0] === 'super') {
      const [_, className] = exp;
      return this.eval(className, env).parent;
    }

    // -------------------------------------
    // Class Instantiation (new <Class> <Arguments> ... )
    if (exp[0] === 'new') {
      const classEnv = this.eval(exp[1], env);

      const instanceEnv = new Environment({}, classEnv);

      const args = exp
        .slice(2)
        .map(arg => this.eval(arg, env));

      this._callUserDefinedFunction(
        classEnv.lookup('constructor'),
        [instanceEnv, ...args],
      );

      return instanceEnv;
    }

    // -------------------------------------
    // Property access: (prop <instance> <name>)
    if (exp[0] === 'prop') {
      const [_, instance, name] = exp;

      const instanceEnv = this.eval(instance, env);

      return instanceEnv.lookup(name);
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
      return this._callUserDefinedFunction(fn, args);
    }

    throw `Unimplemented: ${JSON.stringify(exp)}`;
  }

  _callUserDefinedFunction(fn, args) {
    const activationRecord = {};

    fn.params.forEach((param, index) => {
      activationRecord[param] = args[index];
    });

    const activationEnv = new Environment(
      activationRecord,
      fn.env,
    );

    return this._evalBody(fn.body, activationEnv);
  }

  _evalBody(body, env) {
    if (body[0] == 'begin') {
      return this._evalBlock(body, env);
    }
    return this.eval(body, env);
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
