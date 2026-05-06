const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// @route   GET api/team/settings
// @desc    Get global team editing settings
// @access  Private
router.get('/settings', auth, teamController.getTeamSettings);

// @route   GET api/team/admin/stats
// @desc    Get admin dashboard stats
// @access  Private/Admin
router.get('/admin/stats', auth, admin, teamController.getAdminStats);

// @route   GET api/team/admin/users
// @desc    Get all registered users with their teams
// @access  Private/Admin
router.get('/admin/users', auth, admin, teamController.getAdminUsers);

// @route   PUT api/team/settings
// @desc    Update global team editing settings
// @access  Private/Admin
router.put('/settings', auth, admin, teamController.updateTeamSettings);

// @route   GET api/team
// @desc    Get user team
// @access  Private
router.get('/', auth, teamController.getTeam);

// @route   PUT api/team
// @desc    Replace entire team (confirm draft)
// @access  Private
router.put('/', auth, teamController.replaceTeam);

// @route   POST api/team/lock
// @desc    Lock team selection
// @access  Private
router.post('/lock', auth, teamController.lockTeam);

module.exports = router;
