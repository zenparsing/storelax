import * as assert from 'assert';
import { describe, it } from 'moon-unit';
import { Store } from '../storelax.js';

function afterMicrotasks() {
  return new Promise(resolve => setTimeout(resolve));
}

describe('Store', () => {

  describe('constructor', () => {
    it('should accept a source object', () => {
      assert.deepStrictEqual(new Store({ a: 1 }).state, { a: 1 });
    });

    it('should create a new object', () => {
      let init = {};
      assert.notStrictEqual(new Store(init).state, init);
    });

    it('should throw if provided a non-object', () => {
      assert.throws(() => {
        new Store(() => {});
      });
      assert.throws(() => {
        new Store('');
      });
      assert.throws(() => {
        new Store(0);
      });
      assert.throws(() => {
        new Store(false);
      });
    });
  });

  describe('object shape', () => {
    it('should have no keys', () => {
      assert.deepStrictEqual(Object.keys(new Store()), []);
    });
  });

  describe('state', () => {
    it('should return the current state', async() => {
      let store = new Store({ a: 1, b: 2 });
      assert.deepStrictEqual(store.state, { a: 1, b: 2 });
    });
  });

  describe('stream', () => {
    it('should return the value stream', async() => {
      let store = new Store({ a: 1, b: 2 });
      let result;
      store.stream.map(x => x.a).listen(x => result = x);
      await afterMicrotasks();
      assert.strictEqual(result, 1);
    });
  });

  describe('map', () => {
    it('should return a mapped stream', async() => {
      let store = new Store({ a: 1, b: 2 });
      let result;
      store.map(x => x.a).listen(x => result = x);
      await afterMicrotasks();
      assert.strictEqual(result, 1);
    });
  });

  describe('listen', () => {
    it('should send the current value in a microtask', async() => {
      let store = new Store({ a: 1, b: 2 });
      let result = undefined;

      store.listen(x => result = x);

      assert.strictEqual(result, undefined);
      await afterMicrotasks();
      assert.deepStrictEqual(result, { a: 1, b: 2 });
    });

    it('should not resent the current value if update is called', async() => {
      let store = new Store({ a: 1, b: 2 });
      let calls = 0;

      store.listen(() => calls += 1);
      assert.strictEqual(calls, 0);
      store.update({ a: 2, b: 2 });
      assert.strictEqual(calls, 1);
      await afterMicrotasks();
      assert.strictEqual(calls, 1);
    });

    it('should handle multiple subscriptions', async() => {
      let store = new Store({ a: 1, b: 2 });
      let results = [];
      let cancel1 = store.listen(x => results.push(x));
      let cancel2 = store.listen(x => results.push(x));
      await afterMicrotasks();
      assert.deepStrictEqual(results, [
        { a: 1, b: 2 },
        { a: 1, b: 2 },
      ]);
      results = [];
      store.update({ a: 2 });
      await afterMicrotasks();
      assert.deepStrictEqual(results, [
        { a: 2, b: 2 },
        { a: 2, b: 2 },
      ]);
      cancel1();
      cancel2();
    });
  });

  describe('update', () => {
    it('should schedule update when called recursively', async() => {
      let store = new Store();
      let calls = 0;
      store.listen(() => {
        if (calls++ === 0) {
          store.update({ a: 1 });
        }
      });
      await afterMicrotasks();
      assert.strictEqual(store.state.a, 1);
      assert.strictEqual(calls, 2);
    });

    it('should throw if supplied a non-object', () => {
      let store = new Store();
      assert.throws(() => {
        store.update(() => {});
      });
      assert.throws(() => {
        store.update('');
      });
      assert.throws(() => {
        store.update(0);
      });
      assert.throws(() => {
        store.update(false);
      });
    });

    it('should accept a partial', () => {
      let store = new Store({ a: 1, b: 2 });
      store.update({ b: 5 });
      assert.deepStrictEqual(store.state, { a: 1, b: 5 });
    });
  });

  describe('wakeCallback', () => {
    it('should be called when the first listener is added', async() => {
      let store = new Store({ a: 1 });
      let calls = 0;
      store.wakeCallback = function() { calls++; };
      let cancel1 = store.listen(() => {});
      assert.strictEqual(calls, 1);
      let cancel2 = store.listen(() => {});
      assert.strictEqual(calls, 1);
      cancel1();
      cancel2();
      cancel2 = store.listen(() => {});
      assert.strictEqual(calls, 2);
      cancel2();
    });
  });

  describe('sleepCallback', () => {
    it('should be called when the last listener is removed', () => {
      let store = new Store({ a: 1 });
      let calls = 0;
      store.sleepCallback = function() { calls++; };
      let cancel1 = store.listen(() => {});
      cancel1();
      assert.strictEqual(calls, 1);
      cancel1 = store.listen(() => {});
      let cancel2 = store.listen(() => {});
      cancel1();
      assert.strictEqual(calls, 1);
      cancel2();
      assert.strictEqual(calls, 2);
    });
  });

});
