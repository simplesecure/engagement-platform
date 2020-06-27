import React from "reactn";
import Card from 'react-bootstrap/Card';
import {
  Table
} from 'evergreen-ui'
import Terminal from 'terminal-in-react';
import SideNav from '../components/SideNav';

export default class Jobs extends React.Component {
  render() {
    const { jobs } = this.global;
    return (
      <div>
        <SideNav />
        <main className="main-content col-lg-10 col-md-9 col-sm-12 p-0 offset-lg-2 offset-md-3">
          <div className="main-content-container container-fluid px-4">
            <div className="page-header row no-gutters py-4">
              <div className="col-12 col-sm-12 text-center text-sm-left mb-0">
                <span className="text-uppercase page-subtitle">Console</span>
                <h3 className="page-title">Job Queue For Long Running Processes</h3>
              </div>
            </div>
            <div className="row">
              <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
                <Terminal
                  style={{
                    fontWeight: 'bold',
                    fontSize: '18px'
                  }}
                  msg='SimpleID Console: Displays the backend processes running'
                  hideTopBar={false}
                  allowTabs={false}
                  showActions={false}
                  watchConsoleLogging
                  color='#007bff'
                  prompt='#007bff'
                  backgroundColor='#272727'
                  barColor='#272727'
                  descriptions={{ help: false, show: false, clear: false }}
                  />
              </div>
              <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
                <Card>
                  <Table>
                    <Table.Head>
                      <Table.TextHeaderCell>
                        Command
                      </Table.TextHeaderCell>
                      <Table.TextHeaderCell>
                        Status
                      </Table.TextHeaderCell>
                      <Table.TextHeaderCell>
                        Job ID
                      </Table.TextHeaderCell>
                    </Table.Head>
                    <Table.Body height={600}>
                      {jobs.map(profile => (
                        <Table.Row key={profile.job_id}>
                          <Table.TextCell>{profile.command}</Table.TextCell>
                          <Table.TextCell>{profile.status}</Table.TextCell>
                          <Table.TextCell>{profile.job_id}</Table.TextCell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
}
