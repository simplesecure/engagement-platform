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
              height: '85%'
            }
          }}
        />
      </div>
    );
  }

  getBubbleChart = () => {
    const data = [
      ["ID", "Wallet Interactions", "Eth in Oasis", "Address", "Total Eth in Wallet"],
      ["0x123", 80.66, 93400, "Oasis", 33739900],
      ["0x321", 79.84, 300033, "InstaDapp", 81902307],
      ["0x457", 78.6, 52000, "Kyber", 5523095],
      ["0x623", 72.73, 172000, "Kyber", 79716203],
      ["0x989", 80.05, 155000, "Aave", 61801570],
      ["0x113", 72.49, 345000, "InstaDapp", 73137148],
      ["0x543", 68.09, 70000, "Kyber", 31090763],
      ["0x080", 81.55, 50000, "Oasis", 7485600],
      ["0x139", 68.6, 220000, "Oasis", 141850000],
      ["0x776", 78.09, 380000, "Aave", 307007000]
    ];

    const options = {
    //   title: "Wallet Interactions vs Total Value Locked in Oasis - Top 20",
      hAxis: { title: "Wallet Interacations" },
      vAxis: { title: "Assets in Oasis ($)" },
      bubble: { textStyle: { fontSize: 11 } },
      legend: {
        position: 'top'
      },
      chartArea: {
        top: '10%',
        left: '20%',
        width: '70%',
        height: '70%'
      },
      bubble: {
        textStyle: {color: 'none'}
      }
    };

    return (
      <div style={{flex:1, width:'100%'}}>
        <Chart
          chartType="BubbleChart"
          height="100%"
          data={data}
          options={options}
        />
      </div>
    )
  }

  getCandleStickChart = () => {
    const data = [
      [
        {
          type: "string",
          id: "Date"
        },
        {
          type: "number",
          label: "Something"
        },
        {
          type: "number",
          label: "Something"
        },
        {
          type: "number",
          label: "Something"
        },
        {
          type: "number",
          label: "Something"
        }
      ],
      ["Jan", 20, 28, 38, 45],
      ["Feb", 31, 38, 55, 66],
      ["Mar", 50, 55, 77, 80],
      ["Apr", 77, 77, 66, 50],
      ["May", 68, 66, 22, 15],
      ["Jun", 22, 42, 86, 100]
    ]

    const options = {
      // title: "Value locked in CDPs",
      vAxis: { title: "Assets in Millions ($)" },
      legend: 'none',
      bar: { groupWidth: '90%' }, // Remove space between bars.
      candlestick: {
        fallingColor: { strokeWidth: 0, fill: '#a52714' }, // red
        risingColor: { strokeWidth: 0, fill: '#0f9d58' }, // green
      },
      chartArea: {
        top: '10%',
        left: '20%',
        width: '70%',
        height: '70%'
      }
    }

    return (
      <Chart
         chartType="CandlestickChart"
         width="100%"
         height="100%"
         data={data}
         options={options} />
    )
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
            {/*<div className="page-header row no-gutters py-4">*/}
            <div className="row no-gutters py-4">
              <div className="col-12 col-sm-4 text-center text-sm-left mb-0">
                {/*<span className="text-uppercase page-subtitle">Dashboard</span>*/}
                <h2 className="page-title">
                  {sessionData.project_name}{"  "}
{/*                  App Overview{" "}*/}
                  <span
                    onClick={this.handleRefreshData}
                    className="clickable refresh"
                  >
                    <i className="fas fa-sync-alt" style={{fontSize:21}}></i>
                  </span>
                </h2>
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
                            Your plan
                          </span>
                          <h6 className="stats-small__value count my-3">
                            Enterprise
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
                                   this.getBubbleChart())}
                {this.getChartCard('Value Locked In CDPs',
                                   this.getCandleStickChart())}

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
