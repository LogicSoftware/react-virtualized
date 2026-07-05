import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {createRoot} from 'react-dom/client';

/**
 * Helper method for testing components that may use Portal and thus require cleanup.
 * This helper method renders components to a transient node that is destroyed after the test completes.
 * Note that rendering twice within the same test method will update the same element (rather than recreate it).
 */
export function render(markup) {
  if (!render._mountNode) {
    render._mountNode = document.createElement('div');

    // Unless we attach the mount-node to body, getBoundingClientRect() won't work
    document.body.appendChild(render._mountNode);
  }

  if (!render._root) {
    render._root = createRoot(render._mountNode);
  }

  // Inject a ref to capture the component instance, composing with any
  // existing ref on the root element so tests that pass their own refs still work.
  const originalRef = markup.ref;
  let instanceHolder = {current: null};

  const mergedRef = el => {
    instanceHolder.current = el;
    if (typeof originalRef === 'function') {
      originalRef(el);
    } else if (
      originalRef !== null &&
      typeof originalRef === 'object' &&
      'current' in originalRef
    ) {
      originalRef.current = el;
    }
  };

  let markupWithRef;
  try {
    markupWithRef = React.cloneElement(markup, {ref: mergedRef});
  } catch (e) {
    markupWithRef = markup;
  }

  // React 18's createRoot renders asynchronously; use flushSync to keep tests synchronous
  const {flushSync} = ReactDOM;
  flushSync(() => {
    render._root.render(markupWithRef);
  });

  // Expose instance for tests that call public imperative methods on the component
  render._instance = instanceHolder.current;

  return render._mountNode.firstChild;
}

/**
 * The render() method auto-unmounts components after each test has completed.
 * Use this method manually to test the componentWillUnmount() lifecycle method.
 */
render.unmount = function() {
  if (render._root) {
    render._root.unmount();
    render._root = null;
  }

  if (render._mountNode) {
    document.body.removeChild(render._mountNode);
    render._mountNode = null;
  }

  render._instance = null;
};

// Register cleanup after each test at module level (required by jest-circus in Jest 27+).
// This is a no-op when render() has not been called in a given test.
afterEach(render.unmount);

