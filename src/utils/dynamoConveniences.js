import { tableBatchGet } from './dynamoBasics.js'

export async function walletToUuidMapTableGetUuids(anArrayOfWalletAddrs) {
  if (!anArrayOfWalletAddrs) {
    throw new Error(`DB access method walletToUuidMapTableGetUuids requires a value for anArrayOfWalletAddrs.\nanArrayOfWalletAddrs=${anArrayOfWalletAddrs}`)
  }

  const arrOfKeyValuePairs = []
  for (const walletAddress of anArrayOfWalletAddrs) {
    arrOfKeyValuePairs.push({
      [ process.env.REACT_APP_UUID_TABLE_PK ] : walletAddress
    })
  }

  const rawDataResults =
    await tableBatchGet(process.env.REACT_APP_UUID_TABLE, arrOfKeyValuePairs)

  let walletToUuids = undefined
  try {
    walletToUuids = rawDataResults.Responses[process.env.REACT_APP_UUID_TABLE]
  } catch (error) {
    throw new Error(`Unable to access wallet to UUID maps in db response.\n${error}`);
  }
  return walletToUuids
}
