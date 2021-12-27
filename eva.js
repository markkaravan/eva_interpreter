const assert = require('assert');

/**
*     Eva interpreter
*/

class Eva {
  eval(exp) {
    if (isNumber(exp)) {
      return exp;
    }

    if (isString(exp)) {
      return exp.slice(1, -1);
    }

    if (exp[0] === '+') {
      return this.eval(exp[1]) + this.eval(exp[2]);
    }

    throw 'Unimplemented';
  }
}

function isNumber(exp) {
  return typeof exp === 'number';
}

function isString(exp) {
  return typeof exp === 'string' && exp[0] === '"' && exp.slice(-1) === '"' ;
}

// -------------------------------------
//    Tests:

const eva = new Eva();

assert.strictEqual(eva.eval(1), 1);
assert.strictEqual(eva.eval('"hello"'), 'hello'); // Uses double quotes for strings
assert.strictEqual(eva.eval(['+', 1, 5]), 6);
assert.strictEqual(eva.eval(['+', 1, ['+', 2, 3]]), 6);

console.log('All assertions passed!');
