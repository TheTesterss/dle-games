const express = require("express");
const accountRoutes = require("./routes/account.routes");
const friendrequestRoutes = require("./routes/friendrequest.routes");
const forumRoutes = require("./routes/forum.routes");
const friendsRoutes = require("./routes/friends.routes");
const cors = require("cors");
const path = require("node:path");
const fs = require("node:fs");
const multer = require("multer");
const app = express();
const uploadDir = path.join(__dirname, "uploads");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}${ext}`;
    cb(null, name);
  },
});

app.use((req, res, next) => {
  req.setTimeout(300000); 
  res.setTimeout(300000); 
  next();
});

const upload = multer({ storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
    fieldSize: 50 * 1024 * 1024,
    fieldNameSize: 1000,
    fields: 10,
    files: 5
  }
 });
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
  maxAge: 86400
}));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.post("/api/create_link", upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]), (req, res) => {
  try {
    let file;
    let type;

    if (req.files.avatar) {
      file = req.files.avatar[0];
      type = 'avatar';
    } else if (req.files.image) {
      file = req.files.image[0];
      type = 'image';
    } else {
      return res.status(400).json({ message: "File is required" });
    }

    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;
    res.status(200).json({ url: fileUrl });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


app.use("/api/accounts", accountRoutes);
app.use("/api/requests", friendrequestRoutes);
app.use("/api/friends", friendsRoutes);
app.use("/api/forum", forumRoutes);

module.exports = app;
