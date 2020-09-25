import React from "reactn"
import Chart from "react-google-charts"
var Spinner = require('react-spinkit')

export const getDonutChart = (contracts) => {
  let data = [["Frontend", "Wallet Percentage"]]
  if (contracts) {
    for (const [key, value] of Object.entries(contracts)) {
      data.push([key.substring(0, 10), value.wallet_count])
    }
  }
  return (
    <div style={{flex:1, width:'100%'}}>
      <Chart
        loader={<Spinner name="circle" color="blue"/>}
        chartType="PieChart"
        height="100%"
        data={data}
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
  )
}
export const getBubbleChart = () => {
  const data = [
    ["ID", "Eth in Contract", "Wallet Interactions", "Address", "Wallet Size"],
    ["0x192", 8180.66, 300, "0x1929a0454cdd4d925e8fc9b6c366ecd7844866f2", 8180.66],
    ["0xbbb", 7092.84, 833, "0xbbbfc46566e5f0302cef913af8c8f423070ce6a1", 7092.84],
    ["0x011", 5478.60, 223, "0x011ebe45c131e87e187d185b842facad9e8e9dd9", 5478.60],
    ["0x477", 3572.73, 1032, "0x4775e7f9fc258259e88ae6c6c245ad85def7fb3a", 3572.73],
    ["0xaed", 2180.05, 267, "0xaedc687fa5376d2fe9d4b81ebfc8c2ba30ba54ae", 2180.05],
    ["0xdb6", 1372.49, 981, "0xdb6189758f3cc6f0251b938c068a3ed1b0e86569", 1372.49],
    ["0xf13", 1068.09, 123, "0xf1363d3d55d9e679cc6aa0a0496fd85bdfcf7464", 1068.09],
    ["0x28e", 981.55, 813, "0x28e7a475ad492d5f5130c73cf8aeeae85fd79e4c", 981.55],
    ["0x34a", 668.60, 90, "0x34aaa3d5a73d6f9594326d0422ce69748f09b14f", 668.60],
    ["0x3e1", 578.09, 321, "0x3e10048efed71c56bae0c2e8dea106f53fae6422", 578.09]
  ]
  const options = {
  //   title: "Wallet Interactions vs Total Value Locked in Oasis - Top 20",
    hAxis: { title: "Assets in Contract ($)" },
    vAxis: { title: "Wallet Interacations" },
    bubble: { textStyle: { fontSize: 11, color: 'none' } },
    legend: {
      position: 'none'
    },
    chartArea: {
      top: '10%',
      left: '20%',
      width: '70%',
      height: '70%'
    }
  }
  return (
    <div style={{flex:1, width:'100%'}}>
      <Chart
        loader={<Spinner name="circle" color="blue"/>}
        chartType="BubbleChart"
        height="100%"
        data={data}
        options={options}
      />
    </div>
  )
}

export const getCandleStickChart = () => {
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
    vAxis: { title: "Assets in Eth" },
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
     loader={<Spinner name="circle" color="blue"/>}
     chartType="CandlestickChart"
     width="100%"
     height="100%"
     data={data}
     options={options}
    />
  )
}

export const get7DayChart = (activeUsersData) => {
  const data = [
    [
      'Days',
      'Wallets'
    ],
    ['Sun', parseInt(activeUsersData[0]["address_count"])],
    ['Mon', parseInt(activeUsersData[1]["address_count"])],
    ['Tue', parseInt(activeUsersData[2]["address_count"])],
    ['Wed', parseInt(activeUsersData[3]["address_count"])],
    ['Thu', parseInt(activeUsersData[4]["address_count"])],
    ['Fri', parseInt(activeUsersData[5]["address_count"])],
    ['Sat', parseInt(activeUsersData[6]["address_count"])],
  ]
  const options = {
    legend: { position: 'none' },
    hAxis: { title: "Unique wallets found in Smart Contracts" },
    chartArea: {
      top: '10%',
      left: '10%',
      width: '80%',
      height: '70%'
    }
  }
  return (
    <Chart
      loader={<Spinner name="circle" color="blue"/>}
      width="100%"
      height="100%"
      chartType="BarChart"
      data={data}
      options={options}
    />
  )
}

export const getMonthChart = (activeUsersData) => {
  const data = [
    [
      'Weeks',
      'Wallets',
      { role: 'style' },
    ],
    ['Week 1', parseInt(activeUsersData[6]["address_count"]), '#4aaa50'],
    ['Week 2', parseInt(activeUsersData[7]["address_count"]), '#e1634d'],
    ['Week 3', parseInt(activeUsersData[8]["address_count"]), '#983b98'],
    ['Week 4', parseInt(activeUsersData[9]["address_count"]), '#feae52']
  ]
  const options = {
    legend: { position: 'none' },
    hAxis: { title: "Unique wallets found in Smart Contracts" },
    chartArea: {
      top: '10%',
      left: '10%',
      width: '80%',
      height: '70%'
    },
    style: { color: 'green'}
  }
  return (
    <Chart
      loader={<Spinner name="circle" color="blue"/>}
      width="100%"
      height="100%"
      chartType="BarChart"
      data={data}
      options={options}
    />
  )
}

export const getChartCard = (aTitle, theChart, minHeight=420) => {
  return (
    <div
      key={aTitle}
      className="col-lg-6 col-md-6 col-sm-6 mb-4"
    >
      <div className="stats-small stats-small--1 card card-small">
        <div className="card-body p-0 d-flex" style={{width:'100%', justifyContent:'center', minHeight:420}}>
          <div className="d-flex flex-column" style={{width:'100%', justifyContent:'center', flex:1}}>
            <span
              className="text-uppercase"
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
