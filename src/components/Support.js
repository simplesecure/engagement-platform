import React, {setGlobal} from 'reactn'
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
      messageText: "", 
      mainConvo: {}, 
      reportsView: false
    }
  }

  setConversation = async (convo) => {
    this.setState({ mainConvo: convo })
    try {
      const messageData = JSON.parse(convo.message)
      const { name } = messageData
      let posts = []
      const thisConvo = await this.getConversationData(messageData)
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

  getConversationData = async (messageData) => {
    const { space } = this.global
    return new Promise(async (resolve, reject) => {
      const { message } = messageData
      try {
        const thisConvo = await space.joinThreadByAddress(message)
        resolve(thisConvo)
      } catch(e) {
        reject(e)
      }
    })
  }

  handleEnter = (e) => {
    const { thisConvo, messageText } = this.state
    if(e.key === 'Enter'){
      setGlobal({ ourMessage: true })
      const post = {
        name: "SimpleID", //TODO: This should be an actual agent name
        message: messageText
      }
      thisConvo.post(JSON.stringify(post))
      this.setState({ messageText: "" })
    }
  }

  handleClose = async (convo) => {
    const { openChatThreads, closedChatThreads } = this.global
    try {
      const messageData = JSON.parse(convo.message)
      const thisConvo = await this.getConversationData(messageData)
      const post = {
        name: "SimpleID", 
        message: "CONVERSATION CLOSED"
      }
      await thisConvo.post(JSON.stringify(post))
      // Now, let's remove the thread from the main liveChat threads

      const index = openChatThreads.map(a => a.name).indexOf(convo.name)
      if(index > -1) {
        const updatedChatThreads = openChatThreads.splice(index, 1)
        closedChatThreads.push(convo)
        //  If there is an open conversation, need to check if it matches the one being closed
        //  If it does, remove it from the view
        if(thisConvo && thisConvo.name === convo.name) {
          this.setState({ thisConvo: {}, posts: [] })
        }
        //  Now update state to reflect all the changes (one less liveChatThread, one more closedChatThread)
        setGlobal({ openChatThreads: openChatThreads.length > 0 ? updatedChatThreads : [], closedChatThreads })
      } else {
        console.log("Error with index")
      }
    } catch(e) {
      console.log(e)
    }
  }

  handleRenderReports = () => {
    const { reportsView } = this.state
    this.setState({ reportsView: !reportsView})
  }

  renderConversationsList(open) {
    const { openChatThreads, closedChatThreads } = this.global  
    let chats = []
    if(open) {
      chats = openChatThreads
    } else {
      chats = closedChatThreads
    }
    return (
      <div>
      <Card>
        <Card.Header>
          {open ? "Open Conversations" : "Closed Conversations"}
        </Card.Header>
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
              chats.map((convo) => {
                return (
                  <tr key={convo.postId}>
                    <td><button onClick={() => this.setConversation(convo)} className="a-el-fix">{convo.name ? convo.name : "Unknown User"}</button></td>
                    <td>{moment.unix(convo.timestamp).format("MM/DD/YYYY")}</td>
                    <td>{convo.postCount}</td>
                    <td className="clickable" onClick={open ? () => this.handleClose(convo) : () => this.setConversation(convo)}>{open ? "Close" : "Re-Open"}</td>
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
    const { posts, messageText, thisConvo, mainConvo } = this.state
    const { box, sessionData } = this.global
    const appId = sessionData.id
    if(posts.length > 0) {
      return (
        <div>
          <Card>
            <Card.Header className="support-card-header">Conversation With {thisConvo.name} <span onClick={() => this.handleClose(mainConvo)} className="clickable" style={{float: 'right', fontSize: "10px"}}>Close Conversation</span> </Card.Header>
            <Card.Body id="support-card-body">
              {
                posts.map(post => {  
                  const parsedMessage = JSON.parse(post.message)
                  const { message } = parsedMessage  
                  return (
                    <div key={post.postId} id={post.postId} className={message === "CONVERSATION CLOSED" ? "closed-convo-style" : box._3id._subDIDs[appId] === post.author ? 'from-us' : 'from-them'}>{message}</div>
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

  renderReports() {
    //const { openChatThreads, closedChatThreads } = this.global
    const conversationsByDay = document.getElementById('conversationsByDay')
    if(conversationsByDay) {
     // Reports here eventually
    }
    
    return (
      <div>
        <h5>Reports</h5>
        <p>Here are your default reports.</p>
        <div className="row">
          <div className="col col-sm-12 col-md-6">
            <canvas id="conversationsByDay" width="300" height="300"></canvas>
          </div>
        </div>
      </div>
    )
  }

  render() {
    const { reportsView } = this.state
    // eslint-disable-next-line
    let openConversations
    return (
      <main className="main-content col-lg-10 col-md-9 col-sm-12 p-0 offset-lg-2 offset-md-3">
        <StickyNav />
        <div className="main-content-container container-fluid px-4">
          <div className="page-header row no-gutters py-4">
            <div className="col-12 col-sm-4 text-center text-sm-left mb-0">
              <span className="text-uppercase page-subtitle">Support</span>
              <h3 className="page-title">Real-Time Messaging <span onClick={this.handleRenderReports} className="clickable"><i className="material-icons">insert_chart</i></span></h3>
            </div>
          </div>
          {
            reportsView ? 
            <div>
              {this.renderReports()}
            </div> : 
            <div className="row">
              <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
                <h5>Support Conversations</h5>
                <p>Click to open a conversation</p>
                <div style={{marginTop: "20px"}}>
                  {this.renderConversationsList(openConversations = true)}
                </div>
                <div style={{marginTop: "20px"}}>
                  {this.renderConversationsList(openConversations = false)}
                </div>
              </div>

              <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
                
                {this.renderSingleConversation()}
                
                
              </div>
            </div>
          }
        </div>
      </main>
    )

  }
}