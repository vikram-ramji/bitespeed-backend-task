import express, { Request, Response } from "express"
import zod from "zod"
import { prisma } from "./db/client"

const app = express()

app.use(express.json())

const ContactInput = zod.object({
    email: zod.email().optional(),
    phoneNumber: zod.string().optional()
}).refine(
    data => data.email || data.phoneNumber,
    { message: "At least one of email or phoneNumber is required" }
)

app.post("/identify", async (req: Request, res: Response) => {
    // Validate request input/payload
    const parsed = ContactInput.safeParse(req.body)

    if (!parsed.success) {
        return res.status(400).json({
            message: "Invalid Input"
        })
    }

    // Get the validated inputData fully typed
    const inputData = parsed.data

    // Get all existing contacts with either the same email or phoneNumber
    const existingContacts = await prisma.contact.findMany({
        where: {
            OR: [
                {email: inputData.email},
                {phoneNumber: inputData.phoneNumber}
            ]
        }
    })

    // if there are no existing contact, create a primary contact with input
    if (existingContacts.length === 0) {
        const newContact = await prisma.contact.create({
            data: {
                email: inputData.email,
                phoneNumber: inputData.phoneNumber
            }
        })

        return res.status(200).json({
            contact: {
                primaryContactId: newContact.id,
                emails: [newContact.email].filter(Boolean),
                phoneNumbers: [newContact.phoneNumber].filter(Boolean),
                secondaryContactIds: []
            }
        })
    }
})

app.listen(3000, () => {
    console.log("Server listening on port 3000...")
})