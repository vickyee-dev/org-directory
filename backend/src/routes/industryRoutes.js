const router = require("express").Router();
const c = require("../controllers/industryController");

router.get("/", c.list);
router.post("/", c.create);
router.put("/:id", c.update);
router.patch("/:id/toggle", c.toggle);
router.delete("/:id", c.remove);

module.exports = router;
