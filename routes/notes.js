const express = require("express");
const router = express.Router();
const c = require("../controllers/notesControllers");

router.post("/", c.creer);
router.put("/:id", c.modifier);
router.delete("/:id", c.supprimer);

module.exports = router;
