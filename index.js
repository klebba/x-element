import XElement from './x-element.js';

class HelloElement extends XElement {
  static template(html) {
    return ({ rank }) => html`
      <style>
        :host {
          display: block;
          width: var(--hello-size, 8rem);
          height: var(--hello-size, 8rem);
          background-color: cyan;
          border-radius: 50%;
          margin: 0.25rem;
          box-sizing: border-box;
        }

        #container {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          font-size: calc(var(--hello-size, 8rem) * calc(5/11));
        }

        :host([rank="\u2655"]) {
          border: 4px dotted hsl(120, 100%, 50%);
          background-color: yellow;
        }

        :host([rank="\u2654"]) {
          border: 3px solid hsl(270, 100%, 50%);
          background-color: magenta;
          color: blue;
        }

        :host(:not([rank])),
        :host([rank=""]) {
          background-color: #ccc;
        }

        #container:empty::before {
          content: '\u265F';
        }
      </style>
      <div id="container">${rank}</div>
    `;
  }

  static get properties() {
    return {
      rank: {
        type: String,
        reflect: true,
      },
    };
  }
}

customElements.define('hello-world', HelloElement);
