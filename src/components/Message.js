import React from 'reactn';

export default class Message extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      message: "<div><p>Hey there, friends! It's 2020 now, so let's reflect.</p><p>We had some good times and some bad times, but for the most part, we had fun.</p><p><a href='https://simpleid.xyz'>Click here</a> to enter our new contest. It's going to be a blast!</p></div>"
    }
  }
  componentDidMount() {
    const appId = window.location.href.split('/appId=')[1].split('&')[0];
    const messageId = window.location.href.split('/appId=')[1].split('messageId=')[1]
    document.body.style.background = "#fff";
  }

  createMarkup = () => {
    const { message } = this.state;
    return {
      __html: message
    };
  }

  render() {
    return(
      <div style={{width: "100%"}}>
        <div className="message-body">
          <h2>Welcome Back, Friends!</h2>
          <div dangerouslySetInnerHTML={this.createMarkup()} />
        </div>
      </div>
    )
  }
}