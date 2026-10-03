const router = require("express").Router();
const c = require("../controllers/contactController");

router.get("/", c.list);
router.get("/export/csv", c.exportCsv);

router.get("/:id", c.get);
router.put("/:id", c.update);
router.patch("/:id/toggle", c.toggle);
router.delete("/:id", c.remove);

module.exports = router;
