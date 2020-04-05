import { BUCKET_NAME,
         ZIP_OBJ_EXT,
         COMPRESS_OBJS } from './s3Utils.js'

// DB Paths:
//
const DB_PATH = 'db'
const JOB_STATUS_PATH = `${DB_PATH}/job_status`
const CUST_ANALYTICS_DATA_PATH = `${DB_PATH}/cust_analytics_data`

// getDbObj:
//    Returns the object we drop into the database to reference an s3 object.
//
function getDbObj(anS3Key, compress) {
  return {
    bucket: BUCKET_NAME,
    s3_key: (compress) ? `${anS3Key}.${ZIP_OBJ_EXT}` : anS3Key,
    compressed: compress,
    created: Date.now()
  }
}

export function getJobStatusDataPtr(aJobId, compress=COMPRESS_OBJS) {
  let dataPath = `${JOB_STATUS_PATH}/${aJobId}/data.json`
  return getDbObj(dataPath, compress)
}

export function getJobStatusResultPtr(aJobId, compress=COMPRESS_OBJS) {
  let resultPath = `${JOB_STATUS_PATH}/${aJobId}/result.json`
  return getDbObj(resultPath, compress)
}

export function getCustAnalyticsDataPtr(anAppId, compress=COMPRESS_OBJS) {
  let custAnalyticsPath = `${CUST_ANALYTICS_DATA_PATH}/${anAppId}.json`
  return getDbObj(custAnalyticsPath, compress)
}
