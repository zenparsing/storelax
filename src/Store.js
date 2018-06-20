import { AsyncIterationBuffer } from './AsyncIterationBuffer.js';

export class Store {

  constructor(data) {
    this.listener = null;
    this.listeners = null;
    this.state = Object.create(null);

    if (data) {
      for (let key in data) {
        this.state[key] = data[key];
      }
    }
  }

  [Symbol.asyncIterator]() {
    if (!this.listener && !this.listeners) {
      this.observedCallback();
    }

    let buffer = new AsyncIterationBuffer({
      cancel: () => {
        if (this.listeners) {
          this.listeners.delete(buffer);
          if (this.listeners.size === 0) {
            this.listeners = null;
          }
        } else if (this.listener === buffer) {
          this.listener = null;
        }
        if (!this.listener && !this.listeners) {
          this.unobservedCallback();
        }
      },
    });

    buffer.next(this.state);

    if (this.listeners) {
      this.listeners.add(buffer);
    } else if (!this.listener) {
      this.listener = buffer;
    } else {
      this.listeners = new Set();
      this.listeners.add(this.listener);
      this.listeners.add(buffer);
      this.listener = null;
    }

    return buffer[Symbol.asyncIterator]();
  }

  observedCallback() {}

  unobservedCallback() {}

  read(fn) {
    return fn ? fn(this.state) : this.state;
  }

  update(data) {
    if (typeof data === 'function') {
      data = data(this.state);
    }

    if (data === null || data === undefined || data === this.state) {
      return;
    }

    let updated = false;
    for (let key in data) {
      let prev = this.state[key];
      let next = data[key];

      if (prev !== next) {
        // Non-identical values trigger updates
        updated = true;
        this.state[key] = next;
      } else if (prev && typeof prev === 'object') {
        // Assume that identitical objects have been mutated
        updated = true;
      }
    }

    if (!updated) {
      return;
    }

    if (this.listener) {
      this.listener.next(this.state);
    } else if (this.listeners) {
      this.listeners.forEach(g => g.next(this.state));
    }
  }

  listen(onNext) {
    let iter = this[Symbol.asyncIterator]();
    (async function() { for await (let x of iter) onNext(x); })();
    return () => { iter.return(); };
  }

}
