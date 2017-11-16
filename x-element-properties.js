/**
 * Implements property to attribute reflection.
 */

import XElementBasic from './x-element-basic.js';

const caseMap = {};
const DASH_TO_CAMEL = /-[a-z]/g;
const CAMEL_TO_DASH = /([A-Z])/g;

export default class AbstractPropertiesElement extends XElementBasic {
  connectedCallback() {
    super.connectedCallback();
    // Only reflect attributes when the element is connected
    // See https://dom.spec.whatwg.org/#dom-node-isconnected
    this.constructor.initializeProperties(this);
  }

  attributeChangedCallback(attr, oldValue, newValue) {
    if (newValue !== oldValue) {
      const props = this.constructor.properties;
      const prop = this.constructor.dashToCamelCase(attr);
      const type = props[prop].type;
      // Ensure all attribute changes are processed by property accessors.
      // This is required for frameworks which set attributes instead of props.
      // Keeping properties in sync with attributes is less confusing too.
      // NOTE: initial attribute values are processed in `connectedCallback`
      if (this.propertiesInitialized) {
        this[prop] = this.constructor.deserialize(attr, newValue, type);
      }
    }
  }

  get propertiesInitialized() {
    return this.__initialized;
  }

  static get properties() {
    return {};
  }

  /**
   * Derives observed attributes using the `properties` definition block
   * See https://developer.mozilla.org/en-US/docs/Web/Web_Components/Custom_Elements#Observed_attributes
   */
  static get observedAttributes() {
    const props = this.properties;
    if (props) {
      return Object.keys(props).map(this.camelToDashCase);
    }
  }

  static initializeProperties(target) {
    // Configure user defined property getter/setters
    const props = target.constructor.properties;
    for (const prop in props) {
      const { type, value, reflect } = props[prop];
      this.addPropertyAccessor(target, prop, type, value, reflect);
    }
    target.__initialized = true;
  }

  static addPropertyAccessor(target, prop, type, defaultValue, reflect) {
    const symbol = Symbol.for(prop);
    const attr = this.camelToDashCase(prop);
    // Capture the property value prior to creating the accessor functions
    const initialValue = target[prop];

    Object.defineProperty(target, prop, {
      get() {
        if (reflect) {
          if (type.name === 'Boolean') {
            return target.hasAttribute(attr);
          } else if (type.name === 'String') {
            return type(target.getAttribute(attr) || '');
          } else if (type.name === 'Number') {
            return type(target.getAttribute(attr));
          } else {
            console.warn(`
              Attempted to read "${prop}" as a reflected property,
              but it is not a Boolean, String, or Number type.
            `);
          }
        } else {
          return target[symbol];
        }
      },
      set(valueOrFn) {
        // Resolve values passed as functions
        const value = valueOrFn instanceof Function ? valueOrFn() : valueOrFn;
        // Apply the user-provided type function
        const result = this.constructor.coerce(value, type);
        if (reflect) {
          if (type.name === 'Boolean') {
            if (result) {
              target.setAttribute(attr, '');
            } else {
              target.removeAttribute(attr);
            }
          } else if (type.name === 'String' || type.name === 'Number') {
            const isUndefined = value === undefined;
            const isNull = Object.is(value, null);
            const shouldReflect = !isUndefined && !isNull;
            if (shouldReflect) {
              target.setAttribute(attr, result);
            } else {
              target.removeAttribute(attr);
            }
          } else {
            console.warn(`
              Attempted to write "${prop}" as a reflected property,
              but it is not a Boolean, String, or Number type.
            `);
          }
        } else {
          target[symbol] = result;
        }
        // mark template dirty
        target.invalidate();
      },
    });

    // Process possible sources of initial state, with this priority:
    // 1. imperative, e.g. `element.prop = 'value';`
    // 2. declarative, e.g. `<element prop="value"></element>`
    // 3. definition, e.g. `properties: { prop: { value: 'value' } }`
    if (initialValue !== undefined) {
      // pass user provided initial state through the accessor
      target[prop] = initialValue;
    } else if (target.hasAttribute(attr)) {
      // Read attributes configured before the accessor functions exist as
      // these values were not yet passed through the property -> attribute path
      target[prop] = this.deserialize(attr, target.getAttribute(attr), type);
    } else if (defaultValue !== undefined) {
      // pass element default through the accessor
      target[prop] = defaultValue;
    }
  }

  static coerce(value, type) {
    if (type.name === 'Array') {
      return Array.isArray(value) ? value : null;
    } else if (type.name === 'Object') {
      return Object.prototype.toString.call(value) === '[object Object]'
        ? value
        : null;
    } else {
      return type(value);
    }
  }

  static deserialize(attr, value, type) {
    if (value === 'undefined') {
      return undefined;
    } else if (type.name === 'Boolean') {
      return value === '' || value === 'true' || value === attr;
    } else {
      return value;
    }
  }

  static dashToCamelCase(dash) {
    return (
      caseMap[dash] ||
      (caseMap[dash] =
        dash.indexOf('-') < 0
          ? dash
          : dash.replace(DASH_TO_CAMEL, m => m[1].toUpperCase()))
    );
  }

  static camelToDashCase(camel) {
    return (
      caseMap[camel] ||
      (caseMap[camel] = camel.replace(CAMEL_TO_DASH, '-$1').toLowerCase())
    );
  }
}
