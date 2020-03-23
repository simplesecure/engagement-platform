import React from "reactn";
import Table from "react-bootstrap/Table";
import StickyNav from "./StickyNav";
import Card from 'react-bootstrap/Card';

export default class Jobs extends React.Component {
  render() {
    const { jobs } = this.global;
    return (
      <main className="main-content col-lg-10 col-md-9 col-sm-12 p-0 offset-lg-2 offset-md-3">
        <div>
          <StickyNav />
          <div className="main-content-container container-fluid px-4">
            <div className="page-header row no-gutters py-4">
              <div className="col-12 col-sm-4 text-center text-sm-left mb-0">
                <h3 className="page-title">Job Queue</h3>
                <p>Jobs are long-running processes like importing wallets, updating segments, and creating segments</p>
              </div>
            </div>
            <div className="row">
              <div className="col-lg-12 col-md-12 col-sm-12 mb-4">
                <Card>
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Job ID</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {jobs.map(job => {
                        return (
                          <tr key={job.job_id}>
                            <td>{job.job_id}</td>
                            <td>{job.status}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }
}
