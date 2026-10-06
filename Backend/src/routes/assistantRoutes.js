const express = require('express');
const {
  getAssistants,
  updateAssistantStatus,
  assignDoctor,
  deleteAssistant,
} = require('../controllers/assistantController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// All assistant management routes are restricted to authenticated Admins
router.use(protect, requireAdmin);

router.get('/', getAssistants);
router.put('/:id/status', updateAssistantStatus);
router.put('/:id/assign-doctor', assignDoctor);
router.delete('/:id', deleteAssistant);

module.exports = router;
