'use strict';

var Observable = require('zen-observable');

function sendNext(self) {
  var value = self._state;
  if (self._observer) {
    sendTo(self._observer, value);
  } else if (self._observers) {
    self._observers.forEach(function(to) { sendTo(to, value); });
  }
}

function sendTo(observer, value) {
  if (observer._nexting) {
    observer.error(new Error('Subscriber is already running'));
  } else {
    observer._nexting = true;
    observer.next(value);
    observer._nexting = false;
  }
}

function unobserved(self) {
  return !self._observer && !self._observers;
}

function addObserver(self, observer) {
  if (self._observers) {
    self._observers.add(observer);
  } else if (!self._observer) {
    self._observer = observer;
  } else {
    self._observers = new Set();
    self._observers.add(self._observer);
    self._observers.add(observer);
    self._observer = null;
  }
}

function deleteObserver(self, observer) {
  if (self._observers) {
    self._observers.delete(observer);
    if (self._observers.size === 0) {
      self._observers = null;
    }
  } else if (self._observer === observer) {
    self._observer = null;
  }
}

function Store(data) {
  if (!(this instanceof Store)) {
    throw new TypeError('Cannot call constructor as a function');
  }

  this._state = Object.create(null);
  this._observer = null;
  this._observers = null;

  if (data) {
    for (var key in data) {
      this._state[key] = data[key];
    }
  }

  var self = this;

  this.observable = new Observable(function(observer) {
    unobserved(self) && self.observedCallback();
    addObserver(self, observer);
    sendTo(observer, self._state);
    return function() {
      deleteObserver(self, observer);
      unobserved(self) && self.unobservedCallback();
    };
  });
}

Store.prototype.observedCallback = function() {};

Store.prototype.unobservedCallback = function() {};

Store.prototype.read = function(fn) {
  return fn ? fn(this._state) : this._state;
};

Store.prototype.update = function(data) {
  if (typeof data === 'function') {
    data = data(this._state);
  }

  if (data === null || data === undefined || data === this._state) {
    return;
  }

  var updated = false;
  for (var key in data) {
    var prev = this._state[key];
    var next = data[key];

    if (prev !== next) {
      // Non-identical values trigger updates
      updated = true;
      this._state[key] = next;
    } else if (prev && typeof prev === 'object') {
      // Assume that identitical objects have been mutated
      updated = true;
    }
  }

  if (updated) {
    sendNext(this);
  }
};

Store.prototype.subscribe = function(fn) {
  return this.observable.subscribe(fn);
};

Store.prototype[Observable.extensions.observableSymbol] = function() {
  return this.observable;
};

module.exports = Store;
