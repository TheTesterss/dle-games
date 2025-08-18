const express = require("express");
const accountRoutes = require("./routes/account.routes");
const friendrequestRoutes = require("./routes/friendrequest.routes");
const friendsRoutes = require("./routes/friends.routes");
const cors = require("cors");
const path = require('node:path');
const fs = require('node:fs');
const multer = require('multer');
const app = express();
const uploadDir = path.join(__dirname, 'uploads');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = `${Date.now()}${ext}`;
        cb(null, name);
    }
});

const upload = multer({ storage });
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.post('/api/create_avatar_link', upload.single('avatar'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Avatar file is required" });
        }

        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;; 
        res.status(200).json({ url: fileUrl });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use("/api/accounts", accountRoutes);
app.use("/api/requests", friendrequestRoutes);
app.use("/api/friends", friendsRoutes);

module.exports = app;
