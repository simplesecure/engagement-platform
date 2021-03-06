import React, { setGlobal } from 'reactn';
import { BrowserRouter } from 'react-router-dom'
import './assets/css/loader-pulse.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/css/theme.css';
import './assets/css/shards.min.css';
import './assets/css/style.css';
import Home from './containers/Home';
import OnboardingSteps from './components/OnboardingSteps'
import CookieConsent from "react-cookie-consent";
import { getCloudUser } from './utils/cloudUser.js'
import { ToastContainer } from 'react-toastify';
const PROFILE_STORAGE = 'engagement-app-profile'
const SESSION_FROM_LOCAL = 'sessionData';
const SID_JOB_QUEUE = 'sid_job_queue'

export default class App extends React.Component {

  async componentDidMount() {
    const { signedIn } = this.global;
    setGlobal({ loading: true });
    //let currentSegments = [];
    //Check local storage for quick loading first
    const sessionFromLocal = localStorage.getItem(SESSION_FROM_LOCAL)
    if(sessionFromLocal) {
      setGlobal({ sessionData: JSON.parse(sessionFromLocal), loading: false });
    }

    if(signedIn) {
      const onboardingComplete = localStorage.getItem('onboarding-complete')

      if(!onboardingComplete) {
        setGlobal({ onboardingComplete : false });
      } else {
        setGlobal({ onboardingComplete: true });
      }

      //First try to fetch the profile from local storage
      const profile = localStorage.getItem(PROFILE_STORAGE) ? JSON.parse(localStorage.getItem(PROFILE_STORAGE)) : {}
      //  Fetch job queue
      const jobs = localStorage.getItem(SID_JOB_QUEUE) ? JSON.parse(localStorage.getItem('sid_job_queue')) : undefined
      if(jobs) {
        setGlobal({ jobs })
      }
      setGlobal({ threeBoxProfile: profile })
      //Need to check if the user is part of an organization from the org table
      getCloudUser().fetchOrgDataAndUpdate()

      
    } else {
      setGlobal({ loading: false });
    }
  }

  render() {
    const { onboardingComplete, signedIn } = this.global;

    return (
      <div>
        {
          !onboardingComplete && signedIn ?
          <OnboardingSteps /> :
          <div />
        }

        {/* Set this up so that a toast with a Link redirect would work properly */}
        <BrowserRouter>
          <ToastContainer />
        </BrowserRouter>
        
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
