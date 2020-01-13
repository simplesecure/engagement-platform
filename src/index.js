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
  network: 'ropsten', 
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
  showDemo: false 
})

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
//sessionData: {
// currentTiles: [
//   {
//     name: "Total Users"
//   }, 
//   {
//     name: "Daily Active Users"
//   }, 
//   {
//     name: "Total Transactions"
//   }
// ],
// customTiles: [
//   {
//     name: "Contract Transactions"
//   }, 
//   {
//     name: "Current AUM"
//   }
// ], 
// standardTiles: [
//   {
//     name: "Total Users"
//   }, 
//   {
//     name: "Daily Active Users"
//   }, 
//   {
//     name: "Total Transactions"
//   }
// ],
// currentSegments: [
//   {
//     id: "1234", 
//     name: "AUM Greater Than $10k", 
//     userCount: 38
//   }
// ], 
// campaigns: [
//   {
//     id: "1234", 
//     name: "Welcome", 
//     userCount: 2048, 
//     clickRate: "38%", 
//     openRate: "42%"
//   }, 
//   {
//     id: "1235", 
//     name: "Come Back", 
//     userCount: 206, 
//     clickRate: "18%", 
//     openRate: "22%"
//   }
// ], 
// currentTemplates: [
//   {
//     id: "1234", 
//     name: "Welcome", 
//     html: "<div></div>"
//   }
// ], 
// notifications: [
//   {
//     id: "1234", 
//     name: "DAI Migration", 
//     content: "Lorem ipsum", 
//     segmentId: "1234", 
//     active: true
//   },
//   {
//     id: "1235", 
//     name: "Scheduled Maintenance", 
//     content: "Lorem ipsum", 
//     segmentId: "1234", 
//     active: false
//   } 
// ]
//}
