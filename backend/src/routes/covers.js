const express = require('express')
const AppError = require('../errors/AppError')
const openLibrary = require('../services/openLibrary')

const router = express.Router()

const ALLOWED_SIZES = ['S', 'M', 'L']

router.get('/:coverId', async (req, res, next) => {
  try {
    const coverId = Number(req.params.coverId)
    if (!Number.isInteger(coverId) || coverId <= 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ', [
        { field: 'coverId', message: 'coverId phải là số nguyên dương' },
      ])
    }

    const size = String(req.query.size || 'M').toUpperCase()
    if (!ALLOWED_SIZES.includes(size)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ', [
        { field: 'size', message: `size phải là một trong ${ALLOWED_SIZES.join(', ')}` },
      ])
    }

    const { body, contentType } = await openLibrary.fetchCover(coverId, size)

    res.set('Content-Type', contentType)
    res.set('Cache-Control', 'public, max-age=86400')
    res.send(body)
  } catch (err) {
    next(err)
  }
})

module.exports = router
