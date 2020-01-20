import React from 'reactn';
//import { getFromOrganizationDataTable } from '../utils/awsUtils';

export default class Message extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      message: "<div><p>Hey there, friends! It's 2020 now, so let's reflect.</p><p>We had some good times and some bad times, but for the most part, we had fun.</p><p><a href='https://simpleid.xyz'>Click here</a> to enter our new contest. It's going to be a blast!</p></div>"
    }
  }
  async componentDidMount() {
    // const url = window.location.href
    // const orgId = url.split("orgId=")[1].split("&appId=")[0]
    // const appId = url.split("orgId=")[1].split("&appId=")[1].split('&messageIds=')[0]
    // const messageId = url.split("orgId=")[1].split("&appId=")[1].split('&messageIds=')[1]

    // document.body.style.background = "#fff";
    // // const orgData = await getFromOrganizationDataTable(orgId);
    // // console.log("IFRAME STUFF: ", orgData);
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