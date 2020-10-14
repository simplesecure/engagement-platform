import { setGlobal } from "reactn"
import { getCloudServices } from './cloudUser.js'
import { getSidSvcs } from "./sidServices"

const ERROR_MSG =
  "Failed to create project, please try again. If this continues, please contact support@simpleid.xyz"

export const createProject = async (that, projectName) => {
  const { org_id } = that.global

  const newProject = {
    date_created: Date.now(),
    project_name: projectName
  }

  // Recently refactored / merged from cloud user
  that.setGlobal({ processing: true, orgData: newProject })

  try {
    const projectId = await getSidSvcs().createAppId(org_id, newProject)
    if (projectId) {
      // apps[projectId] = newProject
      // const appKeys = Object.keys(apps)
      // const allApps = apps
      // const currentAppId = allApps[projectId]
      // data = allApps[projectId]
      
      // TODO: the next call should really be removed and the model above should be updated
      //       with the appId returned (i.e. no need to call the server twice)
      await setGlobal({
        currentAppId: projectId
      })
      await getCloudServices().fetchOrgDataAndUpdate()
      await setGlobal({
        processing: false
      })
      that.setState({ projectName: "" })
      const { appVersion } = that.global;
      if (appVersion === '2.0') {
        that.props.history.push('/segments')
      }
    } else {
      setGlobal({ processing: false, error: "No app id returned" })
      console.log(`ERROR: no app id returned`)
    }
  } catch (suppressedError) {
    console.log(`ERROR: problem writing to DB.\n${suppressedError}`)
    setGlobal({ processing: false, error: ERROR_MSG })
    // TODO: Justin ... (We should run these calls concurrent and retry on fail n times--then report the problem to the user)
  }
}