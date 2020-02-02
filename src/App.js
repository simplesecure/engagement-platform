import React, { setGlobal } from 'reactn';
import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/css/theme.css';
import './assets/css/shards.min.css';
import './assets/css/style.css';
import Home from './containers/Home';
import { setLocalStorage } from './utils/misc';
import CookieConsent from "react-cookie-consent";
import { getCloudUser } from './utils/cloudUser.js'

export default class App extends React.Component {

  async componentDidMount() {
    const { SESSION_FROM_LOCAL, signedIn } = this.global;
    setGlobal({ loading: true });
    //let currentSegments = [];
    //Check local storage for quick loading first
    const sessionFromLocal = localStorage.getItem(SESSION_FROM_LOCAL);
    if(sessionFromLocal) {
      setGlobal({ sessionData: JSON.parse(sessionFromLocal), loading: false });
    }

    if(signedIn) {
      //Need to check if the user is part of an organization from the org table
      await getCloudUser().fetchOrgDataAndUpdate()
    } else {
      setGlobal({ loading: false });
    }

  }

  fetchSegmentData = async (appData) => {
    console.warn("FETCHING SEGMENT DATA")
    const { sessionData, SESSION_FROM_LOCAL, org_id, currentAppId } = this.global;
    const payload = {
      app_id: currentAppId,
      appData,
      org_id
    }
    const { currentSegments } = sessionData
    let segs = currentSegments;
    setGlobal({ initialLoading: true })
    const updatedData = await getCloudUser().processData('update-segments', payload)
    segs = updatedData
    sessionData.currentSegments = segs;
    setGlobal({ sessionData })
    setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData));
    //TODO: Now we can check for notifications
    //const notifications = await getCloudUser().checkNotifications()
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
