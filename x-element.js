/**
 * Extension of the XElementProperties class which introduces templating using
 * the `lit-html` library for improved performance and functionality.
 */

import XElementProperties from './x-element-properties.js';
import { render, html } from '../../node_modules/lit-html/lib/lit-extended.js';
import { repeat } from '../../node_modules/lit-html/lib/repeat.js';

export default class AbstractElement extends XElementProperties {
  render() {
    // apply the props to the template, then render it to the shadowRoot
    const tmpl = this.constructor.template(html, repeat);
    render(tmpl(this), this.shadowRoot);
  }

  static template(html, repeat) {
    return () => html``;
  }
}
