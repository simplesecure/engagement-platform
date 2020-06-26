import { tableGet, tableBatchGet, tablePut } from './dynamoBasics.js'
import * as s3Utils from './s3Utils.js'
import * as misc from './misc.js'
import { getLog } from './debugScopes.js'

const log = getLog('dynamoConveniences')

const S3_ANALYTICS_BLOB = true
const S3_ORG_DATA_USERS_BLOBS = true


export async function walletAnalyticsDataTableGetImported(anAppId) {
  const method = 'walletAnalyticsDataTableGetImported'

  if (!anAppId) {
    throw new Error(`DB access method ${method} requires a value for anAppId.  anAppId="${anAppId}".`)
  }

  try {
    const tableData = await tableGet(
      process.env.REACT_APP_AD_TABLE,
      process.env.REACT_APP_AD_TABLE_PK,
      anAppId,
      'imported'
    )

    return tableData.Item.imported
  } catch (error) {
    throw new Error(`${method} failed to get imported data for ${anAppId}.\n${error}`)
  }
}

export async function walletAnalyticsDataTableGet(anAppId) {
  const method = 'walletAnalyticsDataTableGet'

  if (!anAppId) {
    throw new Error(`DB access method walletAnalyticsDataTableGet requires a value for anAppId.  anAppId="${anAppId}".`)
  }

  const tableData = await tableGet(
    process.env.REACT_APP_AD_TABLE,
    process.env.REACT_APP_AD_TABLE_PK,
    anAppId
  )

  if (S3_ANALYTICS_BLOB) {
    try {
      const { analytics, analytics_s3 } = tableData.Item
      const hasBlob = !!analytics_s3
      if (hasBlob) {
        // Fetch the S3 Analytics blob ...
        // TODO: need to scope permissions to path db/cust_analytics_data/<app_id>.json.zip
        //
        const analyticsBlob =
          await s3Utils.getJsonObject(analytics_s3.s3_key, analytics_s3.compressed)

        const startTimeMs = Date.now()
        log.debug(`${method} on app ${anAppId}\n` +
                  `  Dynamo analytics has ${Object.keys(analytics).length} items.\n` +
                  `  S3 analytics has ${Object.keys(analyticsBlob).length} items.\n` +
                  `  Merging them ...\n`)

        // Merge the S3 Analytics blob with the DB analytics data ...
        // Note that the DB data gets priority over blob data (it's presumed
        // to be newer.)
        //
        // TODO: might even want to cache the merge result below
        //       in case that takes a lot of time.
        //       Alternately it might prove faster to just write the merged result
        //       to S3 and think of it as a non-local cache.
        //
        for (const walletAddress in analytics) {
          const walletAnalyticsObj = analytics[walletAddress]

          if (!analyticsBlob.hasOwnProperty(walletAddress)) {
            analyticsBlob[walletAddress] = walletAnalyticsObj
          } else {
            if (walletAnalyticsObj.last_seen) {
              analyticsBlob[walletAddress].last_seen = walletAnalyticsObj.last_seen
            }
            // TODO: might not need the next line (how would this get into the
            //       analytics property w/o running import?)
            if (walletAnalyticsObj.import_time) {
              analyticsBlob[walletAddress].import_time = walletAnalyticsObj.import_time
            }
          }
        }

        log.debug(`${method} on app ${anAppId}\n` +
                  `  Merge completed in ${Date.now() - startTimeMs} ms.\n` +
                  `  Returning ${Object.keys(analyticsBlob).length} unique items.`)

        // Update the tableData and send it to the application ...
        // (TODO: need some way to make sure this never gets back to the DB--it's
        //  likely to be too big.)
        //    - Inspection shows it's only getting fully uploaed when an app id
        //      is created which is okay (though a newbie might come and call it
        //      elsewhere creating problems)
        //
        tableData.Item.analytics = analyticsBlob
        //
      }
    } catch (s3BlobProcessingError) {
      throw new Error(`walletAnalyticsDataTableGet failed during merge of analytics data from storage & db.\n${s3BlobProcessingError}`)
    }
  }

  return tableData
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
