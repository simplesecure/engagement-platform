import React from 'reactn';
import StickyNav from './StickyNav';
import DemoDash from './DemoDash';
import Modal from 'react-bootstrap/Modal'
import LoadingModal from './LoadingModal'
import SegmentTable from './SegmentTable'
import { getCloudUser } from '../utils/cloudUser'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export default class Dashboard extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      loadingMessage: "", 
      showSegmentModal: false, 
      segmentToShow: {}
    }
  }
  componentDidMount() {
    //Need to push user counts into the tiles if they aren't there yet
    // const { sessionData } = this.global;
    
    // setGlobal({ sessionData });
  }

  handleRefreshData = async () => {
    toast.success("Refreshing Dashboard Data...", {
      position: toast.POSITION.TOP_RIGHT,
      autoClose: 2000
    })
    getCloudUser().fetchOrgDataAndUpdate()
  }

  handleShowSeg = (seg) => {
    this.setState({ segmentToShow: seg, showSegmentModal: true })
  }

  render() {
    const { sessionData, verified, showDemo, processing } = this.global;
    const { loadingMessage, showSegmentModal, segmentToShow } = this.state
    
    const { currentSegments } = sessionData
    console.log(currentSegments)
    const allTiles = currentSegments ? currentSegments : []
    console.log(allTiles)
    const tiles = allTiles.filter(a => a.showOnDashboard === true || a.showOnDashboard === undefined)

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
                  <h3 className="page-title">App Overview <span onClick={this.handleRefreshData} className="clickable refresh"><i className="fas fa-sync-alt"></i></span></h3>
                </div>
              </div>
             
              <div className="row">
                {
                  tiles.map(tile => {
                    return (
                      <div onClick={() => this.handleShowSeg(tile)} key={tile.id} className="clickable col-lg-4 col-md-6 col-sm-6 mb-4">
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

            <ToastContainer />

            <Modal className="custom-modal" show={showSegmentModal} onHide={() => this.setState({ showSegmentModal: false, segmentToShow: {}})}>
              <Modal.Header closeButton>
                <Modal.Title>{segmentToShow.name}</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <SegmentTable seg={segmentToShow} />
              </Modal.Body>
              <Modal.Footer>
                <button className="btn btn-secondary" onClick={() => this.setState({ showSegmentModal: false, segmentToShow: {}})}>
                  Close
                </button>                  
              </Modal.Footer>
            </Modal>

            <Modal className="custom-modal" show={processing} >
              <Modal.Body>
                <LoadingModal messageToDisplay={`${loadingMessage}...`} />
              </Modal.Body>
            </Modal>
          </main>
      )
    }
  }
}