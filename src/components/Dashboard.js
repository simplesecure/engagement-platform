import React, { setGlobal } from 'reactn';
import StickyNav from './StickyNav';
import { loadCharts } from '../actions/dashboard';
import DemoDash from './DemoDash';

export default class Dashboard extends React.Component {
  componentDidMount() {
    //Need to push user counts into the tiles if they aren't there yet
    const { sessionData } = this.global;
    
    loadCharts()
    setGlobal({ sessionData });
  }

  render() {
    const { sessionData, verified, showDemo } = this.global;
    const { currentSegments } = sessionData;
    const allTiles = currentSegments ? currentSegments : []
    const tiles = allTiles.filter(a => a.showOnDashboard)

    if(showDemo) {
      return (
        <DemoDash />
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
                                <h6 className="stats-small__value count my-3">{tile.userCount ? tile.userCount : 0}</h6>
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