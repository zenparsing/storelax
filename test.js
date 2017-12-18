'use strict';

const Store = require('./');
const Observable = require('zen-observable');
const assert = require('assert');

let store = new Store({ a: 1, b: 2 });

let result, sub, sub2;

// Observable
sub = store.observable.subscribe(x => result = x);

// Sends data on subscription
assert.deepEqual(result, { a: 1, b: 2 });

// Subscribe method
result = undefined;
sub2 = store.subscribe(x => result = x);
assert.deepEqual(result, { a: 1, b: 2 });
sub2.unsubscribe();

// Symbol.observable
result = undefined;
sub2 = Observable.from(store).subscribe(x => result = x);
assert.deepEqual(result, { a: 1, b: 2 });
sub2.unsubscribe();

// Read
assert.deepEqual(store.read(), { a: 1, b: 2 });

// Read with function
assert.deepEqual(store.read(data => ({ a: data.a + 1 })), { a: 2 });

// Update
store.update({ a: 3, c: 4 });
assert.deepEqual(result, { a: 3, b: 2, c: 4 });

// Update with function
store.update(data => ({ a: data.a + 1 }));
assert.deepEqual(result, { a: 4, b: 2, c: 4 });

// Update with null
result = undefined;
store.update(null);
assert.equal(result, undefined);

// Update with undefined
result = undefined;
store.update(undefined);
assert.equal(result, undefined);

// Update with state
result = undefined;
store.update(store.read());
assert.equal(result, undefined);

// Update with no changes
result = undefined;
store.update({ a: 4 });
assert.equal(result, undefined);

// Update with identical object
store.update({ obj: {} });
result = undefined;
store.update(data => {
  data.obj.prop = 1;
  return { obj: data.obj };
});
assert.deepEqual(result, { a: 4, b: 2, c: 4, obj: { prop: 1 } });
