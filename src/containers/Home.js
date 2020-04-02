import React from 'reactn';
import { BrowserRouter, Route } from 'react-router-dom';
import SignIn from '../components/SignIn';
import Dashboard from '../components/Dashboard';
import SideNav from '../components/SideNav';
import Search from '../components/Search';
import AddTile from '../components/AddTile';
import Notifications from '../components/Notifications';
import Communications from '../components/Communications';
import Account from '../components/Account';
import Segments from '../components/Segments';
import Projects from '../components/Projects';
import Jobs from '../components/Jobs';
import Support from '../components/Support';
import LoadingModal from '../components/LoadingModal';
import Modal from 'react-bootstrap/Modal'

export default class Home extends React.Component {
  renderRoute(route) {
    switch(route.split()[0]) {
      case '/':
        return <Dashboard />
      case '/new-search':
        return <Search />
      case '/new-tile':
        return <AddTile />
      case '/notifications':
        return <Notifications />
      default:
        return <Home />
    }
  }

  renderWhenLoading() {
    return (
      <div>
        <div className="container-fluid">
          <LoadingModal messageToDisplay={"Loading..."} />
        </div>
      </div>
    )
  }

  renderSignedIn() {
    const { initialLoading } = this.global;
    return (
      <BrowserRouter>
      <div className="container-fluid">
        <div className="row">
          {
            !window.location.href.includes('notifications/appId') ?
            <SideNav /> :
            <div/>
          }
          <Route exact path='/' component={Dashboard} />
          <Route path='/new-search' component={Search} />
          <Route path='/segments' component={Segments} />
          <Route path='/new-tile' component={AddTile} />
          <Route exact path='/notifications' component={Notifications} />
          <Route path='/account' component={Account} />
          <Route path='/communications' component={Communications} />
          <Route path='/support' component={Support} />
          <Route path='/projects' component={Projects} />
          <Route path='/jobs' component={Jobs} />

          <Modal show={initialLoading} >
            <Modal.Body>
                <LoadingModal messageToDisplay={"Updating your user segment data..."} />
            </Modal.Body>
          </Modal>
        </div>
      </div>
    </BrowserRouter>
    )
  }

  renderNoProjectsView() {
    return (
      <BrowserRouter>
        <div className="container-fluid">
          <div className="row">
            <SideNav />
            <Projects />
          </div>
        </div>
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
