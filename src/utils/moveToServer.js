import { getGlobal, setGlobal } from 'reactn'

const processABI = (data) => {
  let events = []
  let functions = []
  let contract = ''
  if (data) {
    const { result } = data
    if (result && result[0]) {
      const { ABI, ContractName } = result[0]
      const abi = JSON.parse(ABI)
      console.log('**************************************')
      console.log('Contract Name: ', ContractName)
      console.log('**************************************')
      // console.log('Triggers:')
      abi.forEach(el => {
        const { type, name } = el
        if (type === 'event') {
          console.log('\t -    Event: ', name)
          events.push(name)
        }
        else if (type === 'function') {
          console.log('\t + Function: ', name)
          functions.push(name)
        }
      })
      contract = ContractName
    }
  }
  return {contract, events, functions}
}

export const getAbiInformation = async (address) => {
  // Test App - Development
  const apiKey = 'TFH1FH518ZXCXQ5854IJDMIRB3EG2G13BG'
  const url = `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`
  const result = await fetch(url)
  const data = await result.json()
  const { contract, events, functions } = processABI(data)
  let { abiInformation } = await getGlobal();
  if (!abiInformation) {
    abiInformation = []
  }
  abiInformation[contract] = {contract, address, events, functions}
  await setGlobal({ abiInformation })
}
