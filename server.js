const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const mongoUri = process.env.MONGO_URI;
let connectionPromise;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

async function connectToDatabase() {
    if (mongoose.connection.readyState === 1) return;
    if (!mongoUri) throw new Error("MONGO_URI is not configured");

    if (!connectionPromise) {
        connectionPromise = mongoose.connect(mongoUri)
            .catch((error) => {
                connectionPromise = undefined;
                throw error;
            });
    }

    await connectionPromise;
}

app.use("/api", async (req, res, next) => {
    try {
        await connectToDatabase();
        next();
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        res.status(503).json({ message: "Database is unavailable. Check the server configuration." });
    }
});

// Leave Schema
const leaveSchema = new mongoose.Schema({
    employeeName: {
        type: String,
        required: true
    },

    leaveType: {
        type: String,
        required: true,
        enum: ["Casual Leave", "Sick Leave", "Medical Leave", "Personal Leave"]
    },

    startDate: {
        type: Date,
        required: true
    },

    endDate: {
        type: Date,
        required: true
    },

    reason: {
        type: String,
        required: true
    },

    status: {
        type: String,
        enum: ["Pending", "Approved", "Rejected"],
        default: "Pending"
    }

}, {
    timestamps: true
});

// MongoDB Model
const Leave = mongoose.model("Leave", leaveSchema);


// 1. Apply for Leave
app.post("/api/leaves", async (req, res) => {

    try {

        const {
            employeeName,
            leaveType,
            startDate,
            endDate,
            reason
        } = req.body;

        if (!employeeName || !leaveType ||
            !startDate || !endDate || !reason) {

            return res.status(400).json({
                message: "Please fill all fields"
            });

        }

        if (Number.isNaN(Date.parse(startDate)) || Number.isNaN(Date.parse(endDate))) {
            return res.status(400).json({ message: "Please provide valid leave dates" });
        }

        if (new Date(endDate) < new Date(startDate)) {
            return res.status(400).json({
                message: "End date cannot be before start date"
            });
        }

        const newLeave = new Leave({
            employeeName,
            leaveType,
            startDate,
            endDate,
            reason
        });

        await newLeave.save();

        res.status(201).json({
            message: "Leave application submitted successfully!",
            leave: newLeave
        });

    } catch (error) {

        console.error("Error applying for leave:", error.message);
        res.status(500).json({ message: "Error applying for leave" });

    }

});


// 2. Get All Leave Requests
app.get("/api/leaves", async (req, res) => {

    try {

        const leaves = await Leave.find().sort({
            createdAt: -1
        });

        res.json(leaves);

    } catch (error) {

        console.error("Error fetching leave requests:", error.message);
        res.status(500).json({
            message: "Error fetching leave requests"
        });

    }

});


// 3. Approve or Reject Leave
app.patch("/api/leaves/:id", async (req, res) => {

    try {

        const { status } = req.body;

        if (!["Approved", "Rejected"].includes(status)) {
            return res.status(400).json({
                message: "Invalid leave status"
            });
        }

        const leave = await Leave.findByIdAndUpdate(
            req.params.id,
            { status: status },
            { new: true, runValidators: true }
        );

        if (!leave) {
            return res.status(404).json({
                message: "Leave request not found"
            });
        }

        res.json({
            message: `Leave ${status} successfully!`,
            leave
        });

    } catch (error) {

        if (error.name === "CastError") {
            return res.status(400).json({ message: "Invalid leave request ID" });
        }

        console.error("Error updating leave status:", error.message);
        res.status(500).json({
            message: "Error updating leave status"
        });

    }

});


// Vercel imports the Express app as a serverless function. Keep a listener for local use.
if (require.main === module) {
    app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
}

module.exports = app;

