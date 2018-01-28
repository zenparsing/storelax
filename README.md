# storelax

An easy observable store.

```js
import Store from 'storelax';

const store = new Store({ animal: 'zebra' });

// Subscribers are sent the current data
store.subscribe(state => {
  console.log(`Username: ${state.animal}`);
});

// Updates are sent to subscribers
store.update({ animal: 'hippopotamus' });
```

## Install

```sh
npm install storelax
```

## API

### new Store([data])

Creates a new store. If `data` is provided, the store will be initialized using its properties.

```js
// Creating an empty store
const storeA = new Store();

// Creating a store with initial data
const storeB = new Store({ name: 'Hamilton' });
```

### store.observable

An Observable object representing the stream of store updates.

```js
const store = new Store({ shape: 'heart' });

store.observable
  .map(data => `draw me a ${ data.shape }`)
  .subscribe(message => console.log(message));
```

### store.read([mapFn])

Returns the current store data. If `mapFn` is provided, it is called with the current store data and its return value is returned from this method.

```js
const store = new Store({ color: 'purple' });

console.log(
  store.read().color // "purple"
);

console.log(
  store.read(data => data.color.toUpperCase()) // "PURPLE"
);
```

### store.update(data)

Updates the store with the specified properties. All store observers are notified when an update occurs.

```js
const store = new Store({ name: 'Amy', score: 100 });

store.update({ score: 200 });

console.log(store.read()); // { name: "Amy", score: 200 }
```

If the argument is a function, it is called with the current store data. The store is updated with the return value of the function.

```js
const store = new Store({ name: 'Amy', score: 100 });

store.update(data => {
  return { score: data.score + 100 };
});

console.log(store.read()); // { name: "Amy", score: 200 }
```

### store.subscribe(callback)

Subscribes to the data store. The function `callback` is called with the current data. When the store is updated, `callback` is called with the current store data.

Returns a subscription object that can be used to cancel the subscription.

```js
const store = new Store({ name: 'Mr. X' });

// "Mr. X" is immediately logged
const subscription = store.subscribe(data => {
  console.log(data.name);
});

// "Mr. Y" is logged on update
store.update({ name: "Mr. Y" });

// Cancel the current subscription
subscription.unsubscribe();
```

### store.observedCallback()

Called when the first observer is attached to the store. Subclasses can override this function to allocate resources when the store is observed.

### store.unobservedCallback()

Called when the last observer has been removed from the store. Subclasses can override this function to finalize resources when the store is no longer observed.

```js
class CounterStore extends Store {
  constructor() {
    super({ count: 0 });
  }

  increment() {
    let { count } = this.read();
    this.update({ count: count + 1 });
  }

  observedCallback() {
    this.interval = setInterval(() => {
      this.increment();
    }, 1000);
  }

  unobservedCallback() {
    clearInterval(this.interval);
  }
}
```
