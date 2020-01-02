'use strict';

const { AsyncIterationBuffer } = require('async-iteration-buffer');
const { EventStream } = require('geneviv');

class Store {

  constructor(state) {
    if (state === undefined) {
      state = null;
    }

    this._listener = null;
    this._listeners = null;
    this._state = state;
    this._notifying = false;
    this._notifyQueued = false;

    this._stream = new EventStream(listener => {
      if (!this._listener && !this._listeners) {
        this.wakeCallback();
      }

      if (this._listeners) {
        this._listeners.add(listener);
      } else if (!this._listener) {
        this._listener = listener;
      } else {
        this._listeners = new Set();
        this._listeners.add(this._listener);
        this._listeners.add(listener);
        this._listener = null;
      }

      EventStream.of(null).listen(() => {
        if (!listener.done) {
          this._notify(listener);
        }
      });

      return () => {
        if (this._listeners) {
          this._listeners.delete(listener);
          if (this._listeners.size === 0) {
            this._listeners = null;
          }
        } else {
          // assert(this._listener === listener)
          this._listener = null;
        }
        if (!this._listener && !this._listeners) {
          this.sleepCallback();
        }
      };
    });
  }

  get state() {
    return this._state;
  }

  listen(listener) {
    return this._stream.listen(listener);
  }

  [Symbol.asyncIterator]() {
    let cancel;

    let buffer = new AsyncIterationBuffer({
      cancel() { cancel(); },
    });

    cancel = this.listen(buffer);

    return buffer[Symbol.asyncIterator]();
  }

  wakeCallback() {}

  sleepCallback() {}

  update(state) {
    if (typeof state === 'function') {
      state = state(this._state);
    }

    if (state !== undefined) {
      this._state = state;
    }

    if (this._notifying) {
      this._queueNotification();
      return;
    }

    if (this._listener) {
      this._notify(this._listener);
    } else if (this._listeners) {
      for (let listener of this._listeners) {
        this._notify(listener);
      }
    }
  }

  _notify(listener) {
    try {
      this._notifying = true;
      listener.next(this._state);
    } catch (err) {
      setTimeout(() => { throw err; }, 0);
    } finally {
      this._notifying = false;
    }
  }

  _queueNotification() {
    if (!this._notifyQueued) {
      EventStream.of(null).listen(() => {
        this._notifyQueued = false;
        this.update();
      });
      this._notifyQueued = true;
    }
  }

}

module.exports = { Store };
