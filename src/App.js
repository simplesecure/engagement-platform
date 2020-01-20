import React, { setGlobal } from 'reactn';
import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/css/theme.css';
import './assets/css/shards.min.css';
import './assets/css/style.css';
import Home from './containers/Home';
import { getFromOrganizationDataTable, getFromAnalyticsDataTable } from './utils/awsUtils';
import { setLocalStorage } from './utils/misc';
import CookieConsent from "react-cookie-consent";

export default class App extends React.Component {

  async componentDidMount() {
    const { simple, SESSION_FROM_LOCAL, signedIn } = this.global;
    setGlobal({ loading: true });
    //let currentSegments = [];
    //Check local storage for quick loading first
    const sessionFromLocal = localStorage.getItem(SESSION_FROM_LOCAL);
    if(sessionFromLocal) {
      setGlobal({ sessionData: JSON.parse(sessionFromLocal), loading: false });
    }

    if(signedIn) {
      //Need to check if the user is part of an organization from the org table
      const user_id = simple.getUserData().wallet.ethAddr;
      const org_id = simple.getUserData().orgId ? simple.getUserData().orgId.org_id : undefined;
      //regardless of whether there is data in local storage, we need to fetch from db
      let appData;
      if(org_id) {
        appData = await getFromOrganizationDataTable(org_id);
      } else {
        console.log("ERROR: No Org ID")
      }
      

      setGlobal({ user_id, org_id });
      if(appData && appData.Item && Object.keys(appData.Item.apps).length > 0) {
        const appKeys = Object.keys(appData.Item.apps);
        const allApps = appData.Item.apps;
        const currentAppId = appKeys[0]
        const data = allApps[appKeys[0]];
        data['id'] = currentAppId

        setGlobal({ signedIn: true, loading: false, currentAppId, apps: allApps, sessionData: data });

        //Check if app has been verified
        const verificationData = await getFromAnalyticsDataTable(currentAppId);
        if(verificationData.Item && verificationData.Item.verified) {
          //setGlobal({ verified: true })
        }

        //Check what pieces of data need to be processed. This looks at the segments, processes the data for the segments to 
        //Get the correct results
        //Not waiting on a result here because it would clog the thread. Instead, when the results finish, the fetchSegmentData function
        //Will update state as necessary
        if(data.currentSegments) {
          //TODO: We really need to find a good way to update this
          //this.fetchSegmentData(appData);
        }

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

  fetchSegmentData = async (appData) => {
    console.warn("FETCHING SEGMENT DATA")
    const { simple, sessionData, SESSION_FROM_LOCAL, org_id, currentAppId } = this.global;
    const payload = {
      app_id: currentAppId, 
      appData, 
      org_id
    }
    const { currentSegments } = sessionData
    let segs = currentSegments;
    setGlobal({ initialLoading: true })
    const updatedData = await simple.processData('update-segments', payload)
    segs = updatedData
    sessionData.currentSegments = segs;
    setGlobal({ sessionData })
    setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData));
    //TODO: Now we can check for notifications
    //const notifications = await simple.checkNotifications()
    //console.log("NOTIFICATIONS", notifications)
    setGlobal({ initialLoading: false })

    const iframe = document.getElementById('sid-widget');
    if(iframe) {
      iframe.parentNode.removeChild(iframe);
    }
  }

  render() {
    return (
      <div>
        <CookieConsent
          location="bottom"
          buttonText="I accept"
          cookieName="simpleIDCookieConsent"
          style={{ background: "#2B373B", zIndex: "1200" }}
          buttonStyle={{ color: "#fff", background: "#007bff", borderRadius: ".25rem", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif", fontSize: "13px" }}
          expires={150}
        >
          SimpleID may use third-party cookies to help improve your experience. Continued use of the application represents consent.{" "}
        </CookieConsent>
        <Home />
      </div>
      
    )
  }
}
