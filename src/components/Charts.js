import React from "reactn"
import Chart from "react-google-charts"
import {
  Avatar,
  Table,
  Text
} from 'evergreen-ui'
import uuid from 'uuid/v4'
import RetentionChart from './RetentionChart'
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

export const getCustomChart = (contractName, currentContractAddr, monitoring, customChartData) => {
  let addr = currentContractAddr
  const wei = 0.000000000000000001
  const gwei = 0.00000001
  if (addr === '') {
    addr = Object.keys(monitoring)[0]
  }
  let data = null
  if (customChartData && customChartData[addr])
    data = customChartData[addr].data
  let idx1 = contractName.indexOf('(') + 1
  let idx2 = contractName.indexOf(')')
  let assetType = (idx1 > -1 && idx2 > idx1) ? contractName.substring(idx1, idx2) : null
  if (data) {
    let aTitle = customChartData[addr].title + '(' + assetType + ')'
    return (
      <div className="col-lg-6 col-md-6 col-sm-6 mb-4">
        <div className="stats-small stats-small--1 card card-small">
          <span
            className="text-uppercase"
            style={{marginTop: 32, marginBottom: 12, textAlign: 'center', fontWeight: 'bold'}} >
            {aTitle}
          </span>
          <div style={{width:'100%', justifyContent:'center'}}>
            <Table>
              <Table.Head>
                <Table.TextHeaderCell>
                  Wallet Address
                </Table.TextHeaderCell>
                <Table.TextHeaderCell>
                  {`# of Tokens (${assetType})`}
                </Table.TextHeaderCell>
              </Table.Head>
              <Table.Body height={300}>
                {data.map(wallet => (
                  <Table.Row key={wallet.address} isSelectable onSelect={() => window.open(`https://etherscan.io/address/${wallet.address}`, "_blank")}>
                    <Table.TextCell isNumber>
                      <Avatar name={wallet.address.substr(2, 2)} />
                      {wallet.address}
                    </Table.TextCell>
                    <Table.TextCell isNumber>
                      {`${(Math.round(parseInt(wallet.amount)*wei)).toLocaleString()}`}
                    </Table.TextCell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        </div>
      </div>
    )
  } else return null
}

export const getRetentionChart = (contractName, currentContractAddr, monitoring, retentionForContract) => {
  let addr = currentContractAddr
  if (addr === '') {
    addr = Object.keys(monitoring)[0]
  }
  let data = null
  if (retentionForContract && retentionForContract[addr])
    data = retentionForContract[addr]
  let idx1 = contractName.indexOf('(') + 1
  let idx2 = contractName.indexOf(')')
  let assetType = (idx1 > -1 && idx2 > idx1) ? contractName.substring(idx1, idx2) : null
  if (data && data.length === 6) {
    let aTitle = 'Weekly Retention Table: ' + contractName
    return (
      <div className="col-lg-6 col-md-12 col-sm-12 mb-4">
        <div className="card">
          <span
            className="text-uppercase"
            style={{marginTop: 32, marginBottom: 12, textAlign: 'center', fontWeight: 'bold'}} >
            {aTitle}
          </span>
          <RetentionChart retentionData={retentionForContract[addr]}/>
        </div>
      </div>
    )
  } else return null
}

export const getRetentionLineChart = (contractName, currentContractAddr, monitoring, retentionForContract) => {
  let addr = currentContractAddr
  if (addr === '') {
    addr = Object.keys(monitoring)[0]
  }
  let data = null
  if (retentionForContract && retentionForContract[addr])
    data = retentionForContract[addr]
  let idx1 = contractName.indexOf('(') + 1
  let idx2 = contractName.indexOf(')')
  let assetType = (idx1 > -1 && idx2 > idx1) ? contractName.substring(idx1, idx2) : null
  if (data && data.length === 6) {
    let aTitle = 'Weekly Retention Chart: ' + contractName
    const options = {
      legend: { position: "bottom"}
    }
    const dataArray = []
    let formatData = []
    for (let i = 0; i < data.length; i++) {
      formatData.push(parseFloat(data[0][`Week ${i+1}`]))
      formatData.push(parseFloat(data[1][`Week ${i+1}`]))
      formatData.push(parseFloat(data[2][`Week ${i+1}`]))
      formatData.push(parseFloat(data[3][`Week ${i+1}`]))
      formatData.push(parseFloat(data[4][`Week ${i+1}`]))
      formatData.push(parseFloat(data[5][`Week ${i+1}`]))
      if (formatData.length === 6) {
        dataArray.push(formatData)
        formatData = []
      }
    }
    const chartData = [
      [
        'Weeks',
        Object.values(data[0])[0],
        Object.values(data[1])[0],
        Object.values(data[2])[0],
        Object.values(data[3])[0],
        Object.values(data[4])[0],
        Object.values(data[5])[0],
      ],
      [0, ...Array(6).fill(100)],
      [1, ...dataArray[0]],
      [2, ...dataArray[1]],
      [3, ...dataArray[2]],
      [4, ...dataArray[3]],
      [5, ...dataArray[4]],
      [6, ...dataArray[5]]
    ]
    return (
      <div
        key={uuid()}
        className="col-lg-6 col-md-12 col-sm-12 mb-4"
      >
        <div className="stats-small stats-small--1 card card-small">
          <div className="card-body p-0 d-flex" style={{width:'100%', justifyContent:'center', minHeight:500}}>
            <div className="d-flex flex-column" style={{width:'100%', justifyContent:'center', flex:1}}>
              <span
                className="text-uppercase"
                style={{marginTop: 32, marginBottom: 12, textAlign: 'center', fontWeight: 'bold'}} >
                {aTitle}
              </span>
              <Chart
                height="100%"
                width="100%"
                chartType="Line"
                loader={<Spinner name="circle" color="blue"/>}
                data={chartData}
                options={options}
              />
            </div>
          </div>
        </div>
      </div>
    )
  } else return null
}

export const getTopAssets = (aTitle, currentContractAddr, monitoring, topAssetsByContract) => {
  let addr = currentContractAddr
  if (addr === '') {
    addr = Object.keys(monitoring)[0]
  }
  let data = null
  if (topAssetsByContract)
    data = topAssetsByContract[addr]
  if (data) {
    // Create items array
    var items = Object.keys(data).map(function(key) {
      return [key, parseFloat(data[key])];
    })
    // Sort the array based on the second element
    items.sort(function(first, second) {
      return second[1] - first[1];
    })
    return (
      <div className="col-lg-6 col-md-6 col-sm-6 mb-4">
        <div className="stats-small stats-small--1 card card-small">
          <span
            className="text-uppercase"
            style={{marginTop: 32, marginBottom: 12, textAlign: 'center', fontWeight: 'bold'}} >
            {aTitle}
          </span>
          <div style={{width:'100%', justifyContent:'center'}}>
            <Table>
              <Table.Head>
                <Table.TextHeaderCell>
                  Token Type
                </Table.TextHeaderCell>
                <Table.TextHeaderCell>
                  # of Tokens
                </Table.TextHeaderCell>
              </Table.Head>
              <Table.Body height={300}>
                {items.map(it => (
                  <Table.Row key={it[0]}>
                    <Table.TextCell>
                      <Avatar name={it[0].substr(0, 2)} />
                      {it[0].toUpperCase()}
                    </Table.TextCell>
                    <Table.TextCell isNumber>
                      {it[1].toLocaleString()}
                    </Table.TextCell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        </div>
      </div>
    )
  } else return null
}

export const getTop50Wallets = (aTitle, contractName, currentContractAddr, monitoring, tokenTop50Wallets, customChartData) => {
  let addr = currentContractAddr
  const wei = 0.000000000000000001
  const gwei = 0.00000001
  let conv = wei
  if (addr === '') {
    addr = Object.keys(monitoring)[0]
  }
  let data = null
  if (customChartData && customChartData[addr])
    conv = gwei
  if (tokenTop50Wallets)
    data = tokenTop50Wallets[addr]
  let idx1 = contractName.indexOf('(') + 1
  let idx2 = contractName.indexOf(')')
  let assetType = (idx1 > -1 && idx2 > idx1) ? `(${contractName.substring(idx1, idx2)})` : ``
  if (data) {
    return (
      <div className="col-lg-6 col-md-6 col-sm-6 mb-4">
        <div className="stats-small stats-small--1 card card-small">
          <span
            className="text-uppercase"
            style={{marginTop: 32, marginBottom: 12, textAlign: 'center', fontWeight: 'bold'}} >
            {`${aTitle} ${assetType}`}
          </span>
          <div style={{width:'100%', justifyContent:'center'}}>
            <Table>
              <Table.Head>
                <Table.TextHeaderCell>
                  Wallet Address
                </Table.TextHeaderCell>
                <Table.TextHeaderCell>
                  {`# of ${assetType} Tokens`}
                </Table.TextHeaderCell>
              </Table.Head>
              <Table.Body height={300}>
                {data.map(wallet => (
                  <Table.Row key={wallet.address} isSelectable onSelect={() => window.open(`https://etherscan.io/address/${wallet.address}`, "_blank")}>
                    <Table.TextCell isNumber>
                      <Avatar name={wallet.address.substr(2, 2)} />
                      {wallet.address}
                    </Table.TextCell>
                    <Table.TextCell isNumber>
                      {`${(Math.round(parseInt(wallet.amount)*conv)).toLocaleString()}`}
                    </Table.TextCell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        </div>
      </div>
    )
  } else return null
}

export const getMvp30BubbleChart = (aTitle, currentContractAddr, monitoring) => {
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
    <div className="d-flex flex-column" style={{width:'100%', justifyContent:'center', flex:1}}>
      <span
        className="text-uppercase"
        style={{marginTop: 32, textAlign: 'center', fontWeight: 'bold'}} >
        {aTitle}
      </span>
      <div style={{flex:1, width:'100%'}}>
        <Chart
          loader={<Spinner name="circle" color="blue"/>}
          chartType="BubbleChart"
          height="100%"
          data={data}
          options={options}
        />
      </div>
    </div>
  )
}

export const getMvpAllBubbleChart = (aTitle, currentContractAddr, monitoring) => {
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
    <div className="d-flex flex-column" style={{width:'100%', justifyContent:'center', flex:1}}>
      <span
        className="text-uppercase"
        style={{marginTop: 32, textAlign: 'center', fontWeight: 'bold'}} >
        {aTitle}
      </span>
      <div style={{flex:1, width:'100%'}}>
        <Chart
          loader={<Spinner name="circle" color="blue"/>}
          chartType="BubbleChart"
          height="100%"
          data={data}
          options={options}
        />
      </div>
    </div>
  )
}

export const getMonitoredEventChart = (aTitle, currentContractAddr, monitoring, eventData, tokenData, customChartData) => {
  if (!eventData) return null
  let addr = ''
  if (currentContractAddr === '') {
    addr = Object.keys(monitoring)[0]
  } else {
    addr = currentContractAddr
  }
  const idx = Object.keys(tokenData).find(key => addr === tokenData[key].address)
  if (idx > -1 ) {
    if (customChartData && !customChartData[addr])
      return null
  }
  const eventCount = eventData[addr]
  if (!eventCount) return null
  const data = [
    [
      'Event Name',
      'Count of times invoked'
    ]
  ]
  eventCount.forEach(idx => {
    data.push([Object.keys(idx)[0], parseFloat(Object.values(idx)[0])])
  })
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
    <div
      key={uuid()}
      className="col-lg-6 col-md-6 col-sm-6 mb-4"
    >
      <div className="stats-small stats-small--1 card card-small">
        <div className="card-body p-0 d-flex" style={{width:'100%', justifyContent:'center', minHeight:395}}>
          <div className="d-flex flex-column" style={{width:'100%', justifyContent:'center', flex:1}}>
            <span
              className="text-uppercase"
              style={{marginTop: 32, textAlign: 'center', fontWeight: 'bold'}} >
              {aTitle}
            </span>
            <Chart
              loader={<Spinner name="circle" color="blue"/>}
              width="100%"
              height="100%"
              chartType="Bar"
              data={data}
              options={options}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export const get7DayChart = (aTitle, currentContractAddr, monitoring) => {
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
    <div className="d-flex flex-column" style={{width:'100%', justifyContent:'center', flex:1}}>
      <span
        className="text-uppercase"
        style={{marginTop: 32, textAlign: 'center', fontWeight: 'bold'}} >
        {aTitle}
      </span>
      <Chart
        loader={<Spinner name="circle" color="blue"/>}
        width="100%"
        height="100%"
        chartType="BarChart"
        data={data}
        options={options}
      />
    </div>
  )
}

export const getMonthChart = (aTitle, currentContractAddr, monitoring) => {
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
    <div className="d-flex flex-column" style={{width:'100%', justifyContent:'center', flex:1}}>
      <span
        className="text-uppercase"
        style={{marginTop: 32, textAlign: 'center', fontWeight: 'bold'}} >
        {aTitle}
      </span>
      <Chart
        loader={<Spinner name="circle" color="blue"/>}
        width="100%"
        height="100%"
        chartType="BarChart"
        data={data}
        options={options}
      />
    </div>
  )
}

export const getChartCard = (theChart, minHeight=420) => {
  return (
    <div
      key={uuid()}
      className="col-lg-6 col-md-6 col-sm-6 mb-4"
    >
      <div className="stats-small stats-small--1 card card-small">
        <div className="card-body p-0 d-flex" style={{width:'100%', justifyContent:'center', minHeight:420}}>
          {theChart}
        </div>
      </div>
    </div>
  )
}
