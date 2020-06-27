import React from 'reactn';
import { BrowserRouter, Route } from 'react-router-dom';
import SignIn from '../components/SignIn';
import Dashboard from '../components/Dashboard';
import SideNav from '../components/SideNav';
import Search from '../components/Search';
import AddTile from '../components/AddTile';
import Notifications from '../components/Notifications';
import Communications from '../components/Communications/Communications';
import Account from '../components/Account';
import Segments from '../components/Segments';
import Projects from '../components/Projects';
import Jobs from '../components/Jobs';
import Support from '../components/Support';
import BlockDiagram from '../components/BlockDiagram'
import {
  Dimmer,
  Loader,
} from 'semantic-ui-react'
import FlowyWorker from './FlowyWorker'

export default class Home extends React.Component {
  constructor (props) {
    super(props)
    this.flowy = new FlowyWorker()
  }
  renderWhenLoading() {
    return (
      <div>
        <div className="container-fluid">
          <Loader inline='centered' indeterminate>{"Loading..."}</Loader>
        </div>
      </div>
    )
  }
  renderSignedIn() {
    const { initialLoading } = this.global;
    return (
      <BrowserRouter>
        <Route exact path='/' component={Dashboard} />
        <Route path='/new-search' component={Search} />
        <Route path='/segments' component={Segments} />
        <Route path='/new-tile' component={AddTile} />
        <Route exact path='/notifications' component={Notifications} />
        <Route path='/account' component={Account} />
        <Route path='/communications' component={Communications} />
        <Route path='/support' component={Support} />
        <Route path='/projects' component={Projects} />
        <Route path='/console' component={Jobs} />
        <Route path='/block' render={(props) => (
            <BlockDiagram {...props} flowy={this.flowy} />
          )}
        />
        <Dimmer active={initialLoading}>
          <Loader inline='centered' indeterminate>{"Updating your user segment data..."}</Loader>
        </Dimmer>
      </BrowserRouter>
    )
  }

  renderNoProjectsView() {
    return (
      <BrowserRouter>
        <SideNav />
        <Projects />
      </BrowserRouter>
    )
  }

  renderSignIn() {
    return (
      <SignIn />
    )
  }

  render() {
    const { signedIn, sessionData, loading } = this.global;
    let renderEl;
    if(loading) {
      renderEl = this.renderWhenLoading()
    } else if(signedIn && Object.keys(sessionData).length > 0 && loading === false) {
      renderEl = this.renderSignedIn()
    } else if(signedIn && Object.keys(sessionData).length === 0 && loading === false) {
      renderEl = this.renderNoProjectsView()
    } else {
      renderEl = this.renderSignIn()
    }
    return (
      <div>
        {renderEl}
      </div>
    )
  }
}
