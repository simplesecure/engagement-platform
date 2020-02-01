import React, { setGlobal } from 'reactn';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

const SESSION_FROM_LOCAL = 'sessionData';
const SID_APP_ID = "00000000000000000000000000000000"

setGlobal({
  loading: true,
  SESSION_FROM_LOCAL,
  verified: false,
  signedIn: false,
  sessionData: {},
  user_id: "",
  app_id: SID_APP_ID,
  apps: {},
  selectedProject: {},
  showDemo: false,
  processing: false,
  initialLoading: false
})

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
