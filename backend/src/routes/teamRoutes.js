const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// @route   GET api/team/settings
// @desc    Get global team editing settings
// @access  Private
router.get('/settings', auth, teamController.getTeamSettings);

// @route   PUT api/team/settings
// @desc    Update global team editing settings
// @access  Private/Admin
router.put('/settings', auth, admin, teamController.updateTeamSettings);

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
