import React from "reactn";
import StickyNav from "./StickyNav";
import DemoDash from "./DemoDash";
import Modal from "react-bootstrap/Modal";
import LoadingModal from "./LoadingModal";
import SegmentTable from "./SegmentTable";
import { getCloudUser } from "../utils/cloudUser";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Image from 'react-bootstrap/Image'
import Table from 'react-bootstrap/Table'

import Chart from "react-google-charts";

// TODO: Burn this shit library after converting to google charts ... (i.e.
//       remove it, refs to it, and the stupid files--yeah, I hate it--it's
//       crap and doesn't respect responsiveness!)
//
// TODO: get a license for this if we go with it for production or get another
//       library
//
// From: https://canvasjs.com/docs/charts/integration/react/
import CanvasJSReact from './../canvasjs.react';
var CanvasJS = CanvasJSReact.CanvasJS;
var CanvasJSChart = CanvasJSReact.CanvasJSChart;


export default class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loadingMessage: "",
      showSegmentModal: false,
      segmentToShow: {},
      showContracts: false
    };

    this.uniqueEleKey = Date.now()
  }

  getUniqueKey() {
    return this.uniqueEleKey++
  }

  handleRefreshData = async () => {
    toast.success("Refreshing Dashboard Data...", {
      position: toast.POSITION.TOP_RIGHT,
      autoClose: 2000,
    });
    getCloudUser().fetchOrgDataAndUpdate();
  };

  handleShowSeg = (seg) => {
    this.setState({ segmentToShow: seg, showSegmentModal: true });
  };

  handleShowContracts = () => {
    this.setState({ showContracts: true })
  }

  getChartDiv = (options) => {
    return (
       <div className="d-flex"
            style={{margin:10, flex:1, width:'100%'}}>
         <CanvasJSChart options={options} /* onRef = {ref => this.chart = ref} */ />
       </div>
     )
  }

  getCrappyDonutChart = () => {
    const options = {
      animationEnabled: false,
      theme: "light2",
      // title:{ text: "Proxy Wallet Sources" },
      data: [{
            type: "doughnut",
            startAngle: 60,
            //innerRadius: 60,
            indexLabelFontSize: 17,
            indexLabel: "{label} - #percent%",
            toolTipContent: "<b>{label}:</b> {y} (#percent%)",
            dataPoints: [
                  { y: 37, label: "Oasis" },
                  { y: 23, label: "InstaDapp" },
                  { y: 10, label: "Kyber" },
                  { y: 12, label: "UniSwap"},
                  { y: 8, label: "Aave"},
                  { y: 10, label: "Other"}
            ]
      }]
    }

    return this.getChartDiv(options)
  }

  getNotCrappyDonutChart = () => {
    return (
      <div style={{flex:1, width:'100%'}}>
        <Chart
          chartType="PieChart"
          height="100%"
          data={[
            ["Frontend", "Wallet Percentage"],
            ["Oasis", 37],
            ["InstaDapp", 23],
            ["Kyber", 10],
            ["UniSwap", 12],
            ["Aave", 8],
            ["Other", 10]
          ]}
          options={{
            is3D: false,
            pieHole: 0.5,
            pieSliceText: 'none',
            legend: {
              position: 'labeled'
            },
            chartArea: {
              width: '85%',
              height: '90%'
            }
          }}
        />
      </div>
    );
  }

  getCdpLockInChart = () => {
    const options = {
      theme: "light2", // "light1", "light2", "dark1", "dark2"
      animationEnabled: true,
      // title: { text: "Value locked in CDPs" },
      axisY: { title: "Assets (USD MM)", prefix: "$", includeZero: false },
      data: [{
            type: "rangeColumn",
            yValueFormatString: "$#,##0.00",
            xValueFormatString: "MMM YYYY",
            toolTipContent: "{x}<br>High: {y[0]}<br>Low: {y[1]}",
            dataPoints: [
                  { x: new Date(2020, 0), y: [27.10, 38.99] },
                  { x: new Date(2020, 1), y: [29.92, 37.00] },
                  { x: new Date(2020, 2), y: [35.95, 42.54] },
                  { x: new Date(2020, 3), y: [37.27, 48.50] },
                  { x: new Date(2020, 4), y: [43.33, 50.51] },
                  { x: new Date(2020, 5), y: [46.69, 52.86] },
                  { x: new Date(2020, 6), y: [41.80, 50.75] },
                  { x: new Date(2020, 7), y: [41.51, 51.22] },
                  { x: new Date(2020, 8), y: [45.09, 50.14] },
                  { x: new Date(2020, 9), y: [47.98, 53.73] },
                  { x: new Date(2020, 10), y: [43.57, 50.49] },
                  { x: new Date(2020, 11), y: [51.51, 57.89] }
            ]
        }]
    }

    return this.getChartDiv(options)
  }

  getChartCard = (aTitle, theChart, minHeight=420) => {
    return (
      <div
        // onClick={() => this.handleShowSeg(tile)}
        key={this.getUniqueKey()}
        className="clickable col-lg-4 col-md-6 col-sm-6 mb-4"
      >
        <div className="stats-small stats-small--1 card card-small">
          <div className="card-body p-0 d-flex" style={{width:'100%', justifyContent:'center', minHeight:420}}>
            <div className="d-flex flex-column" style={{width:'100%', justifyContent:'center', flex:1}}>

                <span
                  className="stats-small__label text-uppercase"
                  style={{marginTop:32, textAlign:'center'}} >
                  {aTitle}
                </span>
              {theChart}
            </div>
          </div>
        </div>
      </div>

    )
  }

  render() {
    const {
      sessionData,
      verified,
      showDemo,
      processing,
      weekly,
      monthly,
    } = this.global;
    console.log({ weekly, monthly });
    const { loadingMessage, showSegmentModal, segmentToShow, showContracts } = this.state;
    const { currentSegments } = sessionData;
    const allTiles = currentSegments ? currentSegments : [];
    const tiles = allTiles.filter(
      (a) => a.showOnDashboard === true || a.showOnDashboard === undefined
    );

    if (showDemo) {
      return <DemoDash />;
    } else {
      return (
        <main className="main-content col-lg-10 col-md-9 col-sm-12 p-0 offset-lg-2 offset-md-3">
          <StickyNav />
          <div className="main-content-container container-fluid px-4">
            <div className="page-header row no-gutters py-4">
              <div className="col-12 col-sm-4 text-center text-sm-left mb-0">
                <span className="text-uppercase page-subtitle">Dashboard</span>
                <h3 className="page-title">
                  App Overview{" "}
                  <span
                    onClick={this.handleRefreshData}
                    className="clickable refresh"
                  >
                    <i className="fas fa-sync-alt"></i>
                  </span>
                </h3>
              </div>
            </div>

            <div className="row">
                <div className="col-12 col-sm-4 text-center text-sm-left mb-0">
                  <h3 className="page-title">
                    Smart Contract Monitoring{" "}
                  </h3>
                </div>
            </div>

            <div className="row">

                <div
                  onClick={() => this.handleShowContracts()}
                  key={this.getUniqueKey()}
                  className="clickable col-lg-4 col-md-6 col-sm-6 mb-4"
                >
                  <div className="stats-small stats-small--1 card card-small">
                    <div className="card-body p-0 d-flex">
                      <div className="d-flex flex-column m-auto">
                        <div className="stats-small__data text-center">
                          <span className="stats-small__label text-uppercase">
                            Contracts
                          </span>
                          <h6 className="stats-small__value count my-3">
                            2
                          </h6>
                        </div>
                        <div className="stats-small__data">
                          {/*<span className="stats-small__percentage stats-small__percentage--increase">4.7%</span>*/}
                        </div>
                      </div>
                      <canvas
                        height="120"
                        className="blog-overview-stats-small-1"
                      ></canvas>
                    </div>
                  </div>
                </div>

                <div
                  // onClick={() => this.handleShowSeg(tile)}
                  key={this.getUniqueKey()}
                  className="clickable col-lg-4 col-md-6 col-sm-6 mb-4"
                >
                  <div className="stats-small stats-small--1 card card-small">
                    <div className="card-body p-0 d-flex">
                      <div className="d-flex flex-column m-auto">
                        <div className="stats-small__data text-center">
                          <span className="stats-small__label text-uppercase">
                            Proxy Wallets
                          </span>
                          <h6 className="stats-small__value count my-3">
                            2182
                          </h6>
                        </div>
                        <div className="stats-small__data">
                          {/*<span className="stats-small__percentage stats-small__percentage--increase">4.7%</span>*/}
                        </div>
                      </div>
                      <canvas
                        height="120"
                        className="blog-overview-stats-small-1"
                      ></canvas>
                    </div>
                  </div>
                </div>

            </div>



            <div className="row">
                <div className="col-12 col-sm-4 text-center text-sm-left mb-0">
                  <h3 className="page-title">
                    Insights{" "}
                  </h3>
                </div>
            </div>

            <div className="row">

                {this.getChartCard('Source Breakdown', this.getNotCrappyDonutChart())}

                {this.getChartCard('Wallet Interactions vs Total Value Locked In (Top 20)',
                                    (<Image className="sid-logo" src={require('../assets/img/wallet-interactions.jpg')} alt="Data coming soon..." />))}

                {this.getChartCard('Value Locked In CDPs',
                                   (<Image className="sid-logo" src={require('../assets/img/cdp-value.jpg')} alt="Data coming soon..." />))}



            </div>



            <div className="row">
                <div className="col-12 col-sm-4 text-center text-sm-left mb-0">
                  <h3 className="page-title">
                    Segments{" "}
                  </h3>
                </div>
            </div>

            <div className="row">


              {tiles.map((tile) => {
                return (
                  <div
                    onClick={() => this.handleShowSeg(tile)}
                    key={tile.id}
                    className="clickable col-lg-4 col-md-6 col-sm-6 mb-4"
                  >
                    <div className="stats-small stats-small--1 card card-small">
                      <div className="card-body p-0 d-flex">
                        <div className="d-flex flex-column m-auto">
                          <div className="stats-small__data text-center">
                            <span className="stats-small__label text-uppercase">
                              {tile.name}
                            </span>
                            <h6 className="stats-small__value count my-3">
                              {tile.userCount ? tile.userCount : 0}
                            </h6>
                          </div>
                          <div className="stats-small__data">
                            {/*<span className="stats-small__percentage stats-small__percentage--increase">4.7%</span>*/}
                          </div>
                        </div>
                        <canvas
                          height="120"
                          className="blog-overview-stats-small-1"
                        ></canvas>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {tiles.length > 0 ? (
              <div></div>
            ) : (
              <div>
                <p>
                  Looks like we don't have enough data to display yet.{" "}
                  {verified ? (
                    <span>
                      But the good news is{" "}
                      <strong>
                        <u>your application is properly configured</u>
                      </strong>{" "}
                      with the SimpleID SDK.
                    </span>
                  ) : (
                    <span>
                      Let's get you connected to the SimpleID SDK so that we can
                      start receiving data.{" "}
                      <a
                        href="https://docs.simpleid.xyz"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <button className="a-el-fix">Connect</button>
                      </a>
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          <Modal
            className="custom-modal"
            show={showContracts}
            onHide={() =>
              this.setState({ showContracts: false })
            }
          >
            <Modal.Header closeButton>
              <Modal.Title>Monitored Smart Contracts</Modal.Title>
            </Modal.Header>
            <Modal.Body>
            <Table responsive>
              <thead>
                <tr>
                  <th>Contract</th>
                  <th>Address</th>
                  <th>Wallet Count</th>
                </tr>
              </thead>
              <tbody>
              <tr key={this.getUniqueKey()}>
                <td title="OasisDEX Smart Contract"><a href="https://etherscan.io/address/0x794e6e91555438afc3ccf1c5076a74f42133d08d" target="_blank" rel="noopener noreferrer">OasisDEX</a></td>
                <td title="0x794e6e91555438aFc3ccF1c5076A74F42133d08D"><a href="https://etherscan.io/address/0x794e6e91555438afc3ccf1c5076a74f42133d08d" target="_blank" rel="noopener noreferrer">0x794e...d08D</a></td>
                <td>1687</td>
              </tr>
              <tr key={this.getUniqueKey()}>
                <td title="InstaDApp Registry Smart Contract"><a href="https://etherscan.io/address/0x498b3BfaBE9F73db90D252bCD4Fa9548Cd0Fd981" target="_blank" rel="noopener noreferrer">InstaDApp</a></td>
                <td title="0x498b3BfaBE9F73db90D252bCD4Fa9548Cd0Fd981"><a href="https://etherscan.io/address/0x498b3BfaBE9F73db90D252bCD4Fa9548Cd0Fd981" target="_blank" rel="noopener noreferrer">0x498...d981</a></td>
                <td>495</td>
              </tr>
              </tbody>
            </Table>
            </Modal.Body>
            <Modal.Footer>
              <button
                className="btn btn-secondary"
                onClick={() => this.setState({ showContracts: false }) } >
                Close
              </button>
            </Modal.Footer>
          </Modal>


          <Modal
            className="custom-modal"
            show={showSegmentModal}
            onHide={() =>
              this.setState({ showSegmentModal: false, segmentToShow: {} })
            }
          >
            <Modal.Header closeButton>
              <Modal.Title>{segmentToShow.name}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <SegmentTable seg={segmentToShow} />
            </Modal.Body>
            <Modal.Footer>
              <button
                className="btn btn-secondary"
                onClick={() =>
                  this.setState({ showSegmentModal: false, segmentToShow: {} })
                }
              >
                Close
              </button>
            </Modal.Footer>
          </Modal>

          <Modal className="custom-modal" show={processing}>
            <Modal.Body>
              <LoadingModal messageToDisplay={`${loadingMessage}...`} />
            </Modal.Body>
          </Modal>
        </main>
      );
    }
  }
}
