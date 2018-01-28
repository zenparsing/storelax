'use strict';

const Store = require('./');
const Observable = require('zen-observable');
const assert = require('assert');

class MockObserver {
  next(x) { this.nextValue = x; }
  error(e) { this.errorValue = e; }
  complete(x) { this.completeCalled = true; }
}

async function main() {
  let store = new Store({ a: 1, b: 2 });

  { // Subscribe method
    let result = undefined;
    let sub = store.subscribe(x => result = x);
    await null;
    assert.deepEqual(result, { a: 1, b: 2 });
    sub.unsubscribe();
  }

  { // Multiple subscriptions
    let store = new Store({ a: 1, b: 2 });
    let results = [];
    let sub1 = store.subscribe(x => results.push(x));
    let sub2 = store.subscribe(x => results.push(x));
    await null;
    assert.deepEqual(results, [
      { a: 1, b: 2 },
      { a: 1, b: 2 }
    ]);
    results = [];
    store.update({ a: 2 });
    assert.deepEqual(results, [
      { a: 2, b: 2 },
      { a: 2, b: 2 }
    ]);
    sub1.unsubscribe();
    sub2.unsubscribe();
  }

  { // Recursive next not allowed
    let store = new Store();
    let error;
    store.observable.subscribe(
      () => store.update({ a: 1 }),
      err => error = err
    );
    await null;
    assert.ok(error);
  }

  { // observedCallback
    let store = new Store({ a: 1 });
    let calls = 0;
    store.observedCallback = function() { calls++; };
    let sub1 = store.subscribe(() => {});
    assert.equal(calls, 1);
    let sub2 = store.subscribe(() => {});
    assert.equal(calls, 1);
    sub1.unsubscribe();
    sub2.unsubscribe();
    sub2 = store.subscribe(() => {});
    assert.equal(calls, 2);
    sub2.unsubscribe();
  }

  { // unobservedCallback
    let store = new Store({ a: 1 });
    let calls = 0;
    store.unobservedCallback = function() { calls++; };
    let sub1 = store.subscribe(() => {});
    sub1.unsubscribe();
    assert.equal(calls, 1);
    sub1 = store.subscribe(() => {});
    let sub2 = store.subscribe(() => {});
    sub1.unsubscribe();
    assert.equal(calls, 1);
    sub2.unsubscribe();
    assert.equal(calls, 2);
  }

  let result, sub;

  // Observable
  sub = store.observable.subscribe(x => result = x);
  await null;

  // Sends data on subscription
  assert.deepEqual(result, { a: 1, b: 2 });

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

}

main().catch(err => setTimeout(() => { throw err; }));
