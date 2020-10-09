import { getGlobal } from 'reactn';
import { getCloudServices } from './cloudUser';
const moment = require('moment')

export async function getEmailData() {
  const { sessionData } = getGlobal()
  // console.log(`getEmailData: sessionData.id = ${sessionData.id}`);

  //  Fetch email data global stats for the app
  const day30DaysAgo = moment().subtract(30, 'days').format("YYYY-MM-DD");
  const defaultParams = {
    appId: sessionData.id,
    aggregated_by: "day",
    end_date: moment(Date.now()).format("YYYY-MM-DD"),
    limit: 1,
    offset: 1,
    start_date: day30DaysAgo
  }

  return await getCloudServices().getEmailData(defaultParams)
}
