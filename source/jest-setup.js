// React 18 requires this to be set so that act() synchronously flushes
// pending state updates in tests. Without it, act() prints a warning and
// may not flush synchronously, causing stale DOM assertions.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('dom-helpers/util/scrollbarSize', () => {
  return function getScrollbarSize() {
    return 20;
  };
});

// React 18 automatic batching: state updates from Simulate events are now
// deferred/batched when the component tree was mounted with createRoot.
// Patch all Simulate methods to wrap in act() so that pending state updates
// are flushed synchronously before the test continues, preserving the existing
// test expectations without modifying individual test files.
const {Simulate, act} = require('react-dom/test-utils');
if (Simulate && act) {
  Object.keys(Simulate).forEach(eventName => {
    const original = Simulate[eventName];
    Simulate[eventName] = (...args) => {
      act(() => {
        original(...args);
      });
    };
  });
}
