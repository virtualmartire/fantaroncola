const express = require('express');
const router = express.Router();
const singerController = require('../controllers/singerController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// @route   GET api/singers
// @desc    Get all singers
// @access  Public
router.get('/', singerController.getAllSingers);

// @route   POST api/singers
// @desc    Create a singer
// @access  Private/Admin
router.post('/', auth, admin, singerController.createSinger);

// @route   PUT api/singers/:id
// @desc    Update a singer
// @access  Private/Admin
router.put('/:id', auth, admin, singerController.updateSinger);

// @route   DELETE api/singers/:id
// @desc    Delete a singer
// @access  Private/Admin
router.delete('/:id', auth, admin, singerController.deleteSinger);

module.exports = router;
