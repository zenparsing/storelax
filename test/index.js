const { Store } = require('../');
const assert = require('assert');

function afterMicrotasks() {
  return new Promise(resolve => setTimeout(resolve));
}

async function main() {
  let store = new Store({ a: 1, b: 2 });

  { // Listen method
    let result = undefined;
    let cancel = store.listen(x => result = x);
    await afterMicrotasks();
    assert.deepEqual(result, { a: 1, b: 2 });
    cancel();
  }

  { // Multiple subscriptions
    let store = new Store({ a: 1, b: 2 });
    let results = [];
    let cancel1 = store.listen(x => results.push(x));
    let cancel2 = store.listen(x => results.push(x));
    await afterMicrotasks();
    assert.deepEqual(results, [
      { a: 1, b: 2 },
      { a: 1, b: 2 },
    ]);
    results = [];
    store.update(state => { state.a = 2; });
    await afterMicrotasks();
    assert.deepEqual(results, [
      { a: 2, b: 2 },
      { a: 2, b: 2 },
    ]);
    cancel1();
    cancel2();
  }

  { // Recursive update schedules a notification
    let store = new Store();
    let calls = 0;
    store.listen(() => {
      if (calls++ === 0) {
        store.update({ a: 1 });
      }
    });
    await afterMicrotasks();
    assert.equal(store.state.a, 1);
    assert.equal(calls, 2);
  }

  { // wakeCallback
    let store = new Store({ a: 1 });
    let calls = 0;
    store.wakeCallback = function() { calls++; };
    let cancel1 = store.listen(() => {});
    assert.equal(calls, 1);
    let cancel2 = store.listen(() => {});
    assert.equal(calls, 1);
    cancel1();
    cancel2();
    cancel2 = store.listen(() => {});
    assert.equal(calls, 2);
    cancel2();
  }

  { // sleepCallback
    let store = new Store({ a: 1 });
    let calls = 0;
    store.sleepCallback = function() { calls++; };
    let cancel1 = store.listen(() => {});
    cancel1();
    assert.equal(calls, 1);
    cancel1 = store.listen(() => {});
    let cancel2 = store.listen(() => {});
    cancel1();
    assert.equal(calls, 1);
    cancel2();
    assert.equal(calls, 2);
  }

  let result;

  store.listen(x => result = x);
  await afterMicrotasks();

  // Sends data on listen
  assert.deepEqual(result, { a: 1, b: 2 });

  // Read
  assert.deepEqual(store.state, { a: 1, b: 2 });

  // Update
  store.update({ ...store.state, a: 3, c: 4 });
  await afterMicrotasks();
  assert.deepEqual(result, { a: 3, b: 2, c: 4 });

  // Update with function
  store.update(data => ({ ...data, a: data.a + 1 }));
  await afterMicrotasks();
  assert.deepEqual(result, { a: 4, b: 2, c: 4 });

}

main().catch(err => setTimeout(() => { throw err; }));
