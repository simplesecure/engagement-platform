import React, { setGlobal } from 'reactn';
import StickyNav from './StickyNav';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default class Notifications extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      message: "", 
      notificationName: "", 
      preview: false
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

  makeActive = (not) => {
    const { notifications } = this.global;
    let allNotifications = notifications;
    let thisNotification = allNotifications.filter(a => a === not)[0];
    thisNotification.active = true;
    setGlobal({ notifications: allNotifications });
  }

  makeInactive = (not) => {
    const { notifications } = this.global;
    let allNotifications = notifications;
    let thisNotification = allNotifications.filter(a => a === not)[0];
    thisNotification.active = false;
    setGlobal({ notifications: allNotifications });
  }

  createMarkup = () => {
    const { message } = this.state;
    return {
      __html: message
    };
  }

  saveNotification = () => {
    const { notifications } = this.global;
    const { notificationName, message } = this.state;
    const newNotification = {
      id: "1236", 
      name: notificationName, 
      content: message, 
      segmentId: "1234", 
      active: false
    } 
    notifications.push(newNotification);
    setGlobal({ notifications });
  }
  
  render() {
    const { notifications, currentSegments } = this.global;
    const { message, preview, notificationName } = this.state;
    const inactiveNotifications = notifications.filter(a => a.active === false);
    const activeNotifications = notifications.filter(a => a.active === true);
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
                    <li className="clickable card text-center" key={not.id}><span className="card-body standard-tile seg-title">{not.name}</span><span className="seg-name"><strong>Segment:</strong> {currentSegments.filter(a => a.id === not.segmentId)[0].name}</span><span onClick={() => this.makeInactive(not)} className="right clickable text-danger">Make Inactive</span></li>
                    )
                  })
                }
                </ul> : 
                <ul className="tile-list">
                  <li className="card"><span className="card-body">You haven't created any in-app notifications yet, let's do that now!</span></li>
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
                <select id="inputSeg" className="form-control">
                  <option selected>Choose...</option>
                  {
                    currentSegments.map(seg => {
                      return (
                      <option key={seg.id}>{seg.name}</option>
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