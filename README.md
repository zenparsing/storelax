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

### new Store([data])

Creates a new store. If `data` is not provided, the initial store value will be `null`.

```js
// Creating an empty store
const storeA = new Store();

// Creating a store with initial data
const storeB = new Store({ name: 'Hamilton' });
```

### get store.state

Returns the current store data.

```js
const store = new Store({ color: 'purple' });

console.log(
  store.state.color // "purple"
);
```

### store.update(data)

Updates the store with the specified data and notifies all listeners. If `data` is `undefined`, then the state value is not modified.

```js
const store = new Store({ name: 'Amy', score: 100 });

store.update({ ...store.state, score: 200 });

console.log(store.state); // { name: "Amy", score: 200 }
```

### store.update(mapFn)

Calls the specified mapping function and updates the store with the returned value and notifies all listeners. If the mapping function returns `undefined`, the state value is not modified.

```js
const store = new Store({ name: 'Amy', score: 100 });

store.update(data => {
  return { ...data, score: data.score + 100 };
});

console.log(store.state); // { name: "Amy", score: 200 }
```

### store.listen(callback)

Adds a listener to the data store. The function `callback` is called with the current data. When the store is updated, `callback` is called with the current store data.

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
