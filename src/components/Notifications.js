import React, { setGlobal } from 'reactn';
import StickyNav from './StickyNav';
import ReactQuill from 'react-quill';
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
      selectedSegment: "Choose..."
    }
  }

  handleChange = (value) => {
    this.setState({ message: value });
  }

  handleNameChange = (e) => {
    this.setState({ notificationName: e.target.value });
  }

  previewMessage = () => {
    this.setState({ preview: true });
  }

  makeActive = async (not) => {
    const { sessionData, SESSION_FROM_LOCAL, org_id, apps } = this.global;
    const { notifications } = sessionData;
    let allNotifications = notifications;
    let thisNotification = allNotifications.filter(a => a === not)[0];
    thisNotification.active = true;
    sessionData.notifications = allNotifications;
    const thisApp = apps.filter(a => a.id === sessionData.id)[0];
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
      anObject[process.env.REACT_APP_OD_TABLE_PK] = org_id
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
    const thisApp = apps.filter(a => a.id === sessionData.id)[0];
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
      anObject[process.env.REACT_APP_OD_TABLE_PK] = org_id
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
    const thisApp = apps.filter(a => a.id === sessionData.id)[0];
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
      anObject[process.env.REACT_APP_OD_TABLE_PK] = org_id
      await putInOrganizationDataTable(anObject)
      setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData));
      this.setState({ selectedSegment: "Choose...", message: "", notificationName: ""})
    } catch (suppressedError) {
      console.log(`ERROR: problem writing to DB.\n${suppressedError}`)
    }
  }
  
  render() {
    const { sessionData } = this.global;
    const { notifications, currentSegments } = sessionData;
    const { message, preview, notificationName, selectedSegment } = this.state;
    const noti = notifications ? notifications : [];
    const inactiveNotifications = noti.filter(a => a.active === false);
    const activeNotifications = noti.filter(a => a.active === true);
    const segments = currentSegments ? currentSegments : [];
    console.log(notifications);
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
                <ul className="tile-list">
                {
                  activeNotifications.map(not => {
                    return (
                    <li className="clickable card text-center" key={not.id}><span className="card-body standard-tile seg-title">{not.name}</span><span className="seg-name"><strong>Segment:</strong> {currentSegments.filter(a => a.id === not.segmentId)[0] ? currentSegments.filter(a => a.id === not.segmentId)[0].name : ""}</span><span onClick={() => this.makeInactive(not)} className="right clickable text-danger">Make Inactive</span></li>
                    )
                  })
                }
                </ul> : 
                <ul className="tile-list">
                  <li className="card"><span className="card-body">You haven't activated any in-app notifications yet. Once you have a notification created, you can activate it below.</span></li>
                </ul>
              }
              <div>
                <h5>Inactive Notifications</h5>
                {
                  inactiveNotifications.length > 0 ? 
                  <ul className="tile-list">
                {
                  inactiveNotifications.map(nt => {
                    return (
                  <li className="clickable card text-center" key={nt.id}><span className="card-body standard-tile seg-title">{nt.name}</span><span className="seg-name"><strong>Segment:</strong> {currentSegments.filter(a => a.id === nt.segmentId)[0].name}</span><span onClick={() => this.makeActive(nt)} className="right clickable green">Make Active</span></li>
                    )
                  })
                }
                </ul> : 
                <ul className="tile-list">
                  <li className="card"><span className="card-body">No inactive notifications.</span></li>
                </ul>
                }
              </div>
            </div>
            <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
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
              <div class="form-group col-md-12">
                <label htmlFor="inputSeg">Next, Write Your Message</label>
                <ReactQuill 
                  value={message}
                  onChange={this.handleChange} 
                />             
              </div>
              <div class="form-group col-md-12">
                <label htmlFor="inputSeg">Now, Give Your Notification A Name</label> 
                <input type="text" value={notificationName} onChange={this.handleNameChange} class="form-control" id="tileName" placeholder="Give it a name" />                           
              </div>
              <div class="form-group col-md-12">
                <label htmlFor="inputSeg">Finally, Save the Notification</label><br/>
                <span className="text-muted">Notification will be inactive until you activate it.</span><br/><br/>
                {message ? <button onClick={this.saveNotification} className="btn btn-primary">Save Notification</button> : <button className="btn btn-secondary">Save Notification</button>}{message ? <button onClick={this.previewMessage} className="btn preview btn-secondary">Preview Notification</button> : <div/>}           
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }
}