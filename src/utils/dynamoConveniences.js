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

  const projectionExpression = "app_to_enc_uuid_map_v2, app_to_enc_uuid_map"

  const rawDataResults = await tableBatchGet(
    process.env.REACT_APP_UUID_TABLE, arrOfKeyValuePairs, projectionExpression)

  let walletToUuids = undefined
  try {
    walletToUuids = rawDataResults.Responses[process.env.REACT_APP_UUID_TABLE]
  } catch (error) {
    throw new Error(`Unable to access wallet to UUID maps in db response.\n${error}`);
  }
  return walletToUuids
}
