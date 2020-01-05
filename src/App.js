import React, { setGlobal } from 'reactn';
import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/css/theme.css';
import './assets/css/shards.min.css';
import './assets/css/style.css';
import Home from './containers/Home';
import { getFromAnalyticsDataTable } from './utils/awsUtils';
import { setLocalStorage } from './utils/misc';

export default class App extends React.Component {

  async componentDidMount() {
    const { sessionData, simple, SESSION_FROM_LOCAL, signedIn } = this.global;
    let currentSegments = [];
    //Check local storage for quick loading first
    const sessionFromLocal = localStorage.getItem(SESSION_FROM_LOCAL);
    if(sessionFromLocal) {
      setGlobal({ sessionData: JSON.parse(sessionFromLocal) });
    } 

    if(signedIn) {
      const user_id = simple.getUserData().wallet.ethAddr;
      const app_id = simple.config.appId;
      //regardless of whether there is data in local storage, we need to fetch from db
      const appData = await getFromAnalyticsDataTable(user_id);
      setGlobal({ user_id, app_id });
      if(appData && appData.Item) {
        setGlobal({ sessionData: appData.Item.users[user_id].appData });
        simple.processData('segment data', currentSegments);
        //TODO: When this returns, need to update currentSegments with user counts

        setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData));
      } else {
        //If there's nothing returned from the DB but something is still in local storage, what do we do?
        //TODO: should we remove from localstorage here?
      }
    }
    
  }
  
  render() {
    return (
      <Home />
    )
  }
}
