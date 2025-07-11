import express from "express"
import { IdentifyContact } from "./routes/identify"

const app = express()

app.use(express.json())

// health check for deployment
app.get('/health', (req, res) => {
    res.status(200).json({
        status: "OK",
        message: "Server is running",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    })
})

app.post("/identify", IdentifyContact)

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log("Server listening on port 3000...")
})