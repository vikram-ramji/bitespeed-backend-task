"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const identify_1 = require("./routes/identify");
const app = (0, express_1.default)();
app.use(express_1.default.json());
// TODO-5: Add Readme
// TODO-6: Deploy the backend api service
// TODO-7: Submit the task
app.get('/health', (req, res) => {
    res.status(200).json({
        status: "OK",
        message: "Server is running",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});
app.post("/identify", identify_1.IdentifyContact);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server listening on port 3000...");
});
