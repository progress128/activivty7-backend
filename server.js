require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

// --- 1. DATABASE INITIALIZATION ---
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

const row = db.prepare("SELECT COUNT(*) AS count FROM records").get();
if (row.count === 0) {
  const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
  db.exec(seed);
  console.log("Database seeded with 8 initial records.");
}

// --- 2. API GUIDE ROUTE (GET /) ---
app.get("/", (req, res) => {
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Campus Maintenance API Guide</title>
      <style>
        body { font-family: system-ui, sans-serif; line-height: 1.6; padding: 2rem; max-width: 800px; margin: auto; }
        code { background: #f4f4f4; padding: 0.2rem 0.4rem; border-radius: 4px; }
        pre { background: #f4f4f4; padding: 1rem; border-radius: 4px; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
        th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
        th { background: #f4f4f4; }
      </style>
    </head>
    <body>
      <h1>Campus Maintenance API Guide</h1>
      <p><strong>Project:</strong> Campus Maintenance Requests</p>
      <p><strong>Student Number:</strong> [YOUR STUDENT NUMBER HERE]</p>
      <p><strong>Description:</strong> A backend API to manage maintenance requests such as broken lights, taps, or furniture on campus.</p>
      
      <p><strong>Base URL:</strong> <code>https://activivty6-backend.onrender.com</code> (Update this to your Render URL once hosted)</p>
      
      <h2>Required Routes</h2>
      <table>
        <tr><th>Method</th><th>Route</th><th>Purpose</th></tr>
        <tr><td>GET</td><td>/</td><td>Show this API guide</td></tr>
        <tr><td>GET</td><td>/health</td><td>Check server and database health</td></tr>
        <tr><td>GET</td><td>/api/records</td><td>Get all records</td></tr>
        <tr><td>GET</td><td>/api/records/:id</td><td>Get a single record</td></tr>
        <tr><td>POST</td><td>/api/records</td><td>Create a new record</td></tr>
        <tr><td>PUT</td><td>/api/records/:id</td><td>Update a record</td></tr>
        <tr><td>DELETE</td><td>/api/records/:id</td><td>Delete a record</td></tr>
      </table>

      <h2>Data Fields</h2>
      <ul>
        <li><code>title</code>: Text (3-80 characters)</li>
        <li><code>category</code>: Text (2-40 characters)</li>
        <li><code>description</code>: Text (5-300 characters)</li>
        <li><code>status</code>: Exactly "Pending", "In progress", or "Completed"</li>
      </ul>

      <h2>Example POST / PUT Body</h2>
      <pre><code>{
  "title": "Broken classroom light",
  "category": "Electrical",
  "description": "The light in Room B12 does not switch on.",
  "status": "Pending"
}</code></pre>

      <h2>Status Codes</h2>
      <ul>
        <li><strong>200 OK:</strong> Successful GET, PUT, DELETE</li>
        <li><strong>201 Created:</strong> Successful POST</li>
        <li><strong>400 Bad Request:</strong> Invalid input or malformed JSON</li>
        <li><strong>404 Not Found:</strong> Record or route does not exist</li>
        <li><strong>500 Internal Server Error:</strong> Unexpected server failure</li>
      </ul>

      <p><em>Note: If this API is hosted on a free service like Render, it may take up to 50 seconds to wake up from an idle state on the first request.</em></p>
    </body>
    </html>
  `);
});

// --- 3. HEALTH CHECK ROUTE ---
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running and database is connected." });
});

// --- 4. MOUNT RECORD ROUTES ---
app.use("/api/records", require("./routes/records"));

// --- 5. ERROR HANDLING ---
// Handle Malformed JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: "Malformed JSON in request body." });
  }
  next(err);
});

// Handle Unknown Routes (404)
app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// General Error Handler (500)
app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);
  res.status(500).json({ message: "An unexpected error occurred on the server." });
});

// --- 6. START SERVER ---
const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});