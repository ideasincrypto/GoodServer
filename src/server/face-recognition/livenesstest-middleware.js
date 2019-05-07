// @flow
import _ from 'lodash'
import axios from 'axios'
import multer from 'multer'
import jwt from 'jsonwebtoken'
import passport from 'passport'
import { Router } from 'express'
import FormData from 'form-data'
import conf from '../server.config'
import { get, defaults } from 'lodash'
import logger from '../../imports/pino-logger'
import { wrapAsync, lightLogs } from '../utils/helpers'

const setup = (app: Router) => {
  var storage = multer.memoryStorage()
  //var upload = multer({ dest: 'uploads/' }) // to handle blob parameters of faceReco
  var upload = multer({ storage: storage })
  app.post(
    '/livetest/enroll',
    passport.authenticate('jwt', { session: false }),
    upload.any(),
    wrapAsync(async (req, res, next) => {
      const log = req.log.child({ from: 'livenesstest' })
      const { body, files, user } = req
      const livenessApi = conf.faceRecoServer + '/users'
      log.debug(`Sending request to: ${livenessApi}`)
      let form = new FormData()
      let facemap = _.find(files, { fieldname: 'facemap' }).buffer
      let auditTrailImage = _.find(files, { fieldname: 'auditTrailImage' }).buffer
      log.trace('finished loading buffer ')
      form.append('name', user.fullName)
      log.trace({ user })
      form.append('email', user.email)
      form.append('session_id', body.sessionId)
      form.append('facemap', facemap)
      form.append('audit_trail_image', auditTrailImage)

      let response = await axios({
        method: 'post',
        url: livenessApi,
        data: form,
        headers: {
          'Content-Type': `multipart/form-data; boundary=${form._boundary}`
        }
      })
      log.trace({ response })
      res.json({ ok: 1 })
    })
  )
}

export default setup
