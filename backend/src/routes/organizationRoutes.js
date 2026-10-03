const router = require("express").Router();
const c = require("../controllers/organizationController");

// Static paths must be registered before "/:id" so they are not captured by it.
router.get("/", c.list);
router.get("/options", c.options);
router.get("/export/csv", c.exportCsv);
router.post("/", c.create);

router.get("/:id", c.get);
router.put("/:id", c.update);
router.patch("/:id/toggle", c.toggle);
router.delete("/:id", c.remove);

router.get("/:id/contacts", c.listContacts);
router.post("/:id/contacts", c.createContact);

module.exports = router;
