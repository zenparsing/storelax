import { Store } from '../src/Store';
import * as assert from 'assert';

function afterMicrotasks() {
  return new Promise(resolve => setTimeout(resolve));
}

class MockObserver {
  next(x) { this.nextValue = x; }
  error(e) { this.errorValue = e; }
  complete(x) { this.completeCalled = true; }
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
      { a: 1, b: 2 }
    ]);
    results = [];
    store.update({ a: 2 });
    await afterMicrotasks();
    assert.deepEqual(results, [
      { a: 2, b: 2 },
      { a: 2, b: 2 }
    ]);
    cancel1();
    cancel2();
  }

  { // Recursive update schedules a notification
    let store = new Store();
    let calls = 0;
    store.listen(
      () => {
        calls++;
        store.update({ a: 1 });
      }
    );
    await afterMicrotasks();
    assert.equal(store.read().a, 1);
    assert.equal(calls, 2);
  }

  { // observedCallback
    let store = new Store({ a: 1 });
    let calls = 0;
    store.observedCallback = function() { calls++; };
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

  { // unobservedCallback
    let store = new Store({ a: 1 });
    let calls = 0;
    store.unobservedCallback = function() { calls++; };
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

  let result, cancel;

  cancel = store.listen(x => result = x);
  await afterMicrotasks();

  // Sends data on subscription
  assert.deepEqual(result, { a: 1, b: 2 });

  // Read
  assert.deepEqual(store.read(), { a: 1, b: 2 });

  // Read with function
  assert.deepEqual(store.read(data => ({ a: data.a + 1 })), { a: 2 });

  // Update
  store.update({ a: 3, c: 4 });
  await afterMicrotasks();
  assert.deepEqual(result, { a: 3, b: 2, c: 4 });

  // Update with function
  store.update(data => ({ a: data.a + 1 }));
  await afterMicrotasks();
  assert.deepEqual(result, { a: 4, b: 2, c: 4 });

  // Update with null
  result = undefined;
  store.update(null);
  await afterMicrotasks();
  assert.equal(result, undefined);

  // Update with undefined
  result = undefined;
  store.update(undefined);
  await afterMicrotasks();
  assert.equal(result, undefined);

  // Update with state
  result = undefined;
  store.update(store.read());
  await afterMicrotasks();
  assert.equal(result, undefined);

  // Update with no changes
  result = undefined;
  store.update({ a: 4 });
  await afterMicrotasks();
  assert.equal(result, undefined);

  // Update with identical object
  store.update({ obj: {} });
  result = undefined;
  store.update(data => {
    data.obj.prop = 1;
    return { obj: data.obj };
  });
  await afterMicrotasks();
  assert.deepEqual(result, { a: 4, b: 2, c: 4, obj: { prop: 1 } });

}

main().catch(err => setTimeout(() => { throw err; }));
