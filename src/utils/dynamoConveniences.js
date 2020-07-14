import { tableGet, tableBatchGet, tablePut } from './dynamoBasics.js'
import * as s3Utils from './s3Utils.js'
import * as misc from './misc.js'
import { getLog } from './debugScopes.js'

const log = getLog('dynamoConveniences')

const S3_ORG_DATA_USERS_BLOBS = true

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
  const method = 'organizationDataTableGet'

  if (!anOrgId) {
    throw new Error(`DB access method organizationDataTableGet requires a value for anOrgId.  anOrgId="${anOrgId}".`)
  }

  const data = await tableGet(
    process.env.REACT_APP_ORG_TABLE,
    process.env.REACT_APP_ORG_TABLE_PK,
    anOrgId
  )

  // With S3_ORG_DATA_USERS_BLOBS turned on--the users property for any segments
  // that have property users_s3 will be empty.  We may need to re-inflate that
  // with a read from S3 here (however, before doing that, it's likely that the
  // server will do that for us on update segments).
  // For safety, we're just going to restore that here, but if testing shows
  // it's not needed then lets disable this:  <-- TODO (maybe)
  if (S3_ORG_DATA_USERS_BLOBS) {
    try {
      log.debug(`${method} expanding stored blobs for org data (id=${anOrgId})`)
      const startTime = Date.now()
      let blobsProcessed = 0

      const orgDataRowObj = data.Item
      for (const appId in orgDataRowObj.apps) {
        const app = orgDataRowObj.apps[appId]
        if(app && app.currentSegments) {
          for (const seg of app.currentSegments) {
            const { users_s3 } = seg
            const hasBlob = !!users_s3
            if (hasBlob) {
              try {
                const usersBlob = await s3Utils.getJsonObject(users_s3.s3_key, users_s3.compressed)
                blobsProcessed++
                seg.users = usersBlob
              } catch (blobFetchError) {
                log.error(`${method} failed to fetch blob.\n` +
                          `${JSON.stringify(users_s3, 0, 2)}\n` +
                          `${blobFetchError}`)
              }
            }
          }
        }
      }
      log.debug(`${method} expanded ${blobsProcessed} in ${Date.now()-startTime} ms.`)
    } catch (error) {
      throw new Error(`${method} failed while expanding blobs.\n${error}`)
    }
  }

  return data
}

export async function organizationDataTablePut(aOrganizationDataRowObj) {
  const method = 'organizationDataTablePut'

  if (!aOrganizationDataRowObj) {
    throw new Error(`DB access method organizationDataTablePut requires a value for aOrganizationDataRowObj.  aOrganizationDataRowObj=${aOrganizationDataRowObj}".`)
  }

  let orgDataRowObj
  if (S3_ORG_DATA_USERS_BLOBS) {
    // The property users in segments grows too large for storage in Dynamo. This
    // conditional detects if we have s3 storage of the users property and clears
    // it before writing to Dynamo (since it's stored in S3).

    // Copy the object to prevent side effects on the client which may be using
    // properties we're about to blow away:
    try {
      orgDataRowObj = misc.deepCopy(aOrganizationDataRowObj)
      for (const appId in orgDataRowObj.apps) {
        const app = orgDataRowObj.apps[appId]
        if(app && app.currentSegments) {
          for (const seg of app.currentSegments) {
            if (seg.hasOwnProperty('users_s3')) {
              seg.users = []
            }
          }
        }
      }
    } catch (error) {
      throw new Error(`${method} failed to trim segment data stored in blobs.\n${error}`)
    }
  } else {
    orgDataRowObj = aOrganizationDataRowObj
  }

  return await tablePut(
    process.env.REACT_APP_ORG_TABLE,
    orgDataRowObj
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
