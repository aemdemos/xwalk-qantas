// This file will be run before tests to set up the environment

// Implement window.matchMedia
window.matchMedia = function (query) {
  return {
    matches: query.includes('(min-width: 1024px)'),
    media: query,
    onchange: null,
    addListener(listener) {
      if (listener) this._listeners.push(listener);
    },
    removeListener() { },
    addEventListener(event, listener) {
      if (event === 'change' && listener) this._listeners.push(listener);
    },
    removeEventListener() { },
    dispatchEvent() { },
    _listeners: [],
  };
};
