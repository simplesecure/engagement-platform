import React from "reactn"
import Chart from "react-google-charts"
var Spinner = require('react-spinkit')

export const getDonutChart = (contracts) => {
  let data = [["Contract", "Wallet Percentage"]]
  if (contracts) {
    for (const [key, value] of Object.entries(contracts)) {
      const { contract_name, wallet_count } = value
      data.push([contract_name, parseInt(wallet_count)])
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
export const getMvp30BubbleChart = (currentContractAddr, monitoring) => {
  let addr = currentContractAddr
  const wei = 0.000000000000000001
  if (addr === '') {
    addr = Object.keys(monitoring)[0]
  }
  const walletData = monitoring[addr].mvp_30d_wallets
  let data = [
    ["ID", "Eth in Wallet", "TX Last Month", "Address", "Eth in Wallet"]
  ]
  Object.entries(walletData).map(([key, value]) => {
    const { address, ethereum, transactions_last_30d } = value
    const ethValue = ethereum * wei
    data.push([address.substr(0, 5), parseInt(ethValue), parseInt(transactions_last_30d), address, parseInt(ethValue)])
  })
  const options = {
  //   title: "Wallet Interactions vs Total Value Locked in Oasis - Top 20",
    hAxis: { title: "Assets in Wallet (Eth)" },
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

export const getMvpAllBubbleChart = (currentContractAddr, monitoring) => {
  let addr = currentContractAddr
  const wei = 0.000000000000000001
  if (addr === '') {
    addr = Object.keys(monitoring)[0]
  }
  const walletData = monitoring[addr].mvp_all_time_wallets
  let data = [
    ["ID", "Eth in Wallet", "TX Last Month", "Address", "Eth in Wallet"]
  ]
  Object.entries(walletData).map(([key, value]) => {
    const { address, ethereum, transactions_last_30d } = value
    const ethValue = ethereum * wei
    let txCount = transactions_last_30d ? transactions_last_30d : 0
    data.push([address.substr(0, 5), parseInt(ethValue), parseInt(txCount), address, parseInt(ethValue)])
  })
  const options = {
  //   title: "Wallet Interactions vs Total Value Locked in Oasis - Top 20",
    hAxis: { title: "Assets in Wallet (Eth)" },
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



export const getMonitoredEventChart = (currentContractAddr, monitoring) => {
  let userData
  if (currentContractAddr === '') {
    userData = monitoring[Object.keys(monitoring)[0]].daily_transactions
  } else {
    userData = monitoring[currentContractAddr].daily_transactions
  }
  const data = [
    [
      'Event Name',
      'Count of times invoked'
    ],
    ["Transfer", 75733],
    ["Approval", 39776]
  ]
  const options = {
    legend: { position: 'none' },
    hAxis: { title: "Popular events found in Smart Contract" },
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
      chartType="Bar"
      data={data}
      options={options}
    />
  )
}

export const get7DayChart = (currentContractAddr, monitoring) => {
  let userData
  if (currentContractAddr === '') {
    userData = monitoring[Object.keys(monitoring)[0]].daily_transactions
  } else {
    userData = monitoring[currentContractAddr].daily_transactions
  }
  const daily = [0, 1, 2, 3, 4, 5, 6]
  const dailyData = []
  daily.forEach(idx => {
    let dailyCount = 0
    let dayName = ''
    Object.keys(userData).map((key, index) => {
      if (index === idx) {
        dailyCount = parseInt(userData[key])
        let d = new Date(key)
        let dStr = d.toDateString()
        let year = ' ' + d.getUTCFullYear()
        dayName = dStr.substr(0, dStr.indexOf(year))
      }
    })
    dailyData.push({idx, dayName, dailyCount})
  })
  const data = [
    [
      'Days',
      'Transactions'
    ],
    [dailyData[0].dayName, dailyData[0].dailyCount],
    [dailyData[1].dayName, dailyData[1].dailyCount],
    [dailyData[2].dayName, dailyData[2].dailyCount],
    [dailyData[3].dayName, dailyData[3].dailyCount],
    [dailyData[4].dayName, dailyData[4].dailyCount],
    [dailyData[5].dayName, dailyData[5].dailyCount],
    [dailyData[6].dayName, dailyData[6].dailyCount],
  ]
  const options = {
    legend: { position: 'none' },
    hAxis: { title: "Transacations found in Smart Contract" },
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

export const getMonthChart = (currentContractAddr, monitoring) => {
  let userData
  if (currentContractAddr === '') {
    userData = monitoring[Object.keys(monitoring)[0]].daily_transactions
  } else {
    userData = monitoring[currentContractAddr].daily_transactions
  }
  const weeks = [7, 14, 21, 28]
  const weeklyData = []
  let startIdx = 0
  weeks.forEach(idx => {
    let weeklyCount = 0
    Object.keys(userData).map((key, index) => {
      if (index > startIdx && index < idx) {
        weeklyCount += parseInt(userData[key])
        startIdx = index
      }
    })
    weeklyData.push({idx, weeklyCount})
  })
  const data = [
    [
      'Weeks',
      'Transactions',
      { role: 'style' },
    ],
    ['Week 1', weeklyData[0].weeklyCount, '#4aaa50'],
    ['Week 2', weeklyData[1].weeklyCount, '#e1634d'],
    ['Week 3', weeklyData[2].weeklyCount, '#983b98'],
    ['Week 4', weeklyData[3].weeklyCount, '#feae52']
  ]
  const options = {
    legend: { position: 'none' },
    hAxis: { title: "Transactions found in Smart Contract" },
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
              style={{marginTop: 32, textAlign: 'center', fontWeight: 'bold'}} >
              {aTitle}
            </span>
            {theChart}
          </div>
        </div>
      </div>
    </div>
  )
}
