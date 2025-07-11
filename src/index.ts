import express, { Request, Response } from "express"

const app = express()

app.use(express.json)

app.post("/identify", (req: Request, res: Response) => {
    // Identity Reconciliation logic
})

app.listen(3000, () => {
    console.log("Server listening on port 3000...")
})