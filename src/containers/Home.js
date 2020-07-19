import React, { setGlobal } from 'reactn'
import { BrowserRouter, Route, useLocation } from 'react-router-dom'
import SignIn from '../components/SignIn'
import Dashboard from '../components/Dashboard'
import SideNav from '../components/SideNav'
import Notifications from '../components/Notifications'
import Communications from '../components/Communications/Communications'
import Segments from '../components/Segments'
import Projects from '../components/Projects'
import Jobs from '../components/Jobs'
import Support from '../components/Support'
import BlockDiagram from '../components/BlockDiagram'
import { Dimmer, Loader } from 'semantic-ui-react'
import FlowyWorker from './FlowyWorker'
import { getCloudUser } from '../utils/cloudUser';
const qs = require('query-string');

export default class Home extends React.Component {
  constructor (props) {
    super(props)
    this.flowy = new FlowyWorker()
    const { org } = qs.parse(window.location.search);
    console.log(org);
    this.org = org
    // "d4d9d63d-939c-4ace-b46b-00dcf1cf08ab"
  }
  async componentDidMount() {
    if (this.org) {
      await setGlobal({ publicDashboard: true })
      await getCloudUser().fetchOrgDataAndUpdate(this.org)
    }
  }
  renderSignIn = () => <SignIn />
  renderLoading = (message="Loading....") => (
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
  renderSignedIn = () => (
    <BrowserRouter>
      <Route exact path='/' component={Dashboard} />
      <Route path='/segments' component={Segments} />
      <Route path='/notifications' component={Notifications} />
      <Route path='/communications' component={Communications} />
      <Route path='/support' component={Support} />
      <Route path='/account' component={Projects} />
      <Route path='/console' component={Jobs} />
      <Route path='/block' render={(props) => (
          <BlockDiagram {...props} flowy={this.flowy} />
        )}
      />
    </BrowserRouter>
  )
  render() {
    const { signedIn, sessionData, loading } = this.global
    let element
    if(loading) {
      element = this.renderLoading()
    } else if(signedIn && Object.keys(sessionData).length > 0 && loading === false) {
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
