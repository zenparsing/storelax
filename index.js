'use strict';

var symbolObservable = require('symbol-observable');
var Observable = require('zen-observable');
var PushStream = require('zen-push');

module.exports = Store;

function Store(data) {
  var state = Object.create(null);
  var stream = new PushStream(this);

  this.observable = new Observable(function(sink) {
    var subscription = stream.observable.subscribe(sink);
    sink.next(state);
    return subscription;
  });

  if (data) {
    for (var key in data) {
      state[key] = data[key];
    }
  }

  this._state = state;
  this._stream = stream;
}

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
    this._stream.next(this._state);
  }
};

Store.prototype.subscribe = function(fn) {
  return this.observable.subscribe(fn);
};

Store.prototype[symbolObservable] = function() {
  return this.observable;
};
