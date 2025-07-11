import express from "express"
import { IdentifyContact } from "./routes/identify"

const app = express()

app.use(express.json())

// TODO-5: Add Readme
// TODO-6: Deploy the backend api service
// TODO-7: Submit the task

app.post("/identify", IdentifyContact)

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log("Server listening on port 3000...")
})