import React, { setGlobal } from "reactn";
import { Link } from "react-router-dom";
import { getCloudUser } from "./../utils/cloudUser.js";
import { getEmailData } from './../utils/emailData.js';
import { getWeb2Analytics } from './../utils/web2Analytics';
const filter = require('../utils/filterOptions.json');

export default class StickyNav extends React.Component {

  startOnboarding = () => {
    setGlobal({ onboardingComplete: false })
  }

  setProject = async app => {
    const { apps } = this.global;

    await setGlobal({ sessionData: apps[app.id], currentAppId: app.id, allFilters: [] });    
    getCloudUser().fetchUsersCount();
    //  Fetch web2 analytics eventNames - we will fetch the actual event results in Segment handling
    const web2AnalyticsCmdObj = {
      command: 'getWeb2Analytics',
          data: {
           appId: app.id   
        }     
    }

    const web2Analytics = await getWeb2Analytics(web2AnalyticsCmdObj);
    const { allFilters } = await this.global;
    if(web2Analytics.data) {
      const events = web2Analytics.data;
      
      for(const event of events) {
        const data = {
          type: 'web2', 
          filter: `Web2: ${event}`
        }
        allFilters.push(data);
      }
      allFilters.push(...filter);
      setGlobal({ allFilters, web2Events: web2Analytics.data ? web2Analytics.data : [] });
    } else {
      console.log(allFilters);
      allFilters.push(...filter);
      console.log(filter);
      setGlobal({ allFilters })
    }

    const emailData = await getEmailData();

    setGlobal({ emailData: emailData.data });
  };

  handleNotificationClick = notification => {
    const { notifications, apps } = this.global;
   
    const updatedNotifications = notifications.filter(n => n.id !== notification.id);
    if(updatedNotifications.length < 1) {
      setGlobal({ showSegmentNotification: false, segmentProcessingDone: false });
    }

    setGlobal({ notifications: updatedNotifications });
    setGlobal({
      sessionData: apps[notification.appId],
      currentAppId: notification.appId
    });
    getCloudUser().fetchUsersCount();
  };

  render() {
    const {
      apps,
      sessionData,
      showSegmentNotification,
      segmentProcessingDone,
      notifications, 
    } = this.global;
    const notificationsProcessed = notifications.filter(
      notification => notification.processingDone === true
    );

    const appKeys = Object.keys(apps);
    let projects = [];
    if(appKeys.length > 0) {
      for (const appKey of appKeys) {
        const thisApp = apps[appKey];
        thisApp.id = appKey;
        projects.push(thisApp);
      }
    }
    
    return (
      <div className="main-navbar sticky-top bg-white">
        <nav className="navbar align-items-stretch navbar-light flex-md-nowrap p-0">
          <form
            action="#"
            className="main-navbar__search w-100 d-none d-md-flex d-lg-flex"
          >
            <div className="input-group input-group-seamless ml-3">
              <div className="input-group-prepend">
                <div className="input-group-text"></div>
              </div>
            </div>
          </form>
          <ul className="navbar-nav border-left flex-row ">
              <li className="nav-item border-right dropdown walkthrough">
                <button onClick={this.startOnboarding} className="a-el-fix nav-link nav-link-icon text-center">
                  <div className="nav-link-icon__wrapper">
                    <i className="material-icons text-warning">new_releases</i>
                  </div>
                </button>
              </li>
            {
              showSegmentNotification && segmentProcessingDone && notificationsProcessed.length > 0 ?
              (<li className="nav-item border-right dropdown notifications">
                <button                  
                  className="a-el-fix nav-link nav-link-icon text-center"
                  id="dropdownMenuLink"
                  data-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  <div className="nav-link-icon__wrapper">
                    <i className="material-icons">&#xE7F4;</i>
                    <span className="badge badge-pill badge-danger">
                      {notificationsProcessed.length}
                    </span>
                  </div>
                </button>
                <div
                  className="dropdown-menu dropdown-menu-small"
                  aria-labelledby="dropdownMenuLink"
                >
                  {
                    notificationsProcessed.map(notification => {
                    return (
                      <button
                        key={notification.id}
                        className="a-el-fix dropdown-item"
                      >
                        <div className="notification__icon-wrapper">
                          <div className="notification__icon">
                            <i className="material-icons">&#xE6E1;</i>
                          </div>
                        </div>

                        <div className="notification__content">
                          <span className="notification__category">
                            Segmentation Updates
                          </span>
                          <p>
                            Your segment update is done processing. See it{" "}
                            <Link
                              onClick={() =>
                                this.handleNotificationClick(notification)
                              }
                              to={"/segments"}
                            >
                              here.
                            </Link>
                          </p>
                        </div>
                      </button>
                    );
                  })
                  }
                </div>
              </li>
            ) : (
              <li style={{ dispay: "none" }} />
            )
            }       
            {projects.length > 0 ? (
              <li className="nav-item dropdown border-right">
                <button
                  className="a-el-fix project-drop nav-link dropdown-toggle text-nowrap px-3"
                  data-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  <span className="d-md-inline-block">
                    Current Project: {sessionData.project_name}
                  </span>
                </button>
                <div className="dropdown-menu dropdown-menu-small">
                  {Object.keys(apps).length > 1 ? (
                    <div>
                      {projects.map(app => {
                        return (
                          <button
                            key={app.id}
                            onClick={() => this.setProject(app)}
                            className="a-el-fix dropdown-item"
                          >
                            <i className="material-icons">web</i>{" "}
                            {app.project_name}
                          </button>
                        );
                      })}
                      <div className="dropdown-divider"></div>
                      <Link to="/projects">
                        <button className="a-el-fix dropdown-item">
                          <i className="material-icons">web</i> Add or View
                          Projects
                        </button>
                      </Link>
                    </div>
                  ) : (
                    <div>
                      <Link to="/projects">
                        <button className="a-el-fix dropdown-item">
                          <i className="material-icons">web</i> Add or View
                          Projects
                        </button>
                      </Link>
                    </div>
                  )}
                </div>
              </li>
            ) : (
              <li className="nav-item dropdown border-right">
                <Link to="/projects">
                  <button
                    className="a-el-fix project-drop nav-link text-nowrap px-3"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    <span className="d-md-inline-block">Create a Project</span>
                  </button>
                </Link>
              </li>
            )}

            <li className="nav-item dropdown">
              <button
                className="a-el-fix project-drop nav-link dropdown-toggle text-nowrap px-3"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                <span className="d-none d-md-inline-block">
                  <i className="material-icons">settings</i>
                </span>
              </button>
              <div className="dropdown-menu dropdown-menu-right dropdown-menu-small">
                <Link to="/account"><button className="a-el-fix dropdown-item">
                  <i className="material-icons">&#xE7FD;</i> Account</button></Link>

                <a href="mailto:support@simpleid.xyz">
                  <button className="a-el-fix dropdown-item">
                    <i className="material-icons">help</i>Help
                  </button>
                </a>
                <div className="dropdown-divider"></div>
                <button
                  onClick={() => getCloudUser().signOut()}
                  className="a-el-fix dropdown-item text-danger"
                >
                  <i className="material-icons text-danger">&#xE879;</i> Logout{" "}
                </button>
              </div>
            </li>
          </ul>
        </nav>
      </div>
    );
  }
}
