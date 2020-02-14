import React, { setGlobal } from 'reactn';
import ReactDOM from 'react-dom';
import App from './App';
import { getCloudUser } from './utils/cloudUser'
import { getSidSvcs, createSidSvcs } from './utils/sidServices'
const SID_APP_ID = "00000000000000000000000000000000"

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<App />, div);
  ReactDOM.unmountComponentAtNode(div);
})

it('shows sign in screen', () => {
  const div = document.createElement('div');
  ReactDOM.render(<App />, div);

  document.getElementById('sign-in-modal')
  
  ReactDOM.unmountComponentAtNode(div);
})

//TODO: this is a long time
it('logs me in under 10 seconds', async () => {
  const div = document.createElement('div')
  ReactDOM.render(<App />, div);
  createSidSvcs({appId: SID_APP_ID})
  document.getElementById('sign-in-modal')
  
  const email = 'react-test-scripts-account@mailinator.com'
  const password = 'reactScriptsPassw0rd!'
  const emailField = document.getElementById('formBasicEmail')
  emailField.value = email

  const passwordField = document.getElementById('formPassword')
  passwordField.value = password

  const signIn = await getSidSvcs().signInOrUpWithPassword(email, password)
  if(signIn === 'cognito-user-verified') {
    const userSignedIn = await getCloudUser().approveSignIn()
    if(userSignedIn) {
      console.log("Signed in successfully")
    } else {
      console.log("Failed to sign in")
    }
  } else {
    console.log("User not verified")
  }

  ReactDOM.unmountComponentAtNode(div)
}, 10000)
