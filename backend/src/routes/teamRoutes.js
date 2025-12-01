const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const auth = require('../middleware/auth');

// @route   GET api/team
// @desc    Get user team
// @access  Private
router.get('/', auth, teamController.getTeam);

// @route   POST api/team
// @desc    Add singer to team
// @access  Private
router.post('/', auth, teamController.addSinger);

// @route   DELETE api/team/:singerId
// @desc    Remove singer from team
// @access  Private
router.delete('/:singerId', auth, teamController.removeSinger);

// @route   POST api/team/lock
// @desc    Lock team selection
// @access  Private
router.post('/lock', auth, teamController.lockTeam);

module.exports = router;
