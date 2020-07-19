import React, { setGlobal } from 'reactn';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import uuid from 'uuid/v4'
import * as dc from './../utils/dynamoConveniences.js'
import { setLocalStorage } from '../utils/misc';
import {
  Button,
  Dropdown,
  Icon,
  Input,
  Segment,
  Grid,
  Header,
  Message,
  Dimmer,
  Loader
} from 'semantic-ui-react'
import { Dialog } from 'evergreen-ui'
import SideNav from '../components/SideNav'
import ProcessingBlock from './ProcessingBlock'
import { runClientOperation } from '../utils/dataProcessing.js';

export default class Notifications extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      message: "",
      notificationName: "",
      preview: false,
      selected_segment: 'Select a segment...',
      editNotification: false,
      isActive: false,
      show: false,
      notificationToDelete: {}
    }
    this.localBlockId = 0
    this.blockLabel = null
  }

  handleChange = (value) => {
    this.setState({ message: value })
  }

  handleNameChange = (e) => {
    this.setState({ notificationName: e.target.value })
  }

  previewMessage = () => {
    this.setState({ preview: true })
  }

  setNotificationActive = async (notification, activeState) => {
    const { sessionData, SESSION_FROM_LOCAL, org_id, apps } = this.global;
    const { notifications } = sessionData;
    let allNotifications = notifications;
    let thisNotification = allNotifications.filter(a => a === notification)[0];

    try {
      const operationData = {
        notificationId: thisNotification.id,
        activeState
      }
      await runClientOperation('setNotificationActive', undefined, sessionData.id, operationData)
    } catch (error) {
      throw new Error(`Notifications::setNotificationActive: failed to set notification active=${activeState}` +
                      `(id=${(thisNotification) ? thisNotification.id : 'unknown'}).\n` +
                      `Please refresh the page and try again. If that fails contact support@simpleid.xyz.\n` +
                      `${error}`)
    }

    thisNotification.active = activeState;
    sessionData.notifications = allNotifications;
    const thisApp = apps[sessionData.id]
    thisApp.notifications = allNotifications;

    setGlobal({ sessionData, apps })

    // setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData));
    this.setState({ selected_segment: "Select a segment...", message: "", notificationName: ""})
  }

  createMarkup = () => {
    const { message } = this.state;
    return {
      __html: message
    };
  }

  saveNotification = async () => {
    const { sessionData, SESSION_FROM_LOCAL, org_id, apps } = this.global;
    const { notifications } = sessionData;
    const noti = notifications ? notifications : [];
    const { notificationName, message, selected_segment } = this.state;
    const newNotification = {
      id: uuid(),
      name: notificationName,
      content: message,
      segmentId: selected_segment,
      active: false
    }

    try {
      const operationData = { notificationObj: newNotification }
      await runClientOperation('addNotification', undefined, sessionData.id, operationData)
    } catch (error) {
      throw new Error(`Notifications::saveNotification: failed to save new notification ` +
                      `(name=${newNotification.name}).\n` +
                      `Please refresh the page and try again. If that fails contact support@simpleid.xyz.\n` +
                      `${error}`)
    }

    noti.push(newNotification);
    sessionData.notifications = noti;
    const thisApp = apps[sessionData.id];
    thisApp.notifications = noti;
    setGlobal({ sessionData, apps });

    // setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData));
    this.setState({ selected_segment: "Select a segment...", message: "", notificationName: ""})
  }

  updateNotification = async () => {
    const method = 'Notifications::updateNotification'

    const { sessionData, SESSION_FROM_LOCAL, org_id, apps } = this.global
    let { notifications } = sessionData
    const { notificationName, message, selected_segment, notificationId, isActive } = this.state
    this.setState({ editNotification: false })
    setGlobal({ processing: true })

    //First set the updated notification
    const updatedNotification = {
      id: notificationId,
      name: notificationName,
      content: message,
      segmentId: selected_segment,
      active: isActive
    }

    //Find index
    const index = notifications.map(a => a.id).indexOf(notificationId);
    if(index <= -1) {
      throw new Error(`${method}: could not find notification to update in data model (id=${notificationId}).\n` +
                      `Please refresh the page and try again. If that fails contact support@simpleid.xyz.\n`)
    }

    try {
      const operationData = { notificationObj: updatedNotification }
      await runClientOperation('updateNotification', undefined, sessionData.id, operationData)
    } catch (error) {
      throw new Error(`${method}: failed to update notification (id=${notificationId}).\n` +
                      `Please refresh the page and try again. If that fails contact support@simpleid.xyz.\n` +
                      `${error}`)
    }

    notifications[index] = updatedNotification
    sessionData.notifications = notifications
    const thisApp = apps[sessionData.id]
    thisApp.notifications = notifications
    setGlobal({ sessionData, apps })

    // setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData));
    this.setState({ selected_segment: "Choose...", message: "", notificationName: ""})
    setGlobal({ processing: false})
  }

  handleNotificationEdits = (notification) => {
    this.setState({
      notificationId: notification.id,
      message: notification.content,
      selected_segment: notification.segmentId,
      notificationName: notification.name,
      editNotification: true,
      isActive: notification.active
    })
  }

  handleCloseNotificationEdit = () => {
    this.setState({
      message: "",
      notificationName: "",
      preview: false,
      selected_segment: "Select a segment...",
      editNotification: false
    })
  }

  handleNotificationDelete = (notification) => {
    this.setState({ notificationToDelete: notification, show: true })
  }

  confirmDelete = async () => {
    const method = 'Notifications::confirmDelete'

    const { notificationToDelete } = this.state
    let { sessionData, apps, org_id, SESSION_FROM_LOCAL } = this.global
    let { notifications } = sessionData
    const index = notifications.map(a => a.id).indexOf(notificationToDelete.id);
    if(index <= -1) {
      throw new Error(`${method}: could not find notification to update in data model.\n` +
                      `Please refresh the page and try again. If that fails contact support@simpleid.xyz.\n`)
    }

    setGlobal({ processing: true })
    try {
      const operationData = { notificationId: notificationToDelete.id}
      await runClientOperation('deleteNotification', undefined, sessionData.id, operationData)
    } catch (error) {
      throw new Error(`${method}: failed to delete notification (id=${notificationToDelete.id}).\n` +
                      `Please refresh the page and try again. If that fails contact support@simpleid.xyz.\n` +
                      `${error}`)
    }

    notifications.splice(index, 1);
    sessionData.notifications = notifications;

    const thisApp = apps[sessionData.id];
    thisApp.notifications = notifications;
    setGlobal({ sessionData, apps });
    this.setState({ show: false });
    setGlobal({ processing: false })
    // setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData));
  }

  renderNotificationEditOrCreate(currentSegments) {
    const { message, notificationName, selected_segment, editNotification } = this.state;
    let segments = currentSegments ? currentSegments : []
    segments.forEach(seg => {
      seg.key = seg.id
      seg.text = seg.name
      seg.value = seg.id
    })
    const disableButton = !message || message === '<p><br></p>' || !notificationName || selected_segment === 'Select a segment...'
    const buttonGroup = (
      <div>
        <Button
          onClick={(editNotification) ?
            this.updateNotification :
            this.saveNotification}
          primary
          disabled={disableButton}>
          Save Notification
        </Button>
        <Button
          onClick={this.previewMessage}
          secondary
          disabled={disableButton}>
          Preview Notification
        </Button>
      </div>
    )
    return (
      <div id="notification-builder">
        <h5>Create a Notification</h5>
        <div className="form-group col-md-12">
          <label htmlFor="inputSeg">First, Choose a Segment</label>
          <Dropdown
            placeholder='Select a segment...'
            value={selected_segment}
            onChange={(e, {value}) => this.setState({ selected_segment: value })}
            fluid selection
            options={segments}
          />
        </div>
        <div className="form-group col-md-12">
          <label htmlFor="inputSeg">Next, Write Your Message</label>
          <ReactQuill
            value={message}
            onChange={this.handleChange}
          />
        </div>
        <div className="form-group col-md-12">
          <label htmlFor="inputSeg">Now, Give Your Notification A Name</label>
          <Input placeholder="Give it a name" fluid icon>
            <input type="text" value={notificationName} onChange={this.handleNameChange}/>
            <Icon name='bullhorn' />
          </Input>
        </div>
        <div className="form-group col-md-12">
          <label htmlFor="inputSeg">Finally, Save the Notification</label><br/>
          <span className="text-muted">Notification will be inactive until you activate it.</span><br/><br/>
          {buttonGroup}
        </div>
      </div>
    )
  }

  render() {
    const { sessionData, processing } = this.global;
    const { notifications, currentSegments } = sessionData;
    const { preview, editNotification, show, notificationToDelete} = this.state;
    const noti = notifications ? notifications : [];
    const inactiveNotifications = noti.filter(a => a.active === false);
    const activeNotifications = noti.filter(a => a.active === true);
    return(
      <div>
        <SideNav />
        <main className="main-content col-lg-10 col-md-9 col-sm-12 p-0 offset-lg-2 offset-md-3">
          {
            preview ?
            <div className="message-banner">
              <span onClick={() => this.setState({ preview: false})} style={{position: "absolute", top: "10px", right: "8px", cursor: "pointer"}}>Close</span>
              <div dangerouslySetInnerHTML={this.createMarkup()} />
            </div> :
            <div />
          }
          <div className="main-content-container container-fluid px-4">
            <div className="page-header row no-gutters py-4">
              <div className="col-lg-6 col-md-6 col-sm-12 text-left text-sm-left mb-0">
                <span className="text-uppercase page-subtitle">Notifications</span>
                <h3 className="page-title">Keep People Up To Date</h3>
              </div>
              <div className="col-lg-6 col-md-6 col-sm-12 mb-4 text-right">
                <ProcessingBlock />
              </div>
            </div>
            <div className="row">
              <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
                <h5>Active Notifications</h5>
                {
                  activeNotifications.length > 0 ?
                      activeNotifications.map(not => {
                        return (
                          <Segment key={not.id} raised>
                            <Header as='h3' divided>
                              <Header.Content>{not.name}</Header.Content>
                              <Header.Subheader color='grey' style={{marginTop: 5}}>
                                 <p>{currentSegments.filter(a => a.id === not.segmentId)[0] ? currentSegments.filter(a => a.id === not.segmentId)[0].name : ""}</p>
                              </Header.Subheader>
                            </Header>
                            <Button.Group>
                              <Button onClick={() => this.handleNotificationEdits(not)} icon basic>
                                <Icon name='edit' size='large' color='blue' />
                                <p className='name'>Edit</p>
                              </Button>
                              <Button onClick={() => this.setNotificationActive(not, false)} icon basic>
                                <Icon color='red' name='ban' size='large' />
                                <p className='name'>Disable</p>
                              </Button>
                            </Button.Group>
                          </Segment>
                        )
                      })
                  :
                  <Message>
                    <p>
                      You haven't activated any in-app notifications yet. Once you have a notification created, you can activate it below.
                    </p>
                  </Message>
                }
                <div style={{marginTop: "20px"}}>
                  <h5>Inactive Notifications</h5>
                  {
                    inactiveNotifications.length > 0 ?
                      inactiveNotifications.map(not => {
                        return(
                          <Segment key={not.id} raised>
                            <Header as='h3' divided>
                              <Header.Content>{not.name}</Header.Content>
                              <Header.Subheader color='grey' style={{marginTop: 5}}>
                                 <p className='name'>{currentSegments.filter(a => a.id === not.segmentId)[0] ? currentSegments.filter(a => a.id === not.segmentId)[0].name : ""}</p>
                              </Header.Subheader>
                            </Header>
                            <Button.Group>
                              <Button onClick={() => this.setNotificationActive(not, true)} icon basic>
                                <Icon name='checkmark' size='large' color='green' />
                                <p className='name'>Enable</p>
                              </Button>
                              <Button onClick={() => this.handleNotificationDelete(not)} icon basic>
                                <Icon color='red' name='trash alternate outline' size='large' />
                                <p className='name'>Delete</p>
                              </Button>
                            </Button.Group>
                          </Segment>
                        )
                      })
                    :
                    <Message>
                      <p>
                        No inactive notifications.
                      </p>
                    </Message>
                  }
                </div>
              </div>
              <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
              {this.renderNotificationEditOrCreate(currentSegments)}
              </div>

              <Dialog
                isShown={editNotification}
                title="Edit Notification"
                onCancel={() => this.handleCloseNotificationEdit()}
                onCloseComplete={() => this.handleCloseNotificationEdit()}
                width={640}
                hasFooter={false}
              >
                {editNotification ? this.renderNotificationEditOrCreate(currentSegments) : null}
              </Dialog>

              <Dimmer active={processing}>
                <Loader inline='centered' indeterminate>{"Saving Notification..."}</Loader>
              </Dimmer>

              <Dialog
                isShown={show}
                title="Delete Notification?"
                onConfirm={() => this.confirmDelete()}
                onCancel={() => this.setState({ show: false })}
                onCloseComplete={() => this.setState({ show: false })}
                confirmLabel='Delete'
                intent="danger"
                width={640}
              >
                You're about to delete the notification <strong><u>{notificationToDelete.name}</u></strong>. Are you sure you want to do this? It can't be undone.
              </Dialog>
            </div>
          </div>
        </main>
      </div>
    )
  }
}
