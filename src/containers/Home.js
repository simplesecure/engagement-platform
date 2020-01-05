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
    const { signedIn, sessionData } = this.global;
    console.log(sessionData);
    return (
      
      <div>
        {
          signedIn ?
          <BrowserRouter>
            <div className="container-fluid">
              <div className="row">
                <SideNav />
                <Route exact path='/' component={Dashboard} />
                <Route path='/new-search' component={Search} />
                <Route path='/segments' component={Segments} />
                <Route path='/new-tile' component={AddTile} />
                <Route path='/notifications' component={Notifications} />
                <Route path='/account' component={Account} />
                <Route path='/communications' component={Communications} />
                
              </div>
            </div>
          </BrowserRouter>
           : 
          <Auth />
        }
      </div>
    )
  }
}