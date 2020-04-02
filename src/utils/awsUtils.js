// TODO: Long term make this a lib / private npm package
// TODO: Mimic this api: https://github.com/ChenLi0830/dynamoLight#readme

const AWS = require("aws-sdk")
AWS.config.update({
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  region: process.env.REACT_APP_REGION
})
const docClient = new AWS.DynamoDB.DocumentClient({convertEmptyValues: true})

async function getFromDb(aTable, aKeyName, aKeyValue) {
  const params = {
    TableName: aTable,
    Key: {}
  }
  params.Key[aKeyName] = aKeyValue

  return await new Promise((resolve, reject) => {
    docClient.get(params, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

async function putInDb(aTable, anObject) {
  const params = {
    TableName: aTable,
    Item: anObject
  }

  return await new Promise((resolve, reject) => {
    docClient.put(params, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}


export async function getFromAnalyticsDataTable(aKeyValue) {
  return await getFromDb(process.env.REACT_APP_AD_TABLE, process.env.REACT_APP_AD_TABLE_PK, aKeyValue)
}

export async function putInAnalyticsDataTable(anObject) {
  return await putInDb(process.env.REACT_APP_AD_TABLE, anObject)
}

export async function getFromOrganizationDataTable(aKeyValue) {
  return await getFromDb(process.env.REACT_APP_ORG_TABLE, process.env.REACT_APP_ORG_TABLE_PK, aKeyValue)
}

export async function putInOrganizationDataTable(anObject) {
  return await putInDb(process.env.REACT_APP_ORG_TABLE, anObject)
}
