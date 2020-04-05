import { tableGet, tableBatchGet, tablePut } from './dynamoBasics.js'
import * as s3Utils from './s3Utils.js'
import { getLog } from './debugScopes.js'
const log = getLog('dynamoConveniences')

const S3_ANALYTICS_BLOB = true



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
