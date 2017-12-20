# storelax

An easy observable store.

```js
import Store from 'storelax';

const store = new Store({ animal: 'zebra' });

// Subscribers are sent the current state immediately
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
