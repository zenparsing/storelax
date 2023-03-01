import { EventStream } from 'geneviv';

const Notifying = Symbol();
const State = Symbol();
const Listener = Symbol();
const Listeners = Symbol();
const NotifyQueued = Symbol();
const NewListeners = Symbol();
const Stream = Symbol();

function enqueue(fn) {
  EventStream.of(undefined).listen(fn);
}

function notify(listener, value) {
  try {
    listener.next(value);
  } catch (err) {
    enqueue(() => { throw err; });
  }
}

export class Store {

  constructor(source = null) {
    if (typeof source !== 'object') {
      throw new Error('Invalid initialization source');
    }

    this[State] = Object.assign({}, source);
    this[Listener] = null;
    this[Listeners] = null;
    this[Notifying] = false;
    this[NotifyQueued] = false;
    this[NewListeners] = null;

    this[Stream] = new EventStream(listener => {
      if (!this[Listener] && !this[Listeners]) {
        this.wakeCallback();
      }

      if (this[Listeners]) {
        this[Listeners].add(listener);
      } else if (!this[Listener]) {
        this[Listener] = listener;
      } else {
        this[Listeners] = new Set();
        this[Listeners].add(this[Listener]);
        this[Listeners].add(listener);
        this[Listener] = null;
      }

      if (this[NewListeners]) {
        this[NewListeners].push(listener);
      } else {
        this[NewListeners] = [listener];
        enqueue(() => {
          let list = this[NewListeners];
          if (list) {
            this[NewListeners] = null;
            for (let listener of list) {
              if (!listener.done) {
                this[Notifying] = true;
                notify(listener, this[State]);
                this[Notifying] = false;
              }
            }
          }
        });
      }

      return () => {
        if (this[Listeners]) {
          this[Listeners].delete(listener);
          if (this[Listeners].size === 0) {
            this[Listeners] = null;
          }
        } else {
          // assert(this[Listener] === listener)
          this[Listener] = null;
        }
        if (!this[Listener] && !this[Listeners]) {
          this.sleepCallback();
        }
      };
    });

  }

  get state() {
    return this[State];
  }

  get stream() {
    return this[Stream];
  }

  map(fn) {
    return this[Stream].map(fn);
  }

  listen(listener) {
    return this[Stream].listen(listener);
  }

  [Symbol.asyncIterator]() {
    return this[Stream][Symbol.asyncIterator];
  }

  wakeCallback() {}

  sleepCallback() {}

  update(source = null) {
    if (typeof source !== 'object') {
      throw new Error('Invalid update source');
    }

    Object.assign(this[State], source);

    this[NewListeners] = null;

    if (this[Notifying]) {
      if (!this[NotifyQueued]) {
        enqueue(() => {
          this[NotifyQueued] = false;
          this.update();
        });
        this[NotifyQueued] = true;
      }
      return;
    }

    this[Notifying] = true;

    if (this[Listener]) {
      notify(this[Listener], this[State]);
    } else if (this[Listeners]) {
      for (let listener of this[Listeners]) {
        notify(listener, this[State]);
      }
    }

    this[Notifying] = false;
  }

}
