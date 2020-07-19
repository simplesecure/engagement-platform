import React from "reactn";
import Card from 'react-bootstrap/Card';
import {
  Table
} from 'evergreen-ui'
import Terminal from 'terminal-in-react';
import SideNav from '../components/SideNav';
import ProcessingBlock from './ProcessingBlock'

export default class Jobs extends React.Component {
  render() {
    const { jobs } = this.global;
    return (
      <div>
        <SideNav />
        <main className="main-content col-lg-10 col-md-9 col-sm-12 p-0 offset-lg-2 offset-md-3">
          <div className="main-content-container container-fluid px-4">
            <div className="page-header row no-gutters py-4">
              <div className="col-lg-6 col-md-6 col-sm-12 text-left text-sm-left mb-0">
                <span className="text-uppercase page-subtitle">Console</span>
                <h3 className="page-title">Job Queue For Long Running Processes</h3>
              </div>
              <div className="col-lg-6 col-md-6 col-sm-12 mb-4 text-right">
                <ProcessingBlock />
              </div>
            </div>
            <Terminal
              style={{
                fontWeight: 'bold',
                fontSize: '18px',
                width: '80vw',
                height: '50vh'
              }}
              msg='SimpleID Console: Displays the backend processes running'
              hideTopBar={false}
              allowTabs={false}
              showActions={false}
              watchConsoleLogging
              startState='maximised'
              color='#007bff'
              prompt='#007bff'
              backgroundColor='#272727'
              barColor='#272727'
              descriptions={{ help: false, show: false, clear: false }}
              />
            <Card style={{marginTop: -200}}>
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
        </main>
      </div>
    );
  }
}
