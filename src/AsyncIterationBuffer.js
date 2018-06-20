export class AsyncIterationBuffer {

  constructor(options = {}) {
    // It might make sense to allow the user to specify a buffering policy by
    // either allowing them to provide their own Array-like or by allowing
    // them to provide callbacks to govern buffering policy
    this.queue = [];
    this.requests = [];
    this.cancel = options.cancel || (() => {});
  }

  [Symbol.asyncIterator]() {
    return {
      [Symbol.asyncIterator]() { return this; },
      next: () => {
        try {
          if (this.queue.length > 0) {
            return this.queue.shift();
          }
        } catch (e) {
          return Promise.reject(e);
        }

        return new Promise((resolve, reject) => this.requests.push({ resolve, reject }));
      },
      return: () => {
        return new Promise(resolve => {
          this.cancel();
          while (this.requests.length > 0) {
            this.requests.shift().resolve({ value: undefined, done: true });
          }
          resolve({ value: undefined, done: true });
        });
      },
    };
  }

  next(value) {
    let result = { value, done: false };
    if (this.requests.length > 0) {
      this.requests.shift().resolve(result);
    } else {
      this.queue.push(Promise.resolve(result));
    }
  }

  throw(value) {
    if (this.requests.length > 0) {
      this.requests.shift().reject(value);
    } else {
      this.queue.push(Promise.reject(value));
    }
  }

  return(value) {
    let result = { value, done: true };
    if (this.requests.length > 0) {
      this.requests.shift().resolve(result);
    } else {
      this.queue.push(Promise.resolve(result));
    }
  }

}
