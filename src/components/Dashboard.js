import React, { setGlobal } from 'reactn';
import StickyNav from './StickyNav';
import { loadCharts } from '../actions/dashboard';

export default class Dashboard extends React.Component {
  componentDidMount() {
    //Need to push user counts into the tiles if they aren't there yet
    const { sessionData } = this.global;
    const { currentSegments, currentTiles } = sessionData;
    if(currentTiles && currentSegments) {
      for(const tile of currentTiles) {
        const segment = currentSegments.filter(a => a.id === tile.segment)[0];
        tile.userCount = segment.userCount;
      }
    }
    loadCharts()
    setGlobal({ sessionData });
  }

  render() {
    const { sessionData, verified, showDemo } = this.global;
    const { currentTiles } = sessionData;
    
    const tiles = currentTiles ? currentTiles : [];
    if(showDemo) {
      return (
        <main className="main-content col-lg-10 col-md-9 col-sm-12 p-0 offset-lg-2 offset-md-3">
                        
          <StickyNav />
          <div className="main-content-container container-fluid px-4">
          
            <div className="page-header row no-gutters py-4">
              <div className="col-12 col-sm-4 text-center text-sm-left mb-0">
                <span className="text-uppercase page-subtitle">Dashboard</span>
                <h3 className="page-title">App Overview</h3>
              </div>
            </div>
          
            <div className="row">
              <div className="col-lg col-md-6 col-sm-6 mb-4">
                <div className="stats-small stats-small--1 card card-small">
                  <div className="card-body p-0 d-flex">
                    <div className="d-flex flex-column m-auto">
                      <div className="stats-small__data text-center">
                        <span className="stats-small__label text-uppercase">Total Users</span>
                        <h6 className="stats-small__value count my-3">2,390</h6>
                      </div>
                      <div className="stats-small__data">
                        <span className="stats-small__percentage stats-small__percentage--increase">4.7%</span>
                      </div>
                    </div>
                    <canvas height="120" className="blog-overview-stats-small-1"></canvas>
                  </div>
                </div>
              </div>
              <div className="col-lg col-md-6 col-sm-6 mb-4">
                <div className="stats-small stats-small--1 card card-small">
                  <div className="card-body p-0 d-flex">
                    <div className="d-flex flex-column m-auto">
                      <div className="stats-small__data text-center">
                        <span className="stats-small__label text-uppercase">Daily Active Users</span>
                        <h6 className="stats-small__value count my-3">182</h6>
                      </div>
                      <div className="stats-small__data">
                        <span className="stats-small__percentage stats-small__percentage--increase">12.4%</span>
                      </div>
                    </div>
                    <canvas height="120" className="blog-overview-stats-small-2"></canvas>
                  </div>
                </div>
              </div>
              <div className="col-lg col-md-4 col-sm-6 mb-4">
                <div className="stats-small stats-small--1 card card-small">
                  <div className="card-body p-0 d-flex">
                    <div className="d-flex flex-column m-auto">
                      <div className="stats-small__data text-center">
                        <span className="stats-small__label text-uppercase">Total Transactions</span>
                        <h6 className="stats-small__value count my-3">8,147</h6>
                      </div>
                      <div className="stats-small__data">
                        <span className="stats-small__percentage stats-small__percentage--decrease">3.8%</span>
                      </div>
                    </div>
                    <canvas height="120" className="blog-overview-stats-small-3"></canvas>
                  </div>
                </div>
              </div>
              <div className="col-lg col-md-4 col-sm-6 mb-4">
                <div className="stats-small stats-small--1 card card-small">
                  <div className="card-body p-0 d-flex">
                    <div className="d-flex flex-column m-auto">
                      <div className="stats-small__data text-center">
                        <span className="stats-small__label text-uppercase">Contract Transactions</span>
                        <h6 className="stats-small__value count my-3">2,413</h6>
                      </div>
                      <div className="stats-small__data">
                        <span className="stats-small__percentage stats-small__percentage--increase">12.4%</span>
                      </div>
                    </div>
                    <canvas height="120" className="blog-overview-stats-small-4"></canvas>
                  </div>
                </div>
              </div>
              <div className="col-lg col-md-4 col-sm-12 mb-4">
                <div className="stats-small stats-small--1 card card-small">
                  <div className="card-body p-0 d-flex">
                    <div className="d-flex flex-column m-auto">
                      <div className="stats-small__data text-center">
                        <span className="stats-small__label text-uppercase">Current AUM</span>
                        <h6 className="stats-small__value count my-3">$17,281</h6>
                      </div>
                      <div className="stats-small__data">
                        <span className="stats-small__percentage stats-small__percentage--decrease">2.4%</span>
                      </div>
                    </div>
                    <canvas height="120" className="blog-overview-stats-small-5"></canvas>
                  </div>
                </div>
              </div>
            </div>
          
            <div className="row">
          
              <div className="col-lg-8 col-md-12 col-sm-12 mb-4">
                <div className="card card-small">
                  <div className="card-header border-bottom">
                    <h6 className="m-0">Users</h6>
                  </div>
                  <div className="card-body pt-0">
                    <div className="row border-bottom py-2 bg-light">
                      <div className="col-12 col-sm-6">
                        <div id="blog-overview-date-range" className="input-daterange input-group input-group-sm my-auto ml-auto mr-auto ml-sm-auto mr-sm-0" style={{maxWidth: "350px"}}>
                          <input type="text" className="input-sm form-control" name="start" placeholder="Start Date" id="blog-overview-date-range-1" />
                          <input type="text" className="input-sm form-control" name="end" placeholder="End Date" id="blog-overview-date-range-2" />
                          <span className="input-group-append">
                            <span className="input-group-text">
                              <i className="material-icons"></i>
                            </span>
                          </span>
                        </div>
                      </div>
                      <div className="col-12 col-sm-6 d-flex mb-2 mb-sm-0">
                        <button type="button" className="btn btn-sm btn-white ml-auto mr-auto ml-sm-auto mr-sm-0 mt-3 mt-sm-0">View Full Report &rarr;</button>
                      </div>
                    </div>
                    <canvas height="130" style={{maxWidth: "100%"}} className="background-chart"></canvas>
                  </div>
                </div>
              </div>
        
              <div className="col-lg-4 col-md-6 col-sm-12 mb-4">
                <div className="card card-small h-100">
                  <div className="card-header border-bottom">
                    <h6 className="m-0">Transactions by Contract</h6>
                  </div>
                  <div className="card-body d-flex py-0">
                    <canvas height="220" className="blog-users-by-device m-auto"></canvas>
                  </div>
                  <div className="card-footer border-top">
                    <div className="row">
                      <div className="col">
                        <select className="custom-select custom-select-sm" style={{maxWidth: "130px"}}>
                          <option defaultValue="Last Week">Last Week</option>
                          <option value="1">Today</option>
                          <option value="2">Last Month</option>
                          <option value="3">Last Year</option>
                        </select>
                      </div>
                      <div className="col text-right view-report">
                        <button className="a-el-fix">Full report &rarr;</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
      
            </div>
          </div>

        </main>
      )
    } else {
      return(
        <main className="main-content col-lg-10 col-md-9 col-sm-12 p-0 offset-lg-2 offset-md-3">
            
            <StickyNav />
            <div className="main-content-container container-fluid px-4">
            
              <div className="page-header row no-gutters py-4">
                <div className="col-12 col-sm-4 text-center text-sm-left mb-0">
                  <span className="text-uppercase page-subtitle">Dashboard</span>
                  <h3 className="page-title">App Overview</h3>
                </div>
              </div>
             
              <div className="row">
                {
                  tiles.map(tile => {
                    return (
                      <div key={tile.id} className="col-lg col-md-6 col-sm-6 mb-4">
                        <div className="stats-small stats-small--1 card card-small">
                          <div className="card-body p-0 d-flex">
                            <div className="d-flex flex-column m-auto">
                              <div className="stats-small__data text-center">
                                <span className="stats-small__label text-uppercase">{tile.name}</span>
                                <h6 className="stats-small__value count my-3">{tile.userCount}</h6>
                              </div>
                              <div className="stats-small__data">
                                {/*<span className="stats-small__percentage stats-small__percentage--increase">4.7%</span>*/}
                              </div>
                            </div>
                            <canvas height="120" className="blog-overview-stats-small-1"></canvas>
                          </div>
                        </div>
                      </div>
                    )
                  })
                }
              </div>
              {
                tiles.length > 0 ? 
                <div></div> : 
                <div>
                  <p>Looks like we don't have enough data to display yet. {verified ? <span>But the good news is <strong><u>your application is properly configured</u></strong> with the SimpleID SDK.</span> : <span>Let's get you connected to the SimpleID SDK so that we can start receiving data. <a href="https://docs.simpleid.xyz" target="_blank" rel="noopener noreferrer"><button className="a-el-fix">Connect</button></a></span>}</p>
                </div>
              }
            </div>
  
          </main>
      )
    }
  }
}