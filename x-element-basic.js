/**
 * Implements a naive template rendering system and a few helpers.
 */

export default class AbstractBasicElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    // cause the template to perform an initial render
    this.render();
  }

  connectedCallback() {
    this.constructor.upgradeObservedAttributes(this);
  }

  render() {
    this.shadowRoot.innerHTML = this.constructor.template()(this);
  }

  /**
   * Used to flag element for async template render. This prevents the template
   * from rendering more than once for multiple synchronous property changes.
   * All the changes will be batched in a single render.
   */
  async invalidate() {
    if (!this.__needsRender) {
      this.__needsRender = true;
      // schedule microtask, which runs before requestAnimationFrame
      // https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/
      this.__needsRender = await false;
      this.render();
    }
  }

  listen(el, type, cb) {
    if (el instanceof HTMLElement && type && cb instanceof Function) {
      const bound = this[cb.name].bind(this);
      el.addEventListener(type, bound);
      // save reference to instance bound function
      this[Symbol.for(cb.name)] = bound;
    }
  }

  unlisten(el, type, cb) {
    const bound = this[Symbol.for(cb.name)];
    if (bound) {
      el.removeEventListener(type, bound);
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/webappapis.html#erroreventinit
   */
  dispatchError(err) {
    const evt = new ErrorEvent('error', {
      error: err,
      message: err.message,
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(evt);
  }

  static template() {
    return () => ``;
  }

  static upgradeObservedAttributes(target) {
    const attrs = this.observedAttributes;
    if (Array.isArray(attrs)) {
      attrs.forEach(attr => this.upgradeProperty(target, attr));
    }
  }

  /**
   * @see https://developers.google.com/web/fundamentals/web-components/best-practices#lazy-properties
   */
  static upgradeProperty(target, prop) {
    if (target.hasOwnProperty(prop)) {
      const value = target[prop];
      // delete property so it does not shadow the element post-upgrade
      // noop if the property is not configurable (e.g. already has accessors)
      Reflect.deleteProperty(target, prop);
      target[prop] = value;
    }
  }
}
