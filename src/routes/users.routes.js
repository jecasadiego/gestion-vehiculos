const express = require("express");
const { asyncHandler } = require("../utils/http");
const {
  listUsersController,
  getUserController,
  createUserController,
  updateUserController,
} = require("../controllers/users.controller");

const router = express.Router();

router.get("/", asyncHandler(listUsersController));
router.get("/:id", asyncHandler(getUserController));
router.post("/", asyncHandler(createUserController));
router.put("/:id", asyncHandler(updateUserController));

module.exports = router;
