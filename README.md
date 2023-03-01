# storelax

An easy, async-friendly object store.

```js
import { Store } from 'storelax';

const store = new Store({ animal: 'zebra' });

// Listeners are sent the current data
store.listen(state => {
  console.log(`Username: ${state.animal}`);
});

// Updates are sent to listeners
store.update({ animal: 'hippopotamus' });
```

## Install

```sh
npm install storelax
```

## API

### new Store(source?)

Creates a new store. If `source` is not `undefined` or `null`, the keys of the `source` are used to initialized the store.

```js
// Creating an empty store
const storeA = new Store();

// Creating a store with initial data
const storeB = new Store({ name: 'Hamilton' });
```

### store.state

Gets the current state of the store.

```js
const store = new Store({ color: 'purple' });

console.log(
  store.state.color // "purple"
);
```

### store.stream

Gets a event stream for updates to the store.

```js
const store = new Store(1);

store.stream.map(x => 2 * x).listen(x => {
  console.log(x); // Log the doubles of the store value
});
```

### store.map(fn)

Returns a stream for updates to the store, mapped using `fn`.

```js
const store = new Store(1);

store.map(x => 2 * x).listen(x => {
  console.log(x); // Log the doubles of the store value
});
```

### store.update(source?)

Updates the store with `source` and notifies all listeners. If `source` is not `undefined` or `null`, the keys of `source` are used to update the store.

```js
const store = new Store({ name: 'Amy', score: 100 });

store.update({ score: 200 });

console.log(store.state); // { name: "Amy", score: 200 }
```

### store.listen(callback)

Adds a listener to the data store. The function `callback` is asynchronously called with the current state. Each time the store is updated, `callback` is called with the current state.

Returns a function which may be used to cancel the listener.

```js
const store = new Store({ name: 'Mr. X' });

// "Mr. X" is logged asynchronously
const cancel = store.listen(data => {
  console.log(data.name);
});

queueMicrotask() => {
  // "Mr. Y" is logged immediately on update
  store.update({ name: "Mr. Y" });

  // Stop listening
  cancel();
});
```

### store.wakeCallback()

Called when the first observer is attached to the store. Subclasses can override this function to allocate resources when the store is given a first listener.

### store.sleepCallback()

Called when the last observer has been removed from the store. Subclasses can override this function to finalize resources when the store has no listeners.

```js
class CounterStore extends Store {
  constructor() {
    super({ count: 0 });
    this.interval = 0;
  }

  increment() {
    let { count } = this.read();
    this.update({ count: count + 1 });
  }

  wakeCallback() {
    this.interval = setInterval(() => {
      this.increment();
    }, 1000);
  }

  sleepCallback() {
    clearInterval(this.interval);
    this.interval = 0;
  }
}
```
