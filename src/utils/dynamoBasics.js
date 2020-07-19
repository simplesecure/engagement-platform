const AWS = require('aws-sdk')

// TODO TODO TODO TODO
// This is for quick dev, remove this and use Cognito to assign role based access
// through IDP (at least within the iFrame) lest we mess things up with
// confliting perms and excess access:
//
AWS.config.update({
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  region: process.env.REACT_APP_REGION
})
//
// _docClientAK: AK --> AWS Access Key Credentialing (vs. Cognito Credentials).
//
const _docClientAK = new AWS.DynamoDB.DocumentClient({convertEmptyValues: true})

const DEBUG_DYNAMO = ( process.env.REACT_APP_DEBUG_DYNAMO ||
                       process.env.REACT_APP_DEBUG_DYNAMO) ? true : false

export function dbRequestDebugLog(anOperation, params, error) {
  try {
    if (DEBUG_DYNAMO) {
      const indentSpaces = 4
      let dbgMsg = `${anOperation} operation failed.\n`
      dbgMsg += '========================================\n'
      dbgMsg += 'params:\n'
      dbgMsg += '--------------------\n'
      dbgMsg += JSON.stringify(params, 0, indentSpaces) + '\n'
      dbgMsg += '\n'
      dbgMsg += 'error:\n'
      dbgMsg += '--------------------\n'
      dbgMsg += '  ' + String(error) + '\n'
      dbgMsg += '\n'

      console.log(dbgMsg)
    }
  } catch(suppressedError) {}
}

// TODO:
//    - One day we'll bump up against the limitations of this (see:
//      https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchGetItem.html).
//      Specifically "A single operation can retrieve up to 16 MB of data, which can contain as many as 100 items."
//    - Add ProjectionExpression to limit data fetched
export async function tableBatchGet(aTable, anArrOfKeyValuePairs) {
  const numItems = anArrOfKeyValuePairs.length
  const maxItemsPerIteration = 100
  const numIterations = Math.ceil(numItems / maxItemsPerIteration)

  let iteration = 1
  let startIndex = 0
  let endIndex = maxItemsPerIteration

  const mergedResult = {
    Responses: {
      [ aTable ] : []
    }
  }

  while (iteration <= numIterations) {
    if (endIndex > numItems) {
      endIndex = numItems
    }

    const params = {
      RequestItems: {
        [ aTable ]: {
          Keys: anArrOfKeyValuePairs.slice(startIndex, endIndex)
        }
      }
    }

    try {
      const result = await new Promise(
        (resolve, reject) => {
          _docClientAK.batchGet(params, (err, data) => {
            if (err) {
              dbRequestDebugLog('tableBatchGet', params, err)

              reject(err)
            } else {
              resolve(data)
            }
          })
        })

      mergedResult.Responses[aTable] =
        mergedResult.Responses[aTable].concat(result.Responses[aTable])
    } catch (error) {
      dbRequestDebugLog('tableBatchGet', params, `${error}\nError Processing [${startIndex} : ${endIndex}) of ${numItems} elements.`)
    }

    iteration++
    startIndex += maxItemsPerIteration
    endIndex += maxItemsPerIteration
  }

  return mergedResult
}