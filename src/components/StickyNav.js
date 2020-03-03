import React, {setGlobal} from 'reactn';
import { Link } from 'react-router-dom';
import { getCloudUser } from './../utils/cloudUser.js'

export default class StickyNav extends React.Component {
  render() {
    const { apps, sessionData, org_id, threeBoxProfile, showSegmentNotification, segmentProcessingDone, segmentName } = this.global;
    const orgId = org_id ? `${org_id.substring(0,8)}...` : ""
    const headerName = threeBoxProfile && threeBoxProfile.name ? threeBoxProfile.name : orgId

    const appKeys = Object.keys(apps);
    let projects = [];
    for(const appKey of appKeys) {
      const thisApp = apps[appKey]
      thisApp.id = appKey
      projects.push(thisApp)
    }
    return(
      <div className="main-navbar sticky-top bg-white">
        <nav className="navbar align-items-stretch navbar-light flex-md-nowrap p-0">
          <form action="#" className="main-navbar__search w-100 d-none d-md-flex d-lg-flex">
            <div className="input-group input-group-seamless ml-3">
              <div className="input-group-prepend">
                <div className="input-group-text">

                </div>
              </div>
            </div>
          </form>
          <ul className="navbar-nav border-left flex-row ">
            {
              showSegmentNotification && segmentProcessingDone ? 
              <li className="nav-item border-right dropdown notifications">
                <button className="a-el-fix nav-link nav-link-icon text-center" id="dropdownMenuLink" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                  <div className="nav-link-icon__wrapper">
                    <i className="material-icons">&#xE7F4;</i>
                    <span className="badge badge-pill badge-danger">1</span>
                  </div>
                </button>
                <div className="dropdown-menu dropdown-menu-small" aria-labelledby="dropdownMenuLink">
                  <button className="a-el-fix dropdown-item">
                    <div className="notification__icon-wrapper">
                      <div className="notification__icon">
                        <i className="material-icons">&#xE6E1;</i>
                      </div>
                    </div>
                    <div className="notification__content">
                      <span className="notification__category">Segmentation Updates</span>
                      <p>Your segment titled <span className="text-underline">{segmentName}</span> is done processing. See it <Link onClick={() => setGlobal({ showSegmentNotification: false, segmentProcessingDone: false })} to={'/segments'}>here.</Link></p>                        
                    </div>
                  </button>                  
                </div>
              </li> : 
              <li style={{dispay: "none"}} />
            }
            {
              projects.length > 0 ?
              <li className="nav-item dropdown border-right">
                <button className="a-el-fix project-drop nav-link dropdown-toggle text-nowrap px-3" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                  <span className="d-md-inline-block">Current Project: {sessionData.project_name}</span>
                </button>
                <div className="dropdown-menu dropdown-menu-small">
                  {
                    Object.keys(apps).length > 1 ?
                    <div>
                      {
                        apps.map(app => {
                        return (
                          <button className="a-el-fix dropdown-item">
                            <i className="material-icons">web</i> {app.projectName}
                          </button>
                        )
                        })
                      }
                      <div className="dropdown-divider"></div>
                      <Link to='/projects'><button className="a-el-fix dropdown-item">
                        <i className="material-icons">web</i> Add or View Projects</button></Link>
                      </div> :
                    <div>
                    <Link to='/projects'><button className="a-el-fix dropdown-item">
                      <i className="material-icons">web</i> Add or View Projects</button></Link>
                    </div>
                  }

                </div>
              </li> :
              <li className="nav-item dropdown border-right">
                <Link to='/projects'><button className="a-el-fix project-drop nav-link text-nowrap px-3" aria-haspopup="true" aria-expanded="false">
                  <span className="d-md-inline-block">Create a Project</span>
                </button></Link>
              </li>
            }

            <li className="nav-item dropdown">
              <button className="a-el-fix project-drop nav-link dropdown-toggle text-nowrap px-3" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <span className="d-none d-md-inline-block">{headerName}</span>
              </button>
              <div className="dropdown-menu dropdown-menu-small">
                <Link to="/account"><button className="a-el-fix dropdown-item">
                  <i className="material-icons">&#xE7FD;</i> Account</button></Link>

                  <a href="mailto:support@simpleid.xyz"><button className="a-el-fix dropdown-item"><i className="material-icons">help</i>Help</button></a>
                <div className="dropdown-divider"></div>
                <button onClick={() => getCloudUser().signOut()} className="a-el-fix dropdown-item text-danger">
                  <i className="material-icons text-danger">&#xE879;</i> Logout </button>
              </div>
            </li>
          </ul>

        </nav>
      </div>
    )
  }
}
