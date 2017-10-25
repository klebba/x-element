import ready from '../../etc/ready.js';

class Hello extends React.Component {
  render() {
    return React.createElement(
      'div',
      {},
      React.createElement('hello-world', { rank: this.props.rank }, null),
      React.createElement('hello-world', { rank: '\u2655' }, null),
      React.createElement('hello-world', {}, null)
    );
  }
}

ready(document).then(() => {
  const root = document.getElementById('root');
  ReactDOM.render(React.createElement(Hello, {}, null), root);

  const ranks = ['\u2655', '\u2654', '\u2656', ''];

  setInterval(() => {
    const rank = ranks[Math.floor(Math.random() * ranks.length)];
    ReactDOM.render(React.createElement(Hello, { rank: rank }, null), root);
  }, 250);
});
