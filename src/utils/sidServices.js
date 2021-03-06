import { Auth } from 'aws-amplify'
import Amplify from 'aws-amplify';
import { walletAnalyticsDataTablePut,
         organizationDataTableGet,
         organizationDataTablePut,
         walletToUuidMapTableGetUuids } from './dynamoConveniences.js'
import { jsonParseToBuffer } from './misc.js'
import { getLog } from './debugScopes.js'
const log = getLog('sidServices')
const AWS = require('aws-sdk')
const ethers = require('ethers')

// v4 = random. Might consider using v5 (namespace, in conjunction w/ app id)
// see: https://github.com/kelektiv/node-uuid
const uuidv4 = require('uuid/v4')
const eccrypto = require('eccrypto')

const USER_POOL_ID = process.env.REACT_APP_PASSWORD_USER_POOL_ID
const USER_POOL_WEB_CLIENT_ID = process.env.REACT_APP_PASSWORD_USER_POOL_WEB_CLIENT_ID

// TODO: clean up for security best practices
//       currently pulled from .env
//       see: https://create-react-app.dev/docs/adding-custom-environment-variables/
const amplifyAuthObj = {
  region: process.env.REACT_APP_REGION,
  userPoolId: USER_POOL_ID,
  userPoolWebClientId: USER_POOL_WEB_CLIENT_ID,
  identityPoolId: process.env.REACT_APP_IDENTITY_POOL_ID
}
// TODO: Prefer to use USER_SRP_AUTH but short on time.  Revisit this soon
//       so that password never leaves client.  Super important!
//   references:
//      - (here too) https://stackoverflow.com/questions/54430978/unable-to-verify-secret-hash-for-client-at-refresh-token-auth
//      - (way down in this) https://stackoverflow.com/questions/37438879/unable-to-verify-secret-hash-for-client-in-amazon-cognito-userpools
//      - https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_InitiateAuth.html
//        - https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CognitoIdentityServiceProvider.html#initiateAuth-property
//      - https://stackoverflow.com/questions/41526205/implementing-user-srp-auth-with-python-boto3-for-aws-cognito
//      - https://docs.amazonaws.cn/en_us/cognito/latest/developerguide/cognito-dg.pdf
//      - https://aws-amplify.github.io/docs/js/authentication  (section Switching Authentication Flow Type)
//      -
//      - https://stackoverflow.com/questions/49000676/aws-cognito-authentication-user-password-auth-flow-not-enabled-for-this-client
//
amplifyAuthObj['authenticationFlowType'] = 'USER_PASSWORD_AUTH'
//
// More TODO:
//      - https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_CreateUserPoolClient.html#CognitoUserPools-CreateUserPoolClient-request-PreventUserExistenceErrors
// Doesn't work:
// amplifyAuthObj['PreventUserExistenceErrors'] = 'LEGACY'
// Did this instead for the time being:
//      - https://github.com/aws-amplify/amplify-js/issues/4430

Amplify.configure({
  Auth: amplifyAuthObj
});
AWS.config.update({ region: process.env.REACT_APP_REGION })

const SID_ANALYTICS_APP_ID = '00000000000000000000000000000000'

/*******************************************************************************
 * Configuration Switches
 ******************************************************************************/
const TEST_ASYMMETRIC_DECRYPT = true

// Local storage key for sid services data
const SID_SVCS_LS_KEY = 'SID_SVCS'


if (!process.env.REACT_APP_AWS_ACCESS_KEY_ID) {
  throw new Error('Cloud services provider not defined!')
} else if (process.env.REACT_APP_AWS_ACCESS_KEY_ID !== 'AKIARVK4F3CUFEBZSRLS' &&    // Test account
           process.env.REACT_APP_AWS_ACCESS_KEY_ID !== 'AKIAZKPB3EA6LGT6NUVN') {    // Prod. account
  //
  // DANGER:  If you get this it's because your .env file doen't have one of the
  //          two keys above.  If they've changed, you need to search and replace
  //          them in the code base with the new key id (otherwise bad things will happen,
  //          for instance below you will pull the wrong HSM keys and then lose
  //          user data).
  throw new Error('Unexpected access key id.')
}

// TODO: Remove this soon.  #Bicycle
function getKeyAssignments() {
  const AWS_TEST_ACCOUNT = (process.env.REACT_APP_AWS_ACCESS_KEY_ID === 'AKIARVK4F3CUFEBZSRLS')

  let keyIds = {
    1 : '2fe4d745-6685-4581-93ca-6fd7aff92426',
    8 : '5b70dc4d-a34a-4ff2-8c7e-56f772dbbea3',
    0 : '66d158b8-ecbd-4962-aedb-15d5dd4024ee',
    4 : '812f95c7-98d8-4eed-bd77-4b40356a90a7',
    5 : '836fb98e-3b5f-4694-925a-6ae49466af39',
    3 : '8a3fbf1d-4ad0-4dfb-bc95-daf1c2b5a840',
    7 : 'ab8e6e55-efff-4a8d-9b9c-c9e88a6fbf95',
    2 : 'ba920788-7c6a-4553-b804-958870279f53',
    6 : 'f2445d7c-2c60-4846-acf9-cc899cf3d4f1',
    9 : 'fa3e1b67-b62b-4455-a2f7-0190fb40c2c8'
  }
  if (AWS_TEST_ACCOUNT) {
    // Test farm keys
    keyIds = {
      0: 'dbe0351b-887e-46fb-b0f5-d4da8691a71a',
      1: 'f770b6af-6268-443f-b34f-b5a2bb238ae3',
      2: 'f770b6af-6268-443f-b34f-b5a2bb238ae3',
      3: 'dbe0351b-887e-46fb-b0f5-d4da8691a71a',
      4: 'f770b6af-6268-443f-b34f-b5a2bb238ae3',
      5: 'dbe0351b-887e-46fb-b0f5-d4da8691a71a',
      6: 'f770b6af-6268-443f-b34f-b5a2bb238ae3',
      7: 'dbe0351b-887e-46fb-b0f5-d4da8691a71a',
      8: 'f770b6af-6268-443f-b34f-b5a2bb238ae3',
      9: 'dbe0351b-887e-46fb-b0f5-d4da8691a71a'
    }
  }

  const MAX_KEYS = Object.keys(keyIds).length

  // Ensure key selection isn't repeated (i.e. KFA1 !== KFA2)
  //
  const KFA1 = Math.floor(Math.random() * MAX_KEYS)
  let KFA2 = Math.floor(Math.random() * MAX_KEYS)
  if ( (KFA2 === KFA1) && (MAX_KEYS > 1) ) {
    // Choosing again to ensure different keys.
    //
    KFA2++
    if (KFA2 >= MAX_KEYS) {
      KFA2 = 0
    }
  }

  return {
    "custom:kfa1" : keyIds[KFA1],
    "custom:kfa2" : keyIds[KFA2]
  }
}


export class SidServices
{
  /**
   * constructor:
   *
   *         There is one required argument:
   *         @param anAppId is a string containing a uuid.
   *                        It is used to create and interact with user data. For
   *                        most apps this will control email preferences
   *                        from the developer and where analytics data is created
   *                        and stored. For the SimpleID analytics app this will
   *                        also result in the creation of additional data
   *                        (organization ids etc.)
   *
   * TODO (short-term, higher priority):
   *        1. Clean up / refactor the code fetching data from local storage.
   *
   */
  constructor(anAppId) {

    this.cognitoUser = undefined
    this.signUpUserOnConfirm = false
    this.keyId1 = undefined
    this.keyId2 = undefined

    this.appId = anAppId
    this.appIsSimpleId = (this.appId === SID_ANALYTICS_APP_ID )

    this.persist = {
      userUuid: undefined,
      email: undefined,
      sid: undefined
    }

    this.neverPersist = {
      priKey: undefined,
      password: undefined
    }


    try {
      // TODO: de-obfuscate using static symmetric encryption key SID_SVCS_LS_ENC_KEY
      const stringifiedData = localStorage.getItem(SID_SVCS_LS_KEY)
      const persistedData = jsonParseToBuffer(stringifiedData)
      if ( persistedData.hasOwnProperty('email') && persistedData.email &&
           persistedData.hasOwnProperty('userUuid') && persistedData.userUuid &&
           persistedData.hasOwnProperty('sid') && persistedData.sid ) {
        this.persist = persistedData
      }
    } catch (suppressedError) {
      log.info(`Unable to recover session data from local storage.\n${suppressedError}`)
    }
  }

  getSID() {
    return this.persist.sid;
  }

  async signInOrUpWithPassword(anEmail, aPassword) {
    const method = 'signInOrUpWithPassword'
    log.debug(`${method} e:${anEmail},  p:<redacted>`)

    // Blow existing cognito token keys away from local storage (they cause
    // problems)...
    try {
      const keys = Object.keys(localStorage)
      const keysToClear = []
      for (const key of keys) {
        if (key.startsWith('aws.cognito.identity')) {
          keysToClear.push(key)
        }
      }
      log.debug(`Clearing keys ${JSON.stringify(keysToClear, 0, 2)}`)
      for (const key of keysToClear) {
        localStorage.removeItem(key)
      }
    } catch (suppressedError) {
      log.warn(`${method} failed to clear tokens before sign in.\n${suppressedError}\ncontinuing...\n`)
    }

    // TODO: Can we do this here too:
    // const authenticated = await this.isAuthenticated(anEmail)
    // if (authenticated) {
    //   // If the user is already authenticated, then skip this function.
    //   return 'already-logged-in'
    // }


    // Most important doc yet:
    //   - https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pool-managing-errors.html
    //
    // TODO: this might be the wrong approach--might have to invert based on the end
    //       of this thread:
    //   - https://github.com/aws-amplify/amplify-js/issues/1067
    // Try to Sign In:
    //   reference: https://aws-amplify.github.io/docs/js/authentication#sign-in
    try {
      this.cognitoUser = await Auth.signIn(anEmail, aPassword)
      this.persist.email = anEmail
      return 'cognito-user-verified'
    } catch (err) {
      log.debug('DBG: signInOrUpWithPassword. Initial sign in attempt failed.')
      log.debug('Error code:', err.code)
      log.debug('Error:', JSON.stringify(err, 0, 2))

      if (err.code === 'UserNotConfirmedException') {
          // The error happens if the user didn't finish the confirmation step when signing up
          // In this case you need to resend the code and confirm the user
          // About how to resend the code and confirm the user, please check the signUp part
          try {
            await Auth.resendSignUp(anEmail)
            this.signUpUserOnConfirm = true
            this.persist.email = anEmail
            this.neverPersist.password = aPassword
            log.debug('code resent successfully');
            return 'sign-in-approval'
          } catch (nestedError) {
            log.error(nestedError);
            throw Error(`ERROR: Sign in attempt has failed.\n${nestedError}`)
          }
      } else if (err.code === 'PasswordResetRequiredException') {
          // The error happens when the password is reset in the Cognito console
          // In this case you need to call forgotPassword to reset the password
          // Please check the Forgot Password part.
          // TODO:
          log.error(err);
          throw Error(`ERROR: Sign in attempt has failed.\n${err}`)
      } else if (err.code === 'NotAuthorizedException') {
          // The error happens when the incorrect password is provided
          // TODO:
          log.error(err);
          throw Error(`ERROR: Sign in attempt has failed.\n${err}`)
      } else if (err.code === 'UserNotFoundException') {
          // The error happens when the supplied username/email does not exist in the Cognito user pool
          // DO NOTHING HERE, proceed to try and sign the user up with the provided creds.
      } else {
          log.error(err);
          throw Error(`ERROR: Sign in attempt has failed.\n${err}`)
      }
    }

    // Try to Sign Up:
    //   reference:  https://aws-amplify.github.io/docs/js/authentication#sign-in
    //
    // Note:
    //        We're doing verified sign-up so this is a lot like the passwordless flow
    //        for sign-up (not sign-in). It's similar in that we collect a code from the
    //        user and pass that in to verify the email.
    try {
      // TODO: Move the key assignment to a lambda with admin priviledges on
      //       cognito UDP attributes to prevent users from mucking with the key
      //       ids.
      const keyAssignments = getKeyAssignments()

      const params = {
        username: anEmail,
        password: aPassword,
        attributes: {
          email: anEmail,
          ...keyAssignments
        },
        validationData: []
      }
      await Auth.signUp(params)

      // Unlike the other flow, we don't sign the user up yet--we wait on their
      // code and then sign them up.
      //    (TODO: it might make sense to do this differently here--i.e. make
      //           them click the verify link in the email at any time or something.)
      //
      this.persist.email = anEmail
      this.neverPersist.password = aPassword    // TODO: Look closer at this (it
                                                // might be a bad idea / way to
                                                // do this). (Doing it b/c I need
                                                // to get the password to the rest
                                                // of the signup flow in answerCustomChallenge).
      this.signUpUserOnConfirm = true
    } catch (error) {
      log.error(error)
      throw Error(`ERROR: Sign up attempt has failed.\n${error}`)
    }
  }

  /**
   * signOut:
   *
   */
  async signOut() {
    try {
      await Auth.signOut()
    } catch (error) {
      throw Error(`ERROR: Signing out encounted an error.\n${error}`)
    }
  }

  /**
   * answerCustomChallenge:
   *
   * Notes:  This is phase two of the Sign Up and Sign In processes (collectively
   *         handled in signInOrUp for phase one).
   *         By this point Cognito has issued a challenge to a user via email
   *         and they have entered that received challenge in:
   *         @param anAnswer  a string containing the user's entry for a
   *                          Cognito issued 6 digit challenge.
   *
   *         There are two use case handled in this method:
   *         1. If the user already exists, their user data is fetched from the
   *            db (and possibly local storage) and we obtain a credentials from
   *            cognito to decrypt their wallet key for them.
   *         2. The user does not already exist in which case we create a wallet
   *            for them, split it using Shamir's Secret sharing and provide it
   *            to them as well as storing it encrypted in the user db.
   *
   *         Another consideration or special case is handled here for both new
   *         users and existing users when logging in from special appId
   *         corresponding to SimpleID. In this case we add additional user data
   *         (specifically the sid field) and also want to give credentialed
   *         access to additional db tables for mapping wallets to uuids,
   *         processing analytics data, and querying organization data.
   *
   * TODO:
   *        1. Make encrypt*IdpCredentials calls concurrent and wait for them (faster).
   *        2. Make access to certain tables below restricted or more restricted,
   *           for example:
   *             - could use cognito
   *             - could use a separate policy / user (wallet to uuid map is write only)
   *
   */
  async answerCustomChallenge(anAnswer) {
    log.debug(`DBG: answerCustomChallenge password flow.`)
    // TODO: refactor this whole method to make sense if we keep the password flow stuff.
    //       (i.e. split out the common code into names that make more sense etc.).
    //
    // We only need to do this stuff here if the user is signing up,
    // otherwise we just run the rest of the flow below this entire conditional
    // block.
    //
    log.debug(`DBG: signUpUserOnConfirm: ${this.signUpUserOnConfirm}`)
    if (this.signUpUserOnConfirm) {
      // Password Cognito Flow:
      //
      // First send the confirmation code for the email.
      try {
        log.debug(`DBG: calling confirmSignUp ... e:${this.persist.email}, a:${anAnswer}`)
        await Auth.confirmSignUp(this.persist.email, anAnswer)
        log.debug('  success!')
      } catch (err) {
        // Something went wrong--possibly the confirmation code. TODO: we might
        // need to get them to re-enter it.
        log.debug(`DBG: answerCustomChallenge(password flow) failed.\n${err}`)
        throw new Error(err)
      }
      // Now sign the user in and proceed with the rest of our flow:
      try {
        // log.debug(`DBG: calling signIn ... e:${this.persist.email}, p:${this.neverPersist.password}`)
        log.debug(`Calling signIn:  e:${this.persist.email}, p:********`)
        this.cognitoUser = await Auth.signIn(this.persist.email, this.neverPersist.password)
        log.debug('  success!')
      } catch (err) {
        log.debug(`DBG: answerCustomChallenge. Sign in attempt failed.\nError code:${err.code}\nError:${err}`)
        if (err.code === 'UserNotConfirmedException') {
            // The error happens if the user didn't finish the confirmation step when signing up
            // In this case you need to resend the code and confirm the user
            // About how to resend the code and confirm the user, please check the signUp part
            // TODO:
            log.error(err)
            throw new Error(err)
        } else if (err.code === 'PasswordResetRequiredException') {
            // The error happens when the password is reset in the Cognito console
            // In this case you need to call forgotPassword to reset the password
            // Please check the Forgot Password part.
            // TODO:
            log.error(err)
            throw new Error(err)
        } else if (err.code === 'NotAuthorizedException') {
            // The error happens when the incorrect password is provided
            // TODO:
            log.error(err)
            throw new Error(err)
        } else if (err.code === 'UserNotFoundException') {
            // The error happens when the supplied username/email does not exist in the Cognito user pool
            // TODO:
            log.error(err)
            throw new Error(err)
        } else {
            log.error(err)
            throw Error(`ERROR: Sign in attempt has failed.\n${err}`)
        }
      }
    }

    // The user has entered a challenge answer and no error occured. Now test
    // to see if they are authenticated into Cognito (i.e. have a valid token):
    const authenticated = await this.isAuthenticated()

    if (authenticated && this.signUpUserOnConfirm) {
      // Phase 2 of signUp flow:
      //////////////////////////
      try {
        //  -1. Update the key IDs from the token to encrypt the user's wallet
        //      with Cognito IDP such that we can't see it ever.
        //
        const keyAssignments = await this.getKeyAssignmentFromTokenAttr()
        this.keyId1 = keyAssignments['kfa1']
        this.keyId2 = keyAssignments['kfa2']

        //  0. Generate uuid
        //
        this.persist.userUuid = uuidv4()

        //  1. a)  Create and store entry in Organization Data (simple_id_org_data_v001)
        //         the this.appIsSimpleId
        //
        //
        // Special case. User is signing into Simple ID analytics and needs to be
        // part of an organization (org_id) etc. Two scenarios (only #1 is
        // supported in Jan. 21 2020 release):
        //
        //    1. User is a new customer and we are assigning them a new
        //       organization id (org_id) which will be used to collect data
        //       for their apps (identified with app ids, app_id).
        //    2. User is an associate of an organization and has been invited
        //       to work with Simple ID analytics app.  (Not supported in
        //       Jan 21. release).
        //         - Justin idea: only make this possible with query string / link
        //         - AC idea: create org_id and allow it to be deleted / backgrounded
        //                    when they join anothe org through some mechanism.
        //
        // TODO:
        //       1. Should org_id be an array of org ids? (i.e. multiple orgs
        //          like AWS allows multiple accounts)
        //       2. Should we check for a uuid collision? (unlikely, but huge
        //          security fail if happens)
        //
        const sidObj = await this.createSidObject()

        //  1. b) Create and store User Data (simple_id_auth_user_data_v001)
        //
        //  IMPORTANT: Never put wallet address in user data (the whole point
        //             is to decouple the two with a cryptographic island).
        const userDataRow = {
          // sub: <cognito idp sub>  is implicitly added to this in call to tablePutWithIdpCredentials below.
          uuid: this.persist.userUuid,
          email: this.persist.email,
          apps: {
            [ this.appId ] : {}             // Empty Contact Prefs Etc.
          },
          sid: sidObj,
        }

        // Write this to the user data table:
        log.debug('DBG: tablePutWithIdpCredentials ...')
        await this.tablePutWithIdpCredentials( userDataRow )
      } catch (error) {
        throw Error(`ERROR: signing up user after successfully answering customer challenge failed.\n${error}`)
      } finally {
        // For now abort the operation.
        // TODO: future, robust recovery process
        this.signUpUserOnConfirm = false
      }
    } else if (authenticated) {
      // Phase 2 of signIn flow:
      //////////////////////////
      // 0. Update the key IDs from the token in case we need to encrypt
      //    a public key
      const keyAssignments = await this.getKeyAssignmentFromTokenAttr()
      this.keyId1 = keyAssignments['kfa1']
      this.keyId2 = keyAssignments['kfa2']

      // 1. Fetch the encrypted secrets from Dynamo
      //
      const userDataDbRow = await this.tableGetWithIdpCredentials()
      const userData = userDataDbRow.Item

      this.persist.sid = userData ? userData.sid : undefined
      this.persist.userUuid = userData.uuid
    }

    if (authenticated) {
      try {
        localStorage.setItem(SID_SVCS_LS_KEY, JSON.stringify(this.persist))
      } catch (suppressedError) {
        log.error(`ERROR persisting SID services data to local store.\n${suppressedError}`)
      }
    }

    // moving the authenticated = true into an object so that we include signUpMnemonicReveal
    // this needs to be sent so that in postMessage.js we know if we need to update state accordingly
    const signUpMnemonicReveal = false
    return { authenticated, signUpMnemonicReveal }
  }

  async isAuthenticated(anEmail=undefined) {
    try {
      const session = await Auth.currentSession();

      const tokenEmail = session.idToken.email
      if (anEmail && (anEmail !== tokenEmail)) {
        throw new Error('Stored token is for different user. Returning false for isAuthenticated.')
      }

      return true;
    } catch (suppressedError) {
      log.warn(`WARN: Suppressing error in isAuthenticated.\n${suppressedError}`)
      return false;
    }
  }

  async getUserDetails() {
    try {
      if (!this.cognitoUser) {
        this.cognitoUser = await Auth.currentAuthenticatedUser()
      }
      return await Auth.userAttributes(this.cognitoUser)
    } catch (suppressedError) {
      log.warn(`WARN: Unable to get user details from token.\n${suppressedError}`)
    }
    return undefined
  }

  async getKeyAssignmentFromTokenAttr() {
    const userAttributes = await this.getUserDetails()

    // TODO: Clean this up (i.e. see if we can do direct assignment instead of a loop)
    const keyAssignments = {}
    for (const userAttribute of userAttributes) {
      if (userAttribute.getName() === 'custom:kfa1') {
        log.debug(`returning kfa1: ${userAttribute.getValue()}`)
        keyAssignments['kfa1'] = userAttribute.getValue()
      } else if (userAttribute.getName() === 'custom:kfa2') {
        log.debug(`returning kfa2: ${userAttribute.getValue()}`)
        keyAssignments['kfa2'] = userAttribute.getValue()
      }
    }

    return keyAssignments
  }



/******************************************************************************
 *                                                                            *
 * SimpleID Analytics Tool Related Methods                                    *
 *                                                                            *
 ******************************************************************************/

  /**
   * getUuidsForWalletAddresses:
   *
   * Notes: Given a list of wallet addresses for an app ID, this method
   *        fetches the uuids corresponding to the wallet addresses.
   *
   *        This method only works if this user has access to the organization
   *        private key.
   */
  async getUuidsForWalletAddresses(data) {
    const { app_id, addresses } = data;
    let uuids = []
    // 1. Fetch the encrypted uuids for the given wallet addresses and appID:
    //
    const encryptedUuids = []
    const encryptedUuidMaps = await walletToUuidMapTableGetUuids(addresses)
    for (const encryptedUuidMap of encryptedUuidMaps) {
      // SPEC Change:
      //    This data structure now features app_to_enc_uuid_map_v2, which
      //    has lists of ciphertexts to UUIDs etc.
      //    To mitigate our situation, lets try this first, then fall back to
      //    the legacy data.
      //
      //    TODO:
      //          - Ultimately we want to upgrade the data format and ditch the
      //            legacy.
      //          - Grab all uuids (or consider that as fallback / emerg
      //            message broadcast).
      //
      try {
        const cipherObj = encryptedUuidMap.app_to_enc_uuid_map_v2[app_id][0]
        console.log(cipherObj)
        encryptedUuids.push(cipherObj)
        log.debug(`Spec. Change Success.  Read first cipherObj from app_to_enc_uuid_map_v2.`)
        continue
      } catch (suppressedSpecChangeError) {
        log.debug(`Spec. Change Fail.  Unable to read cipherObj from app_to_enc_uuid_map_v2. Trying to read app_to_enc_uuid_map. Reported error:\n${suppressedSpecChangeError}`)
      }

      try {
        const cipherObj = encryptedUuidMap.app_to_enc_uuid_map[app_id]
        encryptedUuids.push(cipherObj)
      } catch (suppressedError) {
        log.warn(`Unable to get uuid cipherObj from object:`, encryptedUuidMap)
        continue
      }

    }

    // 2. Fetch the private key required to decrypt the uuids:
    //
    // TODO:
    //      - Make this efficient (this is awful)
    let orgEcPriKey = undefined
    try {
      const orgData = await organizationDataTableGet(this.persist.sid.org_id)
      orgEcPriKey = await this.getOrgEcPriKey(orgData.Item)
    } catch (error) {
      throw new Error(`Failed to restore organization private key.\n${error}`)
    }

    // 3. Decrypt the encrypted uuids and return them:
    //
    for (const encryptedUuidCipherText of encryptedUuids) {
      try {
        //console.log(orgEcPriKey, encryptedUuidCipherText)
        if(encryptedUuidCipherText) {
          const uuid = await eccrypto.decrypt(orgEcPriKey, encryptedUuidCipherText)
          uuids.push(uuid.toString())
        }
      } catch (suppressedError) {
        console.log(suppressedError)
        // TODO: some message or analytic to fix / track this
      }
    }

    return uuids
  }

  /**
   * createOrganizationId
   *
   * Notes:  This method generates an organization id and then populates the
   *         Organization Data Table with the newly created organization id.
   *
   *         @return orgId, the newly created organization id
   */
  async createOrganizationId(aUserUuid, aUserPubKey, aUserPriKey) {
    const orgId = uuidv4()

    let sub = undefined
    try {
      // Prob don't need to do this as it's done implicitly above for the
      // encrypt with keys.  TODO: something better when time.
      await this.requestIdpCredentials()
      sub = AWS.config.credentials.identityId
    } catch (error) {
      throw Error('ERROR: Failed to get id from Identity Pool.')
    }

    const orgPriKey = eccrypto.generatePrivate()
    const orgPubKey = eccrypto.getPublic(orgPriKey)
    let priKeyCipherText = undefined
    try {
      priKeyCipherText = await eccrypto.encrypt(aUserPubKey, orgPriKey)
    } catch (error) {
      throw new Error(`ERROR: Creating organization id. Failed to create private key cipher text.\n${error}`)
    }

    if (TEST_ASYMMETRIC_DECRYPT) {
      try {
        const recoveredPriKey =
          await eccrypto.decrypt(aUserPriKey, priKeyCipherText)

        if (recoveredPriKey.toString('hex') !== orgPriKey.toString('hex')) {
          throw new Error(`Recovered private key does not match private key:\nrecovered:${recoveredPriKey[0].toString('hex')}\noriginal:${orgPriKey.toString('hex')}\n`);
        }
      } catch (error) {
        throw new Error(`ERROR: testing asymmetric decryption.\n${error}`)
      }
    }

    const organizationDataRowObj = {
      org_id: orgId,
      cryptography: {
        pub_key: orgPubKey,
        pri_key_ciphertexts: {
          [ aUserUuid ] : priKeyCipherText,
        }
      },
      owner: {
        sub: sub,
        uuid: aUserUuid,
      },
      members: [],
      apps: {}
    }

    try {
      await organizationDataTablePut(organizationDataRowObj)
    } catch(error) {
      throw Error(`ERROR: Creating organization id.\n${error}`)
    }

    return orgId
  }

  async createSidObject() {
    if (!this.appIsSimpleId) {
      return {}
    }

    const priKey = eccrypto.generatePrivate()
    const pubKey = eccrypto.getPublic(priKey)
    const priKeyCipherText =
      await this.encryptWithKmsUsingIdpCredentials(this.keyId1, priKey)

    const orgId = await this.createOrganizationId(this.persist.userUuid, pubKey, priKey)

    let sidObj = {
      org_id: orgId,
      pub_key: pubKey,
      pri_key_cipher_text: priKeyCipherText,
      apps: {}
    }

    this.persist.sid = sidObj
    this.neverPersist.priKey = priKey

    return sidObj
  }

  /**
   * createAppId
   *
   * Notes:  This method generates an app id and then populates the
   *         Organization Data Table and Wallet Analytics Tables with the
   *         newly created organization id.
   */
  async createAppId(anOrgId, anAppObject) {
    const method = 'createAppId'

    // await this.getUuidsForWalletAddresses()
    // return
    // TODO: 1. Might want to check if the user has the org_id in their sid
    //       user data property.
    //       2. Might want to check if the user is listed as a member in the
    //       org data table.
    //       3. Use update to do the assignment (right now we're doing the
    //       horrible read--modify--clobber-write)
    //       4. Def check to make sure the same app id doesn't exist / collide
    //       in the wallet analytics table

    const appId = uuidv4()

    // 1. Fetch the organization data
    //
    let orgData = undefined
    try {
      // TODO: See TODO.3 above!
      orgData = await organizationDataTableGet(anOrgId)
    } catch (error) {
      throw new Error(`${method} Failed to fetch organization data.\n${error}`)
    }

    // 2 Get the public key
    //
    let publicKey = undefined
    try {
      publicKey = orgData.Item.cryptography.pub_key

      if (!publicKey) {
        throw new Error(`publicKey is undefined in organization data.`)
      }
    } catch (error) {
      throw new Error(`${method} Failed to fetch public key from organization data.\n${error}`)
    }

    // 3. Create an entry for 3Box in the new app's data. Encrypt the 3Box id for
    //    this app using the same shared public key used for analytics:
    //      - TODO: very similar to getChatSupportAddress code in 3.a.  (Unify if possible)
    try {
      const chatSupportWallet = ethers.Wallet.createRandom()
      const chatSupportWalletStr = JSON.stringify(chatSupportWallet)
      let chatSupportWalletCipherText = await eccrypto.encrypt(publicKey, Buffer.from(chatSupportWalletStr))
      anAppObject.chat_support = {
        wallet: chatSupportWalletCipherText
      }
    } catch (error) {
      throw new Error(`${method} Failed to create chat support address.\n${error}`)
    }

    // 4. Update the apps entry for the organization with the new app's data:
    //
    try {
      orgData.Item.apps[appId] = anAppObject
      await organizationDataTablePut(orgData.Item)
    } catch (error) {
      throw new Error(`${method} Failed to update organization data.\n${error}`)
    }

    // 5. Update the Wallet Analytics Data table
    //
    try {
      const walletAnalyticsRowObj = {
        app_id: appId,
        org_id: anOrgId,
        public_key: publicKey,
        analytics: {}
      }
      await walletAnalyticsDataTablePut(walletAnalyticsRowObj)
    } catch (error) {
      throw new Error(`${method} Failed to add wallet analytics data table row.\n${error}`)
    }

    // AC: Not sure if this is needed.
    // // 6. TODO: Update the user data using Cognito IDP (the 'sid' property)
    // //
    // await this.tableUpdateWithIdpCredentials('sid', 'apps', appId, {})

    return appId
  }

  async getChatSupportAddress(anOrgDataObj, anAppId) {
    const method = 'getChatSupportAddress'
    log.debug(`${method} called for app id ${anAppId}`)

    // 0. Basic checks to make sure we can run this function.
    //
    if (!anOrgDataObj || !anAppId) {
      throw new Error(`${method} requires organization data and an app id.`)
    }
    if (!anOrgDataObj.apps || !anOrgDataObj.apps[anAppId]) {
      throw new Error(`${method} no organization data for application id ${anAppId}`)
    }

    // 1. Try to get the chat support wallet cipher text from the org data
    //
    let chatSupportWalletCipherText = undefined
    try {
      chatSupportWalletCipherText = anOrgDataObj.apps[anAppId].chat_support.wallet
    } catch (suppressedError) {
      log.warn(`${method} Application id ${anAppId} does not have chat support. Creating now...\n${suppressedError}`)
    }

    let chatSupportWallet = undefined
    if (chatSupportWalletCipherText) {
      // 2. a) If we were able to get the chat support wallet cipher text, then
      //       decrypt and return it to the user. Start by fetching this user's
      //       pri key to decrypt the org pri key:
      //    b) Now decrypt the org EC private key with the user's private key:
      //
      let orgEcPriKey = undefined
      try {
        orgEcPriKey = await this.getOrgEcPriKey(anOrgDataObj)
      } catch (error) {
        throw new Error(`${method} failed to restore organization private key.\n${error}`)
      }

      // 2. c) Now decrypt this apps chat support wallet with the org EC private key:
      //
      try {
        const chatSupportWalletStr = await eccrypto.decrypt(orgEcPriKey, chatSupportWalletCipherText)
        chatSupportWallet = jsonParseToBuffer(chatSupportWalletStr)
      } catch (error) {
        throw new Error(`${method} Failed to decrypt the organization chat support wallet locally.\n${error}`)
      }
    } else {
      // 3. a) If we were not able to get the chat support wallet cipher text, then
      //       create a chat support wallet (this feature was introduced mid-stream
      //       and not all users/ors have it) and an encrypted version of it for
      //       storing in the org data.
      //
      try {
        const publicKey = anOrgDataObj.cryptography.pub_key
        chatSupportWallet = ethers.Wallet.createRandom()
        const chatSupportWalletStr = JSON.stringify(chatSupportWallet)
        chatSupportWalletCipherText = await eccrypto.encrypt(publicKey, Buffer.from(chatSupportWalletStr))
      } catch (error) {
        throw new Error(`${method} failed creating and encrypting chat support wallet.\n${error}`)
      }

      // 3. b) Now store the new encrypted chat support wallet in the org data
      //       and return the the unencrypted support wallet to the user
      //
      try {
        anOrgDataObj.apps[anAppId].chat_support = {
          wallet: chatSupportWalletCipherText
        }
        // TODO: this could be an update expression for just the app not requireing
        //       the whole org updated (or refactor apps out)
        await organizationDataTablePut(anOrgDataObj)
      } catch (error) {
        throw new Error(`${method} failed to store newly created encrypted chat support wallet.\n${error}`)
      }
    }

    log.debug(`${method} returning a chat support wallet for app id ${anAppId}:\n` +
              `  address:   ${chatSupportWallet.signingKey.address}\n` +
              `  publicKey: ${chatSupportWallet.signingKey.publicKey}\n\n`)
    return chatSupportWallet
  }

  async getOrgEcPriKey(anOrgDataObj) {
    const method = 'getOrgEcPriKey'

    let userEcPriKey = undefined
    let orgEcPriKey = undefined

    try {
      const userEcPriKeyCipherText = this.persist.sid.pri_key_cipher_text
      userEcPriKey = await this.decryptWithKmsUsingIdpCredentials(userEcPriKeyCipherText)
    } catch (error) {
      throw new Error(`${method} failed to decrypt user's private key.\n${error}`)
    }

    try {
      const cipherObj = anOrgDataObj.cryptography.pri_key_ciphertexts[this.persist.userUuid]
      orgEcPriKey = await eccrypto.decrypt(userEcPriKey, cipherObj)
    } catch (error) {
      throw new Error(`${method} failed to decrypt organization private key.\n${error}`)
    }

    return orgEcPriKey
  }

  async getExportableOrgEcKey(anOrgDataObj, anEncoding='hex') {
    const orgEcPriKey = await this.getOrgEcPriKey(anOrgDataObj)
    return orgEcPriKey.toString(anEncoding)
  }


/******************************************************************************
 *                                                                            *
 * Cognito Related Methods                                                    *
 *                                                                            *
 ******************************************************************************/

  // TODO:
  //      - need a way to shortcut this if we already have the credentials
  //      - might make sense to store these in a hash and pass them to the
  //        appropriate method now that we have multiple IDP.
  //
  async requestIdpCredentials(
      aRegion=process.env.REACT_APP_REGION,
      aUserPoolId=USER_POOL_ID,
      anIdentityPoolId=process.env.REACT_APP_IDENTITY_POOL_ID ) {

    const session = await Auth.currentSession()

    AWS.config.region = aRegion
    const data = { UserPoolId: aUserPoolId }
    const cognitoLogin = `cognito-idp.${AWS.config.region}.amazonaws.com/${data.UserPoolId}`
    const logins = {}
    logins[cognitoLogin] = session.getIdToken().getJwtToken()

    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: anIdentityPoolId,
      Logins: logins
    })

    // Modified to use getPromise from:
    //    https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Credentials.html#get-property
    //
    await AWS.config.credentials.getPromise()
  }



/******************************************************************************
 *                                                                            *
 * HSM / KMS Related Methods                                                  *
 *                                                                            *
 ******************************************************************************/

  async encryptWithKmsUsingIdpCredentials(keyId, plainText) {
    await this.requestIdpCredentials(
      process.env.REACT_APP_REGION,
      USER_POOL_ID,
      process.env.REACT_APP_CRYPTO_IDENTITY_POOL_ID )

    // IMPORTANT AF:
    //
    // Never store this sub. It prevents us from being a money transmitter as
    // the only person who knows this value and can thus decrypt these cipher
    // texts is the Cognito user (as opposed to staff who can assume the
    // Cognito crypto role, but still don't have the Encryption context
    // required to decrypt the cipher text.)
    let NEVER_STORE_sub = undefined
    try {
      NEVER_STORE_sub = AWS.config.credentials.identityId
      log.debug(`DBG:  DB IDP NEVER_STORE_sub = ${NEVER_STORE_sub}`)
    } catch (error) {
      throw Error(`ERROR: getting credential identityId.\n${error}`)
    }

    // Now that the AWS creds are configured with the cognito login above, we
    // should be able to access the KMS key if we got the IAMs users/roles/grants
    // correct.
    const kms = new AWS.KMS( { region : process.env.REACT_APP_REGION } )

    const cipherText = await new Promise((resolve, reject) => {
      const params = {
        KeyId: keyId,
        Plaintext: plainText,
        EncryptionContext: {
          sub: NEVER_STORE_sub
        }
      }

      kms.encrypt(params, (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(data.CiphertextBlob)
        }
      })
    })

    return cipherText
  }


  async decryptWithKmsUsingIdpCredentials(cipherText) {
    await this.requestIdpCredentials(
      process.env.REACT_APP_REGION,
      USER_POOL_ID,
      process.env.REACT_APP_CRYPTO_IDENTITY_POOL_ID )

    // IMPORTANT AF:
    //
    // Never store this sub. It prevents us from being a money transmitter as
    // the only person who knows this value and can thus decrypt these cipher
    // texts is the Cognito user (as opposed to staff who can assume the
    // Cognito crypto role, but still don't have the Encryption context
    // required to decrypt the cipher text.)
    let NEVER_STORE_sub = undefined
    try {
      NEVER_STORE_sub = AWS.config.credentials.identityId
      log.debug(`DBG:  DB IDP NEVER_STORE_sub = ${NEVER_STORE_sub}`)
    } catch (error) {
      throw Error(`ERROR: getting credential identityId.\n${error}`)
    }

    // Now that the AWS creds are configured with the cognito login above, we
    // should be able to access the KMS key if we got the IAMs users/roles/grants
    // correct.
    const kms = new AWS.KMS( { region: process.env.REACT_APP_REGION } )

    const plainText = await new Promise((resolve, reject) => {
      const params = {
        // KeyId: <Not needed--built into cipher text>,
        CiphertextBlob: cipherText,
        EncryptionContext: {
          sub: NEVER_STORE_sub
        }
      }

      kms.decrypt(params, (err, data) => {
        if (err) {
          reject(err)
        } else {
          // TODO: probably stop string encoding this
          // resolve(data.Plaintext.toString('utf-8'))
          resolve(data.Plaintext)
        }
      })
    })

    return plainText
  }



/******************************************************************************
 *                                                                            *
 * DynamoDB Methods                                                           *
 *                                                                            *
 ******************************************************************************/

  // TODO:  For the table* methods below:
  //  - clean up, refactor, sensible accessors to commonly used tables
  //  - better separation and re-use with cognito

  // TODO: abstract the restricted sub out of this code so it's more generic and
  //       not just for restricted row access dynamos.
  async tableGetWithIdpCredentials() {
    await this.requestIdpCredentials()

    let sub = undefined
    try {
      sub = AWS.config.credentials.identityId
      log.debug(`DBG:  DB IDP sub = ${sub}`)
    } catch (error) {
      throw Error(`ERROR: getting credential identityId.\n${error}`)
    }

    const docClient = new AWS.DynamoDB.DocumentClient({
      region: process.env.REACT_APP_REGION })

    const dbParams = {
      Key: {
        sub: sub
      },
      TableName: process.env.REACT_APP_UD_TABLE,
    }
    const awsDynDbRequest = await new Promise(
      (resolve, reject) => {
        docClient.get(dbParams, (err, data) => {
          if (err) {
            reject(err)
          } else {
            resolve(data)
          }
        })
      }
    )

    return awsDynDbRequest
  }

  async tablePutWithIdpCredentials(keyValueData) {
    // Adapted from the JS on:
    //    https://aws.amazon.com/blogs/mobile/building-fine-grained-authorization-using-amazon-cognito-user-pools-groups/
    //
    await this.requestIdpCredentials()

    // Modified to use getPromise from:
    //    https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Credentials.html#get-property
    //
    let sub = undefined
    try {
      sub = AWS.config.credentials.identityId
      log.debug(`DBG:  DB IDP sub = ${sub}`)
    } catch (error) {
      throw Error(`ERROR: getting credential identityId.\n${error}`)
    }

    const docClient = new AWS.DynamoDB.DocumentClient(
      { region: process.env.REACT_APP_REGION })

    const item = {
      sub: sub
    }
    for (const k in keyValueData) {
      item[k] = keyValueData[k]
    }

    const dbParams = {
      Item: item,
      TableName: process.env.REACT_APP_UD_TABLE,
    }

    const awsDynDbRequest = await new Promise(
      (resolve, reject) => {
        docClient.put(dbParams, (err, data) => {
          if (err) {
            reject(err)
          } else {
            resolve(data)
          }
        })
      }
    )

    return awsDynDbRequest
  }
}


// Start of more mess
////////////////////////////////////////////////////////////////////////////////
let sidSvcs = undefined

console.log('Created global instance of SidServices')
console.log('/////////////////////////////////////////////////////////////////')

export function createSidSvcs(config) {
  const { appId } = config;

  if (!sidSvcs) {
    sidSvcs = new SidServices(appId)
  } else {
    log.warn('Sid Services already exists.')
  }
}

// TODO: cleanup this workaround for initialization order errors:
export function getSidSvcs() {
  if (!sidSvcs) {
    throw new Error('createSidSvcs must be called before getSidSvcs.')
  }

  return sidSvcs
}
