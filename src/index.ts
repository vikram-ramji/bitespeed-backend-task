import express from "express"
import { IdentifyContact } from "./routes/identify"

const app = express()

app.use(express.json())

// TODO-3: Add modularity by seperating the route to ./routes/identify.ts and zod type to ./schemas/contact.ts
// TODO-4: Recheck and finalize code for deployment / submission
// TODO-5: Add Readme
// TODO-6: Deploy the backend api service
// TODO-7: Submit the task

app.post("/identify", IdentifyContact)

app.listen(3000, () => {
    console.log("Server listening on port 3000...")
})