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

  return new Promise((resolve, reject) => {
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

  return new Promise((resolve, reject) => {
    docClient.put(params, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

async function updateInDb(aTable, aKeyName, anObject) {
  //Placeholder for updating data rather than full overwrites
  //TODO: review whether we need this
}

// TODO: Expand these accessors to be more functional (i.e. get specific items
//       from the analyics table as needed, put new items in that don't affect
//       adjacent row elements or do updates)
//
export async function getFromAnalyticsDataTable(aKeyValue) {
  return getFromDb(
    process.env.REACT_APP_AD_TABLE, process.env.REACT_APP_AD_TABLE_PK, aKeyValue)
}

export async function putInAnalyticsDataTable(anObject) {
  return putInDb(process.env.REACT_APP_AD_TABLE, anObject)
}

export async function updateInAnalyticsDataTable(anObject) {
  return updateInDb(process.env.REACT_APP_AD_TABLE, process.env.REACT_APP_AD_TABLE_PK, anObject)
}

export async function getFromOrganizationDataTable(aKeyValue) {
  return getFromDb(process.env.REACT_APP_OD_TABLE, process.env.REACT_APP_OD_TABLE_PK, aKeyValue)
}

export async function putInOrganizationDataTable(anObject) {
  return putInDb(process.env.REACT_APP_OD_TABLE, anObject)
}

export async function updateInOrganizationDataTable(anObject) {
  return updateInDb(process.env.REACT_APP_OD_TABLE, process.env.REACT_APP_OD_TABLE_PK, anObject)
}
