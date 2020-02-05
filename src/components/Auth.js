import React, { setGlobal } from 'reactn';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { getCloudUser } from '../utils/cloudUser';
import { getSidSvcs } from '../utils/sidServices.js'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'
const PROFILE_STORAGE = 'engagement-app-profile'

// eslint-disable-next-line
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/g

export default class Auth extends React.Component {
  constructor() {
    super()
    this.state = {
      email: "",
      token: "",
      password: "",
      found: false,
      errorMsg: ""
    }
  }
  //
  // Event Handlers
  //////////////////////////////////////////////////////////////////////////////
  handleEmail = (e) => {
    this.setState({ email: e.target.value });
  }

  handleCognitoPassword = (e) => {
    const password = e.target.value;
    const found = password.match(PASSWORD_REGEX);

    if (Array.isArray(found)) {
      this.setState({ password: e.target.value, found: true });
    } else {
      this.setState({ password: e.target.value, found: false });
    }
  }

  handleCode = (e) => {
    this.setState({ token: e.target.value });
  }

  handleVerifyCode = async (e) => {
    e.preventDefault()
    const { token } = this.state
    // token is rec'vd by the user on first sign up to verify the email
    try {
      setGlobal({ action: 'loading' })
      const auth = await getCloudUser().approveSignIn(token)
      console.log(`AUTH IS: ${JSON.stringify(auth, 0, 2)}`)
      if(auth) {
        setGlobal({ showSignIn: false, signedIn: true })
      }
    } catch(e) {
      console.log("TOKEN ERROR: ", e)
      setGlobal({ errorMsg: e, action: "" })
    }
  }

  handleSignIn = async (e) => {
    const { email, password } = this.state
    console.log(`DBG: handleSignIn`)
    e.preventDefault()
    try {
      setGlobal({ action: 'loading' })
      const signIn = await getSidSvcs().signInOrUpWithPassword(email, password)
      if(signIn === 'cognito-user-verified') {
        const userData = await getCloudUser().approveSignIn()
        if(userData) {
          const orgId = getCloudUser().getUserData().sid ? getCloudUser().getUserData().sid.org_id : undefined
          const profile = localStorage.getItem(PROFILE_STORAGE) ? JSON.parse(localStorage.getItem(PROFILE_STORAGE)) : {}

          setGlobal({ signedIn: true, action: "", org_id: orgId, threeBoxProfile: profile })
          await getCloudUser().fetchOrgDataAndUpdate()
        }
      } else {
        setGlobal({ action: 'sign-in-approval' })
      }
    } catch(err) {
      console.log(err)
      setGlobal({ action: ""})
      this.setState({ errorMsg: err })
    }
  }

  //
  // Renderers
  //////////////////////////////////////////////////////////////////////////////
  renderSignInApproval = () => {
    const { token } = this.state
    return (
      <div>
        <h5>Enter the code you received via email to continue</h5>
        <p>If you didn't receive a code, <span className="a-span" onClick={this.handleSignIn}>try sending it again.</span></p>
        <Form onSubmit={this.handleVerifyCode}>
          <Form.Group controlId="formBasicEmail">
            <Form.Control onChange={this.handleCode} type="text" value={token} placeholder="123456" autoComplete="off" />
          </Form.Group>
          <Button variant="primary" type="submit">
            Approve Sign In
          </Button>
        </Form>
      </div>
    )
  }

  renderLoading = () => {
    return (
      <div>
        <div className="loader">
          <div className="loading-animation"></div>
        </div>
      </div>
    )
  }

  renderTooltip = () => {
    return (
      <Tooltip>Passwords must be 8 characters and include an uppercase, lowercase, number, and special character.</Tooltip>
    )

  }

  renderPasswordFlow = () => {
    const { found, email, errorMsg } = this.state

    return (
      <div>
        <h5>Sign Into Your SimpleID Wallet</h5>
        <p>All you need is an email and password.</p>
        <Form onSubmit={this.handleSignIn}>
          <Form.Group controlId="formBasicEmail">
            <Form.Control onChange={this.handleEmail} type="email" placeholder="your.email@email.com" autoComplete="username" />
          </Form.Group>
          <Form.Group controlId="formPassword">
            <OverlayTrigger
              placement="top"
              delay={{ show: 250, hide: 400 }}
              overlay={this.renderTooltip()}
            >
              <Form.Control onChange={this.handleCognitoPassword} type="password" placeholder="Your password" autoComplete="current-password" />
            </OverlayTrigger>
            <Form.Text className="text-muted">
              If it's your first time using SimpleID, a verification code will be emailed to you.
            </Form.Text>
          </Form.Group>
          {(found && email) ? (
            <Button variant="primary" type="submit">
              Continue
            </Button>
          ) :(
            <Button disabled variant="primary">
              Continue
            </Button>
          )}
        </Form>
        <p>{errorMsg}</p>
      </div>
    )

  }

  render = () => {
    const { action } = this.global;

    let containerElements = undefined
    switch (action) {
      case 'sign-in-approval':
        containerElements = this.renderSignInApproval()
        break
      case 'loading':
        containerElements = this.renderLoading()
        break
      case 'sign-in-hosted':
        containerElements = this.renderPasswordFlow()
        break;
      default:
        containerElements = this.renderPasswordFlow()
    }

    return (
      <div className="container text-center">
        {containerElements}
      </div>
    )
  }
}
