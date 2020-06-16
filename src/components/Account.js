import React from 'reactn'
import StickyNav from './StickyNav'
import {
  Button,
  Message
} from 'semantic-ui-react'

export default class Account extends React.Component {
  render() {
    const { plan } = this.global
    return(
      <main className="main-content col-lg-10 col-md-9 col-sm-12 p-0 offset-lg-2 offset-md-3">
        <StickyNav />

        <div className="main-content-container container-fluid px-4">
          <div className="page-header row no-gutters py-4">
            <div className="col-12 col-sm-4 text-center text-sm-left mb-0">
              <span className="text-uppercase page-subtitle">Overview</span>
              <h3 className="page-title">Account Information</h3>
            </div>
          </div>
          <Message compact>
            <Message.Header>Billing Information</Message.Header>
              {
                plan ?
                <div>
                  <p>Your current plan is: <strong><u>{plan}</u></strong></p>
                  <Button primary as='a' href="mailto:hello@simpleid.xyz">
                    Contact Us To Change
                  </Button>
                </div> :
                <div>
                  <p>You are currently on our <strong><u>free plan</u></strong>.</p>
                  <Button primary as='a' href="mailto:hello@simpleid.xyz">
                    Contact Us To Upgrade
                  </Button>
                </div>
              }
          </Message>
        </div>
      </main>
    )
  }
}
