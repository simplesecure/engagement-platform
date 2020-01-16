import React, { setGlobal } from 'reactn';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import SimpleID from 'simpleid-js-sdk';
const simple = new SimpleID({
  appOrigin: window.location.origin,
  appName: "Demo Dashboard",
  appId: "00000000000000000000000000000000",
  development: true, 
  network: 'mainnet', 
  localRPCServer: 'http://localhost:7545'
});
const SESSION_FROM_LOCAL = 'sessionData';

setGlobal({ 
  loading: true,
  SESSION_FROM_LOCAL,
  simple, 
  appConnected: false, 
  signedIn: simple.getUserData() ? true : false, 
  sessionData: {},
  user_id: "", 
  app_id: simple.config.appId, 
  apps: [], 
  selectedProject: {},
  showDemo: false,
  processing: false
})

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();