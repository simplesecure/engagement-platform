import { tableGet, tableBatchGet, tablePut } from './dynamoBasics.js'

export async function walletAnalyticsDataTableGet(anAppId) {
  if (!anAppId) {
    throw new Error(`DB access method walletAnalyticsDataTableGet requires a value for anAppId.  anAppId="${anAppId}".`)
  }

  return await tableGet(
    process.env.REACT_APP_AD_TABLE,
    process.env.REACT_APP_AD_TABLE_PK,
    anAppId
  )
}

export async function walletAnalyticsDataTablePut(aWalletAnalyticsRowObj) {
  if (!aWalletAnalyticsRowObj) {
    throw new Error(`DB access method walletAnalyticsDataTablePut requires a value for aWalletAnalyticsRowObj.  aWalletAnalyticsRowObj=${aWalletAnalyticsRowObj}".`)
  }

  return await tablePut(
    process.env.REACT_APP_AD_TABLE,
    aWalletAnalyticsRowObj
  )
}

export async function organizationDataTableGet(anOrgId) {
  if (!anOrgId) {
    throw new Error(`DB access method organizationDataTableGet requires a value for anOrgId.  anOrgId="${anOrgId}".`)
  }

  return await tableGet(
    process.env.REACT_APP_ORG_TABLE,
    process.env.REACT_APP_ORG_TABLE_PK,
    anOrgId
  )
}

export async function organizationDataTablePut(aOrganizationDataRowObj) {
  if (!aOrganizationDataRowObj) {
    throw new Error(`DB access method organizationDataTablePut requires a value for aOrganizationDataRowObj.  aOrganizationDataRowObj=${aOrganizationDataRowObj}".`)
  }

  return await tablePut(
    process.env.REACT_APP_ORG_TABLE,
    aOrganizationDataRowObj
  )
}

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
