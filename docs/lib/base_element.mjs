export const createBaseElement = (() => {
  const lifecycleListeners = Symbol("lifecycleListeners");

  return createBaseElement;

  function createBaseElement(superClass) {
    return class BaseElement extends superClass {
      constructor() {
        super();
        this[lifecycleListeners] = [];
      }
      connectedCallback() {
        this[lifecycleListeners].forEach((it) => it.connect());
      }
      disconnectedCallback() {
        this[lifecycleListeners].forEach((it) => it.disconnect());
      }

      /**
       * @param factory {() => () => void}
       */
      addLifecycleListener(factory) {
        let cleanup = () => { };
        const connect = () => (cleanup = factory());
        const disconnect = () => cleanup();

        if (this.isConnected) {
          connect();
          const listener = {
            // already connected, avoid calling back connect() twice
            connect: () => { },
            disconnect: () => {
              disconnect();
              // after disconnection, be normal listener
              listener.connect = connect;
              listener.disconnect = disconnect;
            },
          };
          this[lifecycleListeners].push(listener);
        } else {
          this[lifecycleListeners].push({ connect, disconnect });
        }
      }

      /**
       * @param selector {string}
       * @returns {{ exists: boolean, element: HTMLElement | null, promise: Promise<HTMLElement> }}
       */
      asyncQuerySelector(selector) {
        const obj = {
          exists: false,
          element: null,
        };

        obj.element = this.querySelector(selector);
        if (obj.element) {
          obj.exists = true;
          obj.promise = Promise.resolve(obj.element);
          return obj;
        }

        obj.promise = new Promise((resolve) => {
          const observer = new MutationObserver(() => {
            obj.element = this.querySelector(selector);
            if (obj.element) {
              resolve(obj.element);
              obj.exists = true;
              observer.disconnect();
            }
          });

          this.addLifecycleListener(() => {
            observer.observe(this, { childList: true, subtree: true });
            return () => observer.disconnect();
          });
        });

        return obj;
      }

      /**
       * @param target {Element}
       * @param event {string}
       * @param callback {Function}
       */
      aliveListener(target, event, callback) {
        this.addLifecycleListener(() => {
          target.addEventListener(event, callback);
          return () => target.removeEventListener(event, callback);
        });
      }

      /**
       * @param callbacks {object}
       * @param callbacks.show {Function}
       * @param callbacks.hide {Function}
       */
      visibilityListener({ show, hide }) {
        let isShowing = false;

        const observer = new IntersectionObserver((entries) => {
          for (const entry of entries) {
            if (entry.target !== this) continue;
            if (isShowing !== entry.isIntersecting) {
              isShowing = entry.isIntersecting;
              if (isShowing) {
                show();
              } else {
                hide();
              }
            }
          }
        });

        this.addLifecycleListener(() => {
          isShowing = isInViewport(this);
          if (isShowing) show();
          observer.observe(this);
          return () => {
            observer.disconnect();
            if (isShowing) hide();
            isShowing = false;
          };
        });
      }
    };
  }

  function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.right > 0 &&
      rect.bottom > 0 &&
      rect.left < window.innerWidth &&
      rect.top < window.innerHeight
    );
  }
})();

export const BaseElement = createBaseElement(HTMLElement);
