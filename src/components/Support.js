import React from 'reactn'
import StickyNav from './StickyNav'
import Table from 'react-bootstrap/Table'
import Card from 'react-bootstrap/Card'
import FormControl from 'react-bootstrap/FormControl'
const moment = require('moment')
export default class Support extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      posts: [], 
      thisConvo: {},
      messageText: ""
    }
  }

  setConversation = async (convo) => {
    try {
      const messageData = JSON.parse(convo.message)
      const { message, name } = messageData
      const { space } = this.global
      let posts = []
      const thisConvo = await space.joinThreadByAddress(message)
      let bodyDiv
      thisConvo.onUpdate(async() => {
        posts = await thisConvo.getPosts()
        this.setState({ posts })
        bodyDiv = document.getElementById('support-card-body')
        bodyDiv.scrollTop = bodyDiv.scrollHeight
      })
      posts = await thisConvo.getPosts()
      thisConvo['name'] = name
      this.setState({ posts, thisConvo })
      bodyDiv = document.getElementById('support-card-body')
      bodyDiv.scrollTop = bodyDiv.scrollHeight
    } catch(e) {
      console.log(e)
    }
  }

  handleEnter = (e) => {
    const { thisConvo, messageText } = this.state
    if(e.key === 'Enter'){
      const post = {
        name: "SimpleID", //TODO: This should be an actual agent name
        message: messageText
      }
      thisConvo.post(JSON.stringify(post))
      this.setState({ messageText: "" })
    }
  }

  renderConversationsList() {
    const { liveChatThreads } = this.global    
    return (
      <div>
        <p>Click to open a conversation</p>
      <Card>
        <Card.Body>
          <Table responsive>
            <thead>
              <tr>
                <th>User</th>
                <th>Date</th>
                <th>Messages</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
            {
              liveChatThreads.map((convo) => {
                return (
                  <tr key={convo.postId}>
                    <td><button onClick={() => this.setConversation(convo)} className="a-el-fix">{convo.name ? convo.name : "Unknown User"}</button></td>
                    <td>{moment.unix(convo.timestamp).format("MM/DD/YYYY")}</td>
                    <td>{convo.postCount}</td>
                    <td>Close</td>
                  </tr>
                )
              })
            }
            </tbody>
          </Table>
          </Card.Body>
        </Card>
      </div>
    )
  }

  renderSingleConversation() {
    const { posts, messageText, thisConvo } = this.state
    const { box, sessionData } = this.global
    const appId = sessionData.id
    if(posts.length > 0) {
      return (
        <div>
          <Card>
            <Card.Header className="support-card-header">Conversation With {thisConvo.name} <span style={{float: 'right', fontSize: "10px"}}>Close Conversation</span> </Card.Header>
            <Card.Body id="support-card-body">
              {
                posts.map(post => {  
                  const parsedMessage = JSON.parse(post.message)
                  const { message } = parsedMessage  
                  return (
                    <div key={post.postId} className={box._3id._subDIDs[appId] === post.author ? 'from-us' : 'from-them'}>{message}</div>
                  )
                })
              }
              </Card.Body>
              <Card.Footer className="chat-footer">
                <FormControl id="message-input" value={messageText} onKeyPress={this.handleEnter} onChange={(e) => this.setState({ messageText: e.target.value})} />
              </Card.Footer>
          </Card>
        </div>
      )
    } else {
      return (
        <div>
          <h5>Select a conversation from the left to see messages and respond.</h5>
        </div>
      )
    }
  }

  render() {
    return (
      <main className="main-content col-lg-10 col-md-9 col-sm-12 p-0 offset-lg-2 offset-md-3">
        <StickyNav />
        <div className="main-content-container container-fluid px-4">
          <div className="page-header row no-gutters py-4">
            <div className="col-12 col-sm-4 text-center text-sm-left mb-0">
              <span className="text-uppercase page-subtitle">Support</span>
              <h3 className="page-title">Real-Time Messaging</h3>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
              <h5>Support Conversations</h5>
              
              {this.renderConversationsList()}
              
              
            </div>

            <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
              
              {this.renderSingleConversation()}
              
              
            </div>
          </div>
        </div>
      </main>
    )

  }
}