import React from 'react';

class Typewriter extends React.Component {
  constructor(props) {
    super(props);
    this.state = { displayed: "" };
    this.interval = null;
  }

  componentDidMount() {
  const { text = "", speed = 100 } = this.props;
  const cleanText = String(text).trim();

  if (!cleanText) return;

  let i = 0;
  this.interval = setInterval(() => {
    if (i < cleanText.length) {
      this.setState({ displayed: cleanText.substring(0, i + 1) }); // ✅ slice from 0 every time, no missing chars
      i++;
    } else {
      clearInterval(this.interval);
    }
  }, speed);
}

  componentWillUnmount() {
    if (this.interval) clearInterval(this.interval);
  }

  render() {
    return <span>{this.state.displayed}</span>;
  }
}

export default Typewriter;