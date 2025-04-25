// This file will be run before tests to set up the environment

// Implement window.matchMedia
window.matchMedia = function matchMedia(query) {
  return {
    matches: query.includes('(min-width: 1024px)'),
    media: query,
    onchange: null,
    addListener(listener) {
      if (listener) this.listeners.push(listener);
    },
    removeListener() { },
    addEventListener(event, listener) {
      if (event === 'change' && listener) this.listeners.push(listener);
    },
    removeEventListener() { },
    dispatchEvent() { },
    listeners: [],
  };
};
