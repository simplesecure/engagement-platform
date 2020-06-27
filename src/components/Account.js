import React from 'reactn'
import SideNav from './SideNav';
import {
  Button,
  Divider,
  Grid,
  Header,
  Icon,
  Segment
} from 'semantic-ui-react'
import { getCloudUser } from "./../utils/cloudUser.js";

export default class Account extends React.Component {
  render() {
    const { plan, sessionData } = this.global
    return(
      <div>
        <SideNav />
        <main className="main-content col-lg-10 col-md-9 col-sm-12 p-0 offset-lg-2 offset-md-3">
          <div className="main-content-container container-fluid px-4">
            <div className="page-header row no-gutters py-4">
              <div className="col-12 col-sm-4 text-center text-sm-left mb-0">
                <span className="text-uppercase page-subtitle">Overview</span>
                <h3 className="page-title">Account Information</h3>
              </div>
            </div>
            <Segment>
              <Grid columns={2} stackable textAlign='center'>
                <Grid.Row verticalAlign='middle'>
                  <Grid.Column>
                    <Header icon>
                      <Icon name='newspaper' />
                      Billing Information
                    </Header>
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
                  </Grid.Column>
                  <Divider vertical />
                  <Grid.Column>
                    <Header icon>
                      <Icon name='logout' />
                      Logout of Account?
                    </Header>
                    <div>
                      <p>You are currently logged in to <strong><u>{sessionData.project_name}</u></strong>.</p>
                      <Button
                        color='red'
                        onClick={() => getCloudUser().signOut()}
                      >
                        Logout
                      </Button>
                    </div>
                  </Grid.Column>
                </Grid.Row>
              </Grid>
            </Segment>
          </div>
        </main>
      </div>
    )
  }
}
