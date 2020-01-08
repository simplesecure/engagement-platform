import React, { setGlobal } from 'reactn';
import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/css/theme.css';
import './assets/css/shards.min.css';
import './assets/css/style.css';
import Home from './containers/Home';
import { getFromOrganizationDataTable } from './utils/awsUtils';
import { setLocalStorage } from './utils/misc';

export default class App extends React.Component {

  async componentDidMount() {
    const { simple, SESSION_FROM_LOCAL, signedIn } = this.global;
    setGlobal({ loading: true });
    let currentSegments = [];
    //Check local storage for quick loading first
    const sessionFromLocal = localStorage.getItem(SESSION_FROM_LOCAL);
    if(sessionFromLocal) {
      setGlobal({ sessionData: JSON.parse(sessionFromLocal), loading: false });
    } 

    if(signedIn) {
      //Need to check if the user is part of an organization from the org table
      const user_id = simple.getUserData().wallet.ethAddr;
      const org_id = simple.getUserData().orgId.org_id;
      //regardless of whether there is data in local storage, we need to fetch from db
      const appData = await getFromOrganizationDataTable(org_id);
      console.log(appData);
      setGlobal({ user_id, org_id });
      if(appData && appData.Item && appData.Item.apps.length > 0) {
        const currentAppId = appData.Item.apps[0].id;
        const data = appData.Item.apps.filter(a => a.id === currentAppId)[0];
        setGlobal({ loading: false, currentAppId, apps: appData.Item.apps, sessionData: data });
        //This needs to be async/await
        simple.processData('segment data', currentSegments);
        //TODO: When this returns, need to update currentSegments with user counts

        setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(data));
      } else {
        setGlobal({ loading: false });
        //If there's nothing returned from the DB but something is still in local storage, what do we do?
        //TODO: should we remove from localstorage here?
      }
    } else {
      setGlobal({ loading: false });
    }
    
  }
  
  render() {
    return (
      <Home />
    )
  }
}
