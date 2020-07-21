import React, { setGlobal } from 'reactn'
import { Link } from 'react-router-dom'
import {
  Header,
  Icon,
  Segment,
  Label
} from 'semantic-ui-react'
import { getCloudServices } from "./../utils/cloudUser.js";

export default class SideNav extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      pathname: '/'
    }
  }

  componentDidMount() {
    const pathname = window.location.pathname
    this.setState({ pathname })
  }

  handleNotificationClick () {
    const {
      apps,
      notifications,
    } = this.global
    const notificationsProcessed = notifications.filter(
      notification => notification.processingDone === true
    )
    notificationsProcessed.forEach(notification => {
      const updatedNotifications = notifications.filter(n => n.id !== notification.id)
      if(updatedNotifications.length < 1) {
        setGlobal({ showSegmentNotification: false, segmentProcessingDone: false })
      }
      setGlobal({ notifications: updatedNotifications })
      setGlobal({
        sessionData: apps[notification.appId],
        currentAppId: notification.appId
      })
      getCloudServices().fetchUsersCount()
    })
    this.setState({ pathname: '/console' })
  }

  render() {
    const {
      currentAppId,
      notifications,
      showSegmentNotification,
      segmentProcessingDone
    } = this.global
    const notificationsProcessed = notifications.filter(
      notification => notification.processingDone === true
    )
    const { pathname } = this.state
    return(
      <aside className="main-sidebar col-12 col-md-3 col-lg-2 px-0">
        <div className="main-navbar">
          <nav className="navbar align-items-stretch navbar-light bg-white flex-md-nowrap border-bottom p-0">
            <Link className="navbar-brand w-150 mr-0" to="#" style={{lineHeight: "25px"}}>
              <div className="d-table m-auto">
                <img id="main-logo" className="d-inline-block align-top mr-1" style={{maxWidth: "25px"}} src={require('../assets/img/logo.png')} alt="SimpleID Dashboard" /> <br/>
              </div>
            </Link>
            <button className="a-el-fix toggle-sidebar d-sm-inline d-md-none d-lg-none">
              <i className="material-icons">&#xE5C4</i>
            </button>
          </nav>
        </div>
        <div className="nav-wrapper">
          <ul className="nav flex-column">
            <li className="nav-item Dashboard">
              <Link onClick={() => this.setState({ pathname: '/' })} className={`nav-link ${pathname ==='/' && currentAppId !== undefined ? "active" : ""}`} to="/">
                <Segment basic>
                  <Header as='h3'>
                    <Icon name='dashboard' />
                    <Header.Content>
                      Dashboard
                    </Header.Content>
                  </Header>
                </Segment>
              </Link>
            </li>
            <li className="nav-item Console">
            <Link onClick={() => this.handleNotificationClick()} className={`nav-link ${pathname.includes('/console') && currentAppId !== undefined ? "active" : ""}`} to="/console">
              <Segment basic>
                <Header as='h3'>
                  <Icon name='computer' />
                  <Header.Content>
                    Console
                  </Header.Content>
                  {showSegmentNotification && segmentProcessingDone && notificationsProcessed.length > 0 ? (
                    <Label size="small" attached="top right" color='red'>{notificationsProcessed.length}</Label>
                  ) : (null)}
                </Header>
              </Segment>
            </Link>
            </li>
            <li className="nav-item Segments">
              <Link onClick={() => this.setState({ pathname: '/segments' })} className={`nav-link ${pathname.includes('/segments') && currentAppId !== undefined ? "active" : ""}`} to="/segments">
                <Segment basic>
                  <Header as='h3'>
                    <Icon name='cubes' />
                    <Header.Content>
                      Segments
                    </Header.Content>
                  </Header>
                </Segment>
              </Link>
            </li>
            <li className="nav-item Notifications">
              <Link onClick={() => this.setState({ pathname: '/notifications' })} className={`nav-link ${pathname.includes('/notifications') && currentAppId !== undefined ? "active" : ""}`} to="/notifications">
                <Segment basic>
                  <Header as='h3'>
                    <Icon name='bell' />
                    <Header.Content>
                      Notifications
                    </Header.Content>
                  </Header>
                </Segment>
              </Link>
            </li>
            <li className="nav-item Email">
              <Link onClick={() => this.setState({ pathname: '/communications' })} className={`nav-link ${pathname.includes('/communications') && currentAppId !== undefined ? "active" : ""}`} to="/communications">
                <Segment basic>
                  <Header as='h3'>
                    <Icon name='mail' />
                    <Header.Content>
                      Email
                    </Header.Content>
                  </Header>
                </Segment>
              </Link>
            </li>
            {/*<li className="nav-item Projects">
              <Link onClick={() => this.setState({ pathname: '/projects' })} className={`nav-link ${pathname.includes('/projects') && currentAppId !== undefined ? "active" : ""}`} to="/projects">
                <Segment basic>
                  <Header as='h3'>
                    <Icon name='folder' />
                    <Header.Content>
                      Projects
                    </Header.Content>
                  </Header>
                </Segment>
              </Link>
            </li>*/}
            <li className="nav-item Account">
              <Link onClick={() => this.setState({ pathname: '/account' })} className={`nav-link ${pathname.includes('/account') && currentAppId !== undefined ? "active" : ""}`} to="/account">
                <Segment basic>
                  <Header as='h3'>
                    <Icon name='settings' />
                    <Header.Content>
                      Account
                    </Header.Content>
                  </Header>
                </Segment>
              </Link>
            </li>
          </ul>
        </div>
      </aside>
    )
  }
}
