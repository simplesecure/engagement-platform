import React from 'reactn';
import StickyNav from './StickyNav';

export default class Account extends React.Component {
  render() {
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
          <div className="row">
            <div className="col-lg-4">
              <div className="card card-small mb-4 pt-3">
                <div className="card-header border-bottom text-center">
                  <div className="mb-3 mx-auto">
                    <img className="rounded-circle" src="images/avatars/0.jpg" alt="User Avatar" width="110" /> </div>
                  <h4 className="mb-0">Sierra Brooks</h4>
                  <span className="text-muted d-block mb-2">Project Manager</span>
                  <button type="button" className="mb-2 btn btn-sm btn-pill btn-outline-primary mr-2">
                    <i className="material-icons mr-1">person_add</i>Follow</button>
                </div>
                <ul className="list-group list-group-flush">
                  <li className="list-group-item px-4">
                    <div className="progress-wrapper">
                      <strong className="text-muted d-block mb-2">Workload</strong>
                      <div className="progress progress-sm">
                        <div className="progress-bar bg-primary" role="progressbar" aria-valuenow="74" aria-valuemin="0" aria-valuemax="100" style={{width: "74%"}}>
                          <span className="progress-value">74%</span>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li className="list-group-item p-4">
                    <strong className="text-muted d-block mb-2">Description</strong>
                    <span>Lorem ipsum dolor sit amet consectetur adipisicing elit. Odio eaque, quidem, commodi soluta qui quae minima obcaecati quod dolorum sint alias, possimus illum assumenda eligendi cumque?</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="col-lg-8">
              <div className="card card-small mb-4">
                <div className="card-header border-bottom">
                  <h6 className="m-0">Account Details</h6>
                </div>
                <ul className="list-group list-group-flush">
                  <li className="list-group-item p-3">
                    <div className="row">
                      <div className="col">
                        <form>
                          <div className="form-row">
                            <div className="form-group col-md-6">
                              <label for="feFirstName">First Name</label>
                              <input type="text" className="form-control" id="feFirstName" placeholder="First Name" value="Sierra" /> </div>
                            <div className="form-group col-md-6">
                              <label for="feLastName">Last Name</label>
                              <input type="text" className="form-control" id="feLastName" placeholder="Last Name" value="Brooks" /> </div>
                          </div>
                          <div className="form-row">
                            <div className="form-group col-md-6">
                              <label for="feEmailAddress">Email</label>
                              <input type="email" className="form-control" id="feEmailAddress" placeholder="Email" value="sierra@example.com" /> </div>
                            <div className="form-group col-md-6">
                              <label for="fePassword">Password</label>
                              <input type="password" className="form-control" id="fePassword" placeholder="Password" /> </div>
                          </div>
                          <div className="form-group">
                            <label for="feInputAddress">Address</label>
                            <input type="text" className="form-control" id="feInputAddress" placeholder="1234 Main St" /> </div>
                          <div className="form-row">
                            <div className="form-group col-md-6">
                              <label for="feInputCity">City</label>
                              <input type="text" className="form-control" id="feInputCity" /> </div>
                            <div className="form-group col-md-4">
                              <label for="feInputState">State</label>
                              <select id="feInputState" className="form-control">
                                <option selected>Choose...</option>
                                <option>...</option>
                              </select>
                            </div>
                            <div className="form-group col-md-2">
                              <label for="inputZip">Zip</label>
                              <input type="text" className="form-control" id="inputZip" /> </div>
                          </div>
                          <div className="form-row">
                            <div className="form-group col-md-12">
                              <label for="feDescription">Description</label>
                              <textarea className="form-control" name="feDescription" rows="5">Lorem ipsum dolor sit amet consectetur adipisicing elit. Odio eaque, quidem, commodi soluta qui quae minima obcaecati quod dolorum sint alias, possimus illum assumenda eligendi cumque?</textarea>
                            </div>
                          </div>
                          <button type="submit" className="btn btn-accent">Update Account</button>
                        </form>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            </div>
            </div>
      </main>
    )
  }
}