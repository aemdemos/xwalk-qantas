// Vitest setup file
// This will run before any test files

// Define window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: function matchMedia(query) {
    return {
      matches: query.includes('(min-width: 1024px)'),
      media: query,
      onchange: null,
      addListener(listener) {
        if (listener) this.listeners.push(listener);
      },
      removeListener() {},
      addEventListener(event, listener) {
        if (event === 'change' && listener) this.listeners.push(listener);
      },
      removeEventListener() {},
      dispatchEvent() {},
      listeners: []
    };
  },
}); 