# storelax

An easy, async-friendly object store.

```js
import { Store } from 'storelax';

const store = new Store({ animal: 'zebra' });

// Listeners are sent the current data
store.listen(value => {
  console.log(`Username: ${value.animal}`);
});

// Updates are sent to listeners
store.update({ animal: 'hippopotamus' });
```

## Install

```sh
npm install storelax
```

## API

### new Store(value?)

Creates a new store. If `value` is `undefined` or is not provided, the initial store value will be `null`.

```js
// Creating an empty store
const storeA = new Store();

// Creating a store with initial data
const storeB = new Store({ name: 'Hamilton' });
```

### get store.value

Returns the current store value.

```js
const store = new Store({ color: 'purple' });

console.log(
  store.value.color // "purple"
);
```

### get store.stream

Return a event stream for updates to the store.

```js
const store = new Store(1);

store.stream.map(x => x * x).listen(x => {
  console.log(x); // Log the squares of the store value
});
```

### store.update(value?)

Updates the store with the specified value and notifies all listeners. If `value` is `undefined`, then the store value is not modified.

```js
const store = new Store({ name: 'Amy', score: 100 });

store.update({ ...store.value, score: 200 });

console.log(store.value); // { name: "Amy", score: 200 }
```

### store.update(mapFn)

Calls the specified mapping function and updates the store with the value returned from the function and notifies all listeners. If the mapping function returns `undefined`, the state value is not modified.

```js
const store = new Store({ name: 'Amy', score: 100 });

store.update(value => {
  return { ...value, score: value.score + 100 };
});

console.log(store.value); // { name: "Amy", score: 200 }
```

### store.listen(callback)

Adds a listener to the data store. The function `callback` is asynchronously called with the current data. When the store is updated, `callback` is called with the current store data.

Returns a function which may be used to cancel the listener.

```js
const store = new Store({ name: 'Mr. X' });

// "Mr. X" is immediately logged
const cancel = store.listen(data => {
  console.log(data.name);
});

// "Mr. Y" is logged on update
store.update({ name: "Mr. Y" });

// Stop listening
cancel();
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
