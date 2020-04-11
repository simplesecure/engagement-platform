// TODO: separate out the zip / compression components into functions.
// TODO: consider singlton model w/ constructor initing AWS object values
//       to get S3 client.
// TODO: differentiate between browser & node for zip types

import { getLog } from './debugScopes.js'
const log = getLog('s3Utils')

const JSZip = require('jszip')
const path = require('path')

require('dotenv').config()
const AWS = require('aws-sdk')
if (!process.env.REACT_APP_AWS_ACCESS_KEY_ID ||
    !process.env.REACT_APP_AWS_SECRET_ACCESS_KEY ||
    !process.env.REACT_APP_REGION) {
  throw new Error('s3Utils: expected environment variables are not defined.')
}

const s3 = new AWS.S3({
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  region: process.env.REACT_APP_REGION
})

export const BUCKET_NAME = 'simple-id-data'
export const ZIP_OBJ_EXT='zip'
export const COMPRESS_OBJS=true

const ZIP_OPTIONS = {
  COMPRESSION: 'DEFLATE',
  LEVEL: 5,                    // 1 is fastest and least compressed, 9 is slowest and most compressed
  DATA_TYPE: 'nodebuffer'     // in browser this should be 'blob' or 'arraybuffer'
                               // TODO: use JSZip.support as mentioned here:
                               //       https://stuk.github.io/jszip/documentation/api_jszip/generate_async.html
}

// Zip Related functions
//
function getFileName(aKey) {
  // Return file.ext from <path>/file.ext[.zip] in aKey:
  //
  const extension = `.${ZIP_OBJ_EXT}`
  if (path.extname(aKey) === extension) {
    return path.basename(aKey.slice(0, -(extension.length)))
  } else {
    return path.basename(aKey)
  }
}

async function uncompressData(aKey, theCompressedData) {
  const method = 'uncompressData'
  try {
    const fileName = getFileName(aKey)

    return await new Promise((resolve, reject) => {
      JSZip.loadAsync(theCompressedData)
      .then((zip) => {
        // The use of file('*') in this case matches the only file we expect
        // in the zip and the resulting array should contain the async fn to
        // uncompress it.  See: https://stuk.github.io/jszip/documentation/api_jszip/file_regex.html
        //
        zip.file(fileName).async(ZIP_OPTIONS.DATA_TYPE)
        .then((data) => {
          resolve(data)
        })
        .catch((error) => {
          reject(error)
        })
      })
      .catch((error) => {
        reject(error)
      })
    })
  } catch (unzipError) {
    throw new Error(`${method} failed to uncompress object ${aKey}.\n${unzipError}`)
  }
}


// Debug logging
//
function s3DebugLog(anOperation, params, error) {
   try {
     const indentSpaces = 4
     let dbgMsg = `${anOperation} operation failed.`
     dbgMsg += '========================================\n'
     dbgMsg += 'params:\n'
     dbgMsg += '--------------------\n'
     dbgMsg += JSON.stringify(params, 0, indentSpaces) + '\n'
     dbgMsg += '\n'
     dbgMsg += 'error:\n'
     dbgMsg += '--------------------\n'
     dbgMsg += '  ' + String(error) + '\n'
     dbgMsg += '\n'

     log.error(dbgMsg)
   } catch(suppressedError) {}
}

// Basic Access Methods
//
export async function getJsonObject(aKey, compress=COMPRESS_OBJS) {
  const method = 'getJsonObject'

  const params = {
    Bucket: BUCKET_NAME,
    Key: aKey
  }

  let body
  try {
    const s3Data = await new Promise((resolve, reject) => {
      s3.getObject(params, (err, data) => {
        if (err) {
          s3DebugLog(method, params, err)

          reject(err)
        } else {
          try {
            resolve(data)
          } catch (parseError) {
            s3DebugLog('getObject', params, parseError)
            reject(parseError)
          }
        }
      })
    })

    body = s3Data.Body
  } catch (error) {
    throw new Error(`${method} failed to get object ${aKey}.\n${error}`)
  }
  const uncompressedData = (compress) ? await uncompressData(aKey, body) : body

  try {
    return JSON.parse(uncompressedData)
  } catch (parseError) {
    throw new Error(`${method} failed to parse retrieved data.\n${parseError}`)
  }
}
