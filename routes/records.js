const express = require("express");
const router = express.Router();
const db = require("../db");

// Helper function for validation
function validateRecord(body) {
  const errors = [];

  // 1. Check if fields are strings
  if (typeof body.title !== "string" || typeof body.category !== "string" || 
      typeof body.description !== "string" || typeof body.status !== "string") {
    errors.push("All fields (title, category, description, status) must be text.");
    return errors; // Stop here if types are wrong
  }

  // 2. Trim spaces
  const title = body.title.trim();
  const category = body.category.trim();
  const description = body.description.trim();
  const status = body.status.trim();

  // 3. Check lengths
  if (title.length < 3 || title.length > 80) errors.push("Title must have 3 to 80 characters.");
  if (category.length < 2 || category.length > 40) errors.push("Category must have 2 to 40 characters.");
  if (description.length < 5 || description.length > 300) errors.push("Description must have 5 to 300 characters.");

  // 4. Check Status
  const allowedStatuses = ["Pending", "In progress", "Completed"];
  if (!allowedStatuses.includes(status)) {
    errors.push("Status must be exactly 'Pending', 'In progress', or 'Completed'.");
  }

  return errors;
}

// GET all records
router.get("/", (req, res, next) => {
  try {
    const rows = db.prepare("SELECT * FROM records ORDER BY id").all();
    res.status(200).json(rows);
  } catch (error) {
    next(error);
  }
});

// GET one record by ID
router.get("/:id", (req, res, next) => {
  try {
    const id = req.params.id;
    
    // Check if ID is a positive integer
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ message: "ID must be a positive whole number." });
    }

    const row = db.prepare("SELECT * FROM records WHERE id = ?").get(id);
    
    if (!row) {
      return res.status(404).json({ message: "Record not found." });
    }
    
    res.status(200).json(row);
  } catch (error) {
    next(error);
  }
});

// POST create a new record
router.post("/", (req, res, next) => {
  try {
    const errors = validateRecord(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ message: errors[0] }); // Send the first error
    }

    // Trim inputs before saving
    const title = req.body.title.trim();
    const category = req.body.category.trim();
    const description = req.body.description.trim();
    const status = req.body.status.trim();

    // Insert into DB. Note: We ignore any ID the client might have sent.
    const info = db.prepare(
      "INSERT INTO records (title, category, description, status) VALUES (?, ?, ?, ?)"
    ).run(title, category, description, status);

    // Fetch the newly created record to return it
    const newRecord = db.prepare("SELECT * FROM records WHERE id = ?").get(info.lastInsertRowid);
    res.status(201).json(newRecord);

  } catch (error) {
    next(error);
  }
});

// PUT update an existing record
router.put("/:id", (req, res, next) => {
  try {
    const id = req.params.id;
    
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ message: "ID must be a positive whole number." });
    }

    const errors = validateRecord(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ message: errors[0] });
    }

    const title = req.body.title.trim();
    const category = req.body.category.trim();
    const description = req.body.description.trim();
    const status = req.body.status.trim();

    // Update in DB
    const info = db.prepare(
      "UPDATE records SET title = ?, category = ?, description = ?, status = ? WHERE id = ?"
    ).run(title, category, description, status, id);

    // If nothing was updated, the record didn't exist
    if (info.changes === 0) {
      return res.status(404).json({ message: "Record not found." });
    }

    // Fetch the updated record
    const updatedRecord = db.prepare("SELECT * FROM records WHERE id = ?").get(id);
    res.status(200).json(updatedRecord);

  } catch (error) {
    next(error);
  }
});

// DELETE a record
router.delete("/:id", (req, res, next) => {
  try {
    const id = req.params.id;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ message: "ID must be a positive whole number." });
    }

    const info = db.prepare("DELETE FROM records WHERE id = ?").run(id);

    if (info.changes === 0) {
      return res.status(404).json({ message: "Record not found." });
    }

    res.status(200).json({ message: "Record deleted." });

  } catch (error) {
    next(error);
  }
});

module.exports = router;