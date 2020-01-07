import React from 'reactn';
import { BrowserRouter, Route } from 'react-router-dom';
import Auth from '../components/Auth';
import Dashboard from '../components/Dashboard';
import SideNav from '../components/SideNav';
import Search from '../components/Search';
import AddTile from '../components/AddTile';
import Notifications from '../components/Notifications';
import Communications from '../components/Communications';
import Account from '../components/Account';
import Segments from '../components/Segments';
import Message from '../components/Message';
import Projects from '../components/Projects';

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
  render() {
    const { signedIn, sessionData, loading } = this.global;
    const { id } = sessionData;
    console.log("LOADING: ", loading);
    console.log("SIGNED IN: ", signedIn);
    console.log("ID: ", id);
    return (
      <div>
        {
          loading ? 
          <div>
            <div className="container-fluid">
              <div className="row">LOADING</div>
            </div>
          </div> : 
          signedIn && id && !loading ?
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
                <Route path='/projects' component={Projects} />
                {/*
                  //This is the component that will render the in-app notifications
                */}
                <Route path='/notifications/appId=:id&messageIds=:id' component={Message} />
              </div>
            </div>
          </BrowserRouter>
           : 
           signedIn && !id ? 
           <BrowserRouter>
            <div className="container-fluid">
              <div className="row">
                <SideNav />
                <Projects />
              </div>
              </div>
            </BrowserRouter> : 
           !window.location.href.includes('notifications/appId') ? 
          <Auth /> : 
          <BrowserRouter>
            <div>
              {/*
                //This is the component that will render the in-app notifications
              */}
              <Route path='/notifications/appId=:id&messageIds=:id' component={Message} />
            </div>
          </BrowserRouter>
        }
      </div>
    )
  }
}