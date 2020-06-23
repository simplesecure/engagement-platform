import React from "reactn"
import SideNav from './SideNav';
import StickyNav from "./StickyNav"
import DemoDash from "./DemoDash"
import Modal from "react-bootstrap/Modal"
import LoadingModal from "./LoadingModal"
import SegmentTable from "./SegmentTable"
import { getCloudUser } from "../utils/cloudUser"
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

import { Dialog } from 'evergreen-ui'
import Chart from "react-google-charts"
import {
  Dimmer,
  Loader,
  Header,
  Icon,
  Button,
  Segment
} from 'semantic-ui-react'

export default class Dashboard extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      loadingMessage: "",
      showSegmentModal: false,
      segmentToShow: {},
      active: true
    }
    this.uniqueEleKey = Date.now()
  }

  getUniqueKey() {
    return this.uniqueEleKey++
  }

  handleRefreshData = async () => {
    toast.success("Refreshing Dashboard Data...", {
      position: toast.POSITION.TOP_RIGHT,
      autoClose: 2000,
    })
    getCloudUser().fetchOrgDataAndUpdate()
  }

  handleShowSeg = (seg) => {
    this.setState({ segmentToShow: seg, showSegmentModal: true })
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
            pieSliceText: 'label',
            legend: 'none',
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
    //   title: "Wallet Interactions vs Total Value Locked in Oasis - Top 20",
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
  handleShow = () => this.setState({ active: true })
  handleHide = () => this.setState({ active: false })
  render() {
    const {
      sessionData,
      verified,
      showDemo,
      processing,
      weekly,
      monthly,
    } = this.global
    const { loadingMessage, showSegmentModal, segmentToShow, active } = this.state
    const { currentSegments } = sessionData
    const allTiles = currentSegments ? currentSegments : []
    const tiles = allTiles.filter(
      (a) => a.showOnDashboard === true || a.showOnDashboard === undefined
    )
    if (showDemo) {
      return <DemoDash />
    } else {
      return (
        <div>
          <SideNav />
          <main className="main-content col-lg-10 col-md-9 col-sm-12 p-0 offset-lg-2 offset-md-3">
            <div className="main-content-container container-fluid px-4">
              <div className="row no-gutters py-4">
                <div className="col-12 col-sm-4 text-center text-sm-left mb-0">
                  <h2 className="page-title">
                    {sessionData.project_name}{"  "}
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
                    Real-Time Monitoring {" "}
                  </h3>
                  <br />
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
                      </div>
                    </div>
                  </div>
                </div>
                <div
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
                            473
                          </h6>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Dimmer.Dimmable dimmed={0}>
                <div className="row">
                  <div className="col-12 col-sm-4 text-center text-sm-left mb-0">
                    <h3 className="page-title">
                      Product Insights{" "}
                    </h3>
                    <br />
                  </div>
                </div>
                <div className="row">
                  {this.getChartCard('Proxy Wallet Sources Of Money', this.getNotCrappyDonutChart())}

                  {this.getChartCard('Wallet Interactions vs Total Value Locked In (Top 20)',
                                     this.getBubbleChart())}
                  {this.getChartCard('Value Locked In Smart Contracts',
                                     this.getCandleStickChart())}
                </div>
                <Dimmer active={0} onClickOutside={this.handleHide}>
                  <Header as='h2' icon inverted>
                    <Icon name='chart line' />
                    Example charts, will reflect your smart contract after integration
                  </Header>
                </Dimmer>
              </Dimmer.Dimmable>
            </div>
            <Dialog
              isShown={showSegmentModal}
              title={segmentToShow.name}
              onCloseComplete={() => this.setState({ showSegmentModal: false, segmentToShow: {} })}
              hasCancel={false}
              confirmLabel='Close'
              width={640}
            >
              <SegmentTable seg={segmentToShow} />
            </Dialog>
            <Dimmer active={processing}>
              <Loader inline='centered' indeterminate>{`${loadingMessage}...`}</Loader>
            </Dimmer>
            <br />
          </main>
        </div>
      )
    }
  }
}
