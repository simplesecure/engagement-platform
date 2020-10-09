import React, { setGlobal } from 'reactn'
import { BrowserRouter, Route } from 'react-router-dom'
import SignIn from '../components/SignIn'
import Dashboard from '../components/Dashboard'
import SideNav from '../components/SideNav'
import Notifications from '../components/Notifications'
import Communications from '../components/Communications/Communications'
import Segments from '../components/Segments'
import Projects from '../components/Projects'
import BlockDiagram from '../components/BlockDiagram'
import { Dimmer, Loader, Input } from 'semantic-ui-react'
import FlowyWorker from './FlowyWorker'
import { getCloudServices } from '../utils/cloudUser'
import { createProject } from "../utils/projectUtils"
import { Dialog } from 'evergreen-ui'
import ReactGA from 'react-ga'
const qs = require('query-string')
const SIMPLEID_USER_SESSION = 'SID_SVCS';

export default class Home extends React.Component {
  constructor (props) {
    super(props)
    this.flowy = new FlowyWorker()
    const { org } = qs.parse(window.location.search);
    this.org = org
    this.gaInitialized = false
  }
  async componentDidMount() {
    if (this.org) {
      await setGlobal({ publicDashboard: true })
      await getCloudServices().fetchOrgDataAndUpdate(this.org)
    }
    else {
      await setGlobal({ publicDashboard: false })
    }
  }
  renderSignIn = () => <SignIn />
  renderLoading = (message="Loading....") => (
    <Dimmer active>
      <Loader inline='centered' indeterminate>{message}</Loader>
    </Dimmer>
  )
  renderDisconnected = (message="Internet connection interrupted....") => (
    <Dimmer active>
      <Loader inline='centered' indeterminate>{message}</Loader>
    </Dimmer>
  )
  renderPublicDashboard = () => (
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  )
  renderNoProjectsView = () => (
    <BrowserRouter>
      <SideNav />
      <Projects />
    </BrowserRouter>
  )
  renderDisabledOrgId = (org) => (
    <Dialog
      isShown={true}
      title="Your subscription has been disabled"
      onConfirm={() => window.location.href = `mailto: hello@simpleid.xyz?subject=Enable Org: ${org}`}
      onCancel={() => getCloudServices().signOut()}
      onCloseComplete={() => getCloudServices().signOut()}
      confirmLabel='Contact Us'
      width={640}
    >
      Please contact us if you'd like to renew your subscription: {" "}
      <strong>
        <u>hello@simpleid.xyz</u>
      </strong>
    </Dialog>
  )
  renderIncorrectVersionCheck = (newProjectName) => (
    <Dialog
      isShown={true}
      title="SimpleID Version 2.0 Update"
      onConfirm={() => createProject(this, newProjectName)}
      onCancel={() => getCloudServices().signOut()}
      confirmLabel='New Project'
      cancelLabel='Logout'
      width={640}
      shouldCloseOnOverlayClick={false}
      shouldCloseOnEscapePress={false}
    >
      Older versions of SimpleID Project's have been deprecated. Please click on <strong> new project </strong> to create a new 2.0 project
    </Dialog>
  )
  renderSignedIn = () => (
    <BrowserRouter>
      <Route exact path='/' component={Dashboard} />
      <Route path='/segments' component={Segments} />
      <Route path='/notifications' component={Notifications} />
      <Route path='/communications' component={Communications} />
      <Route path='/account' component={Projects} />
      <Route path='/block' render={(props) => (
          <BlockDiagram {...props} flowy={this.flowy} />
        )}
      />
    </BrowserRouter>
  )
  render() {
    const { currentAppId, signedIn, sessionData, loading, connected, plan, org_id, appVersion } = this.global
    let element
    if (connected === 'disconnect' || connected === 'reconnecting') {
      element = this.renderDisconnected()
    } else if(loading) {
      element = this.renderLoading()
    } else if(!sessionData || (sessionData.project_name && appVersion !== '2.0')) {
      const newProjectName = sessionData.project_name + '_v2.0'
      element = this.renderIncorrectVersionCheck(newProjectName)
    } else if (plan !== 'premium' && plan !== 'enterprise') {
      element = this.renderDisabledOrgId(org_id)
    } else if(signedIn && Object.keys(sessionData).length > 0 && loading === false) {
      if (!this.gaInitialized) {
        const debugflag = process.env.REACT_APP_GOOGLE_ANALYTICS_DEBUG || currentAppId === '8d7312fa-5731-467b-bdd1-d18e5f84776a'
        ReactGA.initialize('UA-164023333-2', {
          debug: debugflag,
          titleCase: false,
          gaOptions: {
            userId: org_id
          }
        })
        ReactGA.event({
          category: 'Login',
          action: 'User App',
          label: sessionData.id
        })
        this.gaInitialized = true
      }
      element = this.renderSignedIn()
    } else if(signedIn && Object.keys(sessionData).length === 0 && loading === false) {
      element = this.renderNoProjectsView()
    } else if(this.org) {
      element = this.renderPublicDashboard()
    } else {
      element = this.renderSignIn()
    }
    return (
      <div>
        {element}
      </div>
    )
  }
}
