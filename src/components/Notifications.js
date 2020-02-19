import React, { setGlobal } from 'reactn';
import StickyNav from './StickyNav';
import ReactQuill from 'react-quill';
import Table from 'react-bootstrap/Table'
import Card from 'react-bootstrap/Card'
import Modal from 'react-bootstrap/Modal'
import LoadingModal from './LoadingModal';
import 'react-quill/dist/quill.snow.css';
import uuid from 'uuid/v4'
import { putInOrganizationDataTable, getFromOrganizationDataTable } from '../utils/awsUtils';
import { setLocalStorage } from '../utils/misc';

export default class Notifications extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      message: "", 
      notificationName: "", 
      preview: false, 
      selectedSegment: "Choose...", 
      editNotification: false, 
      isActive: false, 
      show: false, 
      notificationToDelete: {}
    }
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

  makeActive = async (not) => {
    const { sessionData, SESSION_FROM_LOCAL, org_id, apps } = this.global;
    const { notifications } = sessionData;
    let allNotifications = notifications;
    let thisNotification = allNotifications.filter(a => a === not)[0];
    thisNotification.active = true;
    sessionData.notifications = allNotifications;
    const thisApp = apps[sessionData.id]
    thisApp.notifications = allNotifications;

    setGlobal({ sessionData, apps })
    //Now we update the DB
        // Put the new segment in the analytics data for the user signed in to this
    // id:
    //      Each App (SimpleID Customer) will have an app_id
    //      Each App can have multiple Customer Users (e.g. Cody at Lens and one of his Minions)
    //      A segment will be stored in the DB under the primary key 'app_id' in
    //      the appropriate user_id's segment storage:
    //
    //
    // TODO: probably want to wait on this to finish and throw a status/activity
    //       bar in the app:
    const orgData = await getFromOrganizationDataTable(org_id);

    try {
      const anObject = orgData.Item
      anObject.apps = apps;
      anObject[process.env.REACT_APP_ORG_TABLE_PK] = org_id
      await putInOrganizationDataTable(anObject)
      setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData));
      this.setState({ selectedSegment: "Choose...", message: "", notificationName: ""})
    } catch (suppressedError) {
      console.log(`ERROR: problem writing to DB.\n${suppressedError}`)
    }
  }

  makeInactive = async (not) => {
    const { sessionData, SESSION_FROM_LOCAL, org_id, apps } = this.global;
    const { notifications } = sessionData;
    let allNotifications = notifications;
    let thisNotification = allNotifications.filter(a => a === not)[0];
    thisNotification.active = false;
    sessionData.notifications = allNotifications;
    const thisApp = apps[sessionData.id]
    thisApp.notifications = allNotifications;

    setGlobal({ sessionData, apps });

    //Now we update the DB
        // Put the new segment in the analytics data for the user signed in to this
    // id:
    //      Each App (SimpleID Customer) will have an app_id
    //      Each App can have multiple Customer Users (e.g. Cody at Lens and one of his Minions)
    //      A segment will be stored in the DB under the primary key 'app_id' in
    //      the appropriate user_id's segment storage:
    //
    //
    // TODO: probably want to wait on this to finish and throw a status/activity
    //       bar in the app:
    const orgData = await getFromOrganizationDataTable(org_id);

    try {
      const anObject = orgData.Item
      anObject.apps = apps;
      anObject[process.env.REACT_APP_ORG_TABLE_PK] = org_id
      await putInOrganizationDataTable(anObject)
      setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData));
      this.setState({ selectedSegment: "Choose...", message: "", notificationName: ""})
    } catch (suppressedError) {
      console.log(`ERROR: problem writing to DB.\n${suppressedError}`)
    }
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
    const { notificationName, message, selectedSegment } = this.state;
    const newNotification = {
      id: uuid(), 
      name: notificationName, 
      content: message, 
      segmentId: selectedSegment, 
      active: false
    } 
    noti.push(newNotification);
    sessionData.notifications = noti;
    const thisApp = apps[sessionData.id];
    thisApp.notifications = noti;
    setGlobal({ sessionData, apps });

    //Now we update the DB
        // Put the new segment in the analytics data for the user signed in to this
    // id:
    //      Each App (SimpleID Customer) will have an app_id
    //      Each App can have multiple Customer Users (e.g. Cody at Lens and one of his Minions)
    //      A segment will be stored in the DB under the primary key 'app_id' in
    //      the appropriate user_id's segment storage:
    //
    //
    // TODO: probably want to wait on this to finish and throw a status/activity
    //       bar in the app:
    const orgData = await getFromOrganizationDataTable(org_id);

    try {
      const anObject = orgData.Item
      anObject.apps = apps;
      anObject[process.env.REACT_APP_ORG_TABLE_PK] = org_id
      await putInOrganizationDataTable(anObject)
      setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData));
      this.setState({ selectedSegment: "Choose...", message: "", notificationName: ""})
    } catch (suppressedError) {
      console.log(`ERROR: problem writing to DB.\n${suppressedError}`)
    }
  }

  updateNotification = async () => {
    const { sessionData, SESSION_FROM_LOCAL, org_id, apps } = this.global
    let { notifications } = sessionData
    const { notificationName, message, selectedSegment, notificationId, isActive } = this.state 
    this.setState({ editNotification: false })
    setGlobal({ processing: true })
    //First set the updated notification
    const updatedNotification = {
      id: notificationId, 
      name: notificationName, 
      content: message, 
      segmentId: selectedSegment, 
      active: isActive
    }

    //Find index
    const index = notifications.map(a => a.id).indexOf(notificationId);
    if(index > -1) {
      notifications[index] = updatedNotification
      sessionData.notifications = notifications
      const thisApp = apps[sessionData.id]
      thisApp.notifications = notifications
      setGlobal({ sessionData, apps })

      //Now we update the DB
          // Put the new segment in the analytics data for the user signed in to this
      // id:
      //      Each App (SimpleID Customer) will have an app_id
      //      Each App can have multiple Customer Users (e.g. Cody at Lens and one of his Minions)
      //      A segment will be stored in the DB under the primary key 'app_id' in
      //      the appropriate user_id's segment storage:
      //
      //
      // TODO: probably want to wait on this to finish and throw a status/activity
      //       bar in the app:
      const orgData = await getFromOrganizationDataTable(org_id);

      try {
        const anObject = orgData.Item
        anObject.apps = apps;
        anObject[process.env.REACT_APP_ORG_TABLE_PK] = org_id
        await putInOrganizationDataTable(anObject)
        setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData));
        this.setState({ selectedSegment: "Choose...", message: "", notificationName: ""})
        setGlobal({ processing: false})
      } catch (suppressedError) {
        console.log(`ERROR: problem writing to DB.\n${suppressedError}`)
      }
    } else {
      console.log("Error with index on notification")
    }
  }

  handleNotificationEdits = (notification) => {
    this.setState({
      notificationId: notification.id,
      message: notification.content, 
      selectedSegment: notification.segmentId, 
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
      selectedSegment: "Choose...", 
      editNotification: false
    })
  }

  handleNotificationDelete = (notification) => {
    this.setState({ notificationToDelete: notification, show: true })
  }

  confirmDelete = async () => {
    const { notificationToDelete } = this.state
    let { sessionData, apps, org_id, SESSION_FROM_LOCAL } = this.global
    let { notifications } = sessionData
    const index = notifications.map(a => a.id).indexOf(notificationToDelete.id);
    if(index > -1) {
      notifications.splice(index, 1);
      sessionData.notifications = notifications;
      //Update in DB
      const thisApp = apps[sessionData.id];
      thisApp.notifications = notifications;
      setGlobal({ sessionData, apps, processing: true });
      this.setState({ show: false });
      const orgData = await getFromOrganizationDataTable(org_id);

      try {
        const anObject = orgData.Item
        anObject.apps = apps;
        anObject[process.env.REACT_APP_ORG_TABLE_PK] = org_id
        await putInOrganizationDataTable(anObject)
        setGlobal({ processing: false })
      } catch (suppressedError) {
        console.log(`ERROR: problem writing to DB.\n${suppressedError}`)
        setGlobal({ processing: false })
      }

      setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData));
    } else {
      console.log("Error with index");
    }
  }

  renderNotificationEditOrCreate() {
    const { sessionData } = this.global;
    const { currentSegments } = sessionData;
    const { message, notificationName, selectedSegment, editNotification } = this.state;
    const segments = currentSegments ? currentSegments : []
    return (
      <div id="notification-builder">
        <h5>Create a Notification</h5>
        <div className="form-group col-md-12">
          <label htmlFor="inputSeg">First, Choose a Segment</label>
          <select value={selectedSegment} onChange={(e) => this.setState({ selectedSegment: e.target.value })} id="inputSeg" className="form-control">
            <option value="Choose...">Choose...</option>
            {
              segments.map(seg => {
                return (
                <option value={seg.id} key={seg.id}>{seg.name}</option>
                )
              })
            }
          </select>
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
          <input type="text" value={notificationName} onChange={this.handleNameChange} className="form-control" id="tileName" placeholder="Give it a name" />                           
        </div>
        <div className="form-group col-md-12">
          <label htmlFor="inputSeg">Finally, Save the Notification</label><br/>
          <span className="text-muted">Notification will be inactive until you activate it.</span><br/><br/>
          {message ? <button onClick={editNotification ? this.updateNotification : this.saveNotification} className="btn btn-primary">Save Notification</button> : <button className="btn btn-secondary">Save Notification</button>}{message ? <button onClick={this.previewMessage} className="btn preview btn-secondary">Preview Notification</button> : <div/>}           
        </div>
      </div>
    )
  }
  
  render() {
    const { sessionData, processing } = this.global;
    const { notifications, currentSegments } = sessionData;
    const { preview, editNotification, notificationName, show, notificationToDelete} = this.state;
    const noti = notifications ? notifications : [];
    const inactiveNotifications = noti.filter(a => a.active === false);
    const activeNotifications = noti.filter(a => a.active === true);

    return(
      <main className="main-content col-lg-10 col-md-9 col-sm-12 p-0 offset-lg-2 offset-md-3">
        <StickyNav />
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
            <div className="col-12 col-sm-4 text-center text-sm-left mb-0">
              <span className="text-uppercase page-subtitle">Notifications</span>
              <h3 className="page-title">Keep People Up To Date</h3>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
              <h5>Active Notifications</h5>
              {
                activeNotifications.length > 0 ?
                <Card>
                  <Card.Body>
                    <Table responsive>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Segment</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {
                          activeNotifications.map(not => {
                            return (
                            <tr key={not.id}>
                              <td onClick={() => this.handleNotificationEdits(not)} className="clickable link-color">{not.name}</td>
                              <td>{currentSegments.filter(a => a.id === not.segmentId)[0] ? currentSegments.filter(a => a.id === not.segmentId)[0].name : ""}</td>
                              <td className="clickable text-danger" onClick={() => this.makeInactive(not)}>Deactivate</td>
                            </tr>
                            )
                          })
                        }                    
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card> :
                 
                <ul className="tile-list">
                  <li className="card"><span className="card-body">You haven't activated any in-app notifications yet. Once you have a notification created, you can activate it below.</span></li>
                </ul>
              }
              <div style={{marginTop: "20px"}}>
                <h5>Inactive Notifications</h5>
                {
                  inactiveNotifications.length > 0 ? 
                  <Card>
                  <Card.Body>
                    <Table responsive>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Segment</th>
                          <th></th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                      {
                        inactiveNotifications.map(nt => {
                          return(
                          <tr key={nt.id}>
                            <td>{nt.name}</td>
                            <td>{currentSegments.filter(a => a.id === nt.segmentId)[0] ? currentSegments.filter(a => a.id === nt.segmentId)[0].name : ""}</td>
                            <td className="clickable text-success" onClick={() => this.makeActive(nt)}>Activate</td>
                            <td onClick={() => this.handleNotificationDelete(nt)} className="clickable text-danger">Delete</td>
                          </tr>
                          )
                        })
                      }
                    </tbody>
                    </Table>
                  </Card.Body>
                </Card> :
                <ul className="tile-list">
                  <li className="card"><span className="card-body">No inactive notifications.</span></li>
                </ul>
                }
              </div>
            </div>
            <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
            {this.renderNotificationEditOrCreate()}
            </div>

            <Modal className="custom-modal" show={editNotification} onHide={this.handleCloseNotificationEdit}>
              <Modal.Header closeButton>
                <Modal.Title>{notificationName}</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {this.renderNotificationEditOrCreate()}
              </Modal.Body>
              <Modal.Footer>
                <button className="btn btn-secondary" onClick={this.handleCloseNotificationEdit}>
                  Close
                </button>                  
              </Modal.Footer>
            </Modal>

            <Modal className="custom-modal" show={processing} >
              <Modal.Body>
                <LoadingModal messageToDisplay={"Saving Notification..."} />
              </Modal.Body>
            </Modal>

            <Modal className="custom-modal" show={show} onHide={() => this.setState({ show: false })}>
              <Modal.Header closeButton>
                <Modal.Title>Are you sure?</Modal.Title>
              </Modal.Header>
              <Modal.Body>You're about to delete the segment <strong><u>{notificationToDelete.name}</u></strong>. Are you sure you want to do this? It can't be undone.</Modal.Body>
              <Modal.Footer>
                <button className="btn btn-secondary" onClick={() => this.setState({ show: false })}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={this.confirmDelete}>
                  Delete
                </button>
              </Modal.Footer>
            </Modal>
          </div>
        </div>
      </main>
    )
  }
}