const assert = require('assert');

module.exports = eva => {
  assert.strictEqual(eva.eval(['+', 1, 5]), 6);
  assert.strictEqual(eva.eval(['+', 1, ['+', 2, 3]]), 6);
  assert.strictEqual(eva.eval(['*', 2, 6]), 12);
  assert.strictEqual(eva.eval(['+', ['*', 1, 2], ['*', 3, 4]]), 14);
}
