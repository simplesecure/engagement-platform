import React from 'reactn';
import StickyNav from './StickyNav';

export default class Account extends React.Component {
  render() {
    const { simple } = this.global;
    return(
      <main className="main-content col-lg-10 col-md-9 col-sm-12 p-0 offset-lg-2 offset-md-3">
        <StickyNav />

        <div className="main-content-container container-fluid px-4">
          <div className="page-header row no-gutters py-4">
            <div className="col-12 col-sm-4 text-center text-sm-left mb-0">
              <span className="text-uppercase page-subtitle">Account</span>
              <h3 className="page-title">Account and Billing</h3>
            </div>
          </div>

          <div className="row">
            <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
              <h5>Your Info</h5>
              <ul className="tile-list">
                <li className=" card text-center"><span className="card-body standard-tile seg-title">User ID/Wallet<br/><strong className="account-card">{simple.getUserData() && simple.getUserData().wallet ? simple.getUserData().wallet.ethAddr : ""}</strong></span></li>
                <li className=" card text-center"><span className="card-body standard-tile seg-title">Your Team<br/><strong className="account-card">Coming Soon...</strong></span></li>
                <li className=" card text-center"><span className="card-body standard-tile seg-title">Your Plan<br/><strong className="account-card">Beta</strong></span></li>
              </ul>
            </div>

            <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
              <h5>Billing Info</h5>
              <p>Upgrade Your Plan</p>
              <div class="form-group col-md-12">
                <label htmlFor="inputSeg">Select a Plan</label>
                <ul className="tile-list">
                  <li className="card text-center"><span className="card-body standard-tile seg-title">Coming Soon</span></li>
                </ul>
              </div>
              <p>Account History</p>
              <ul className="tile-list">
                <li className="card text-center"><span className="card-body standard-tile seg-title">Coming Soon</span></li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    )
  }
}