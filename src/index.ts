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

    // get the primary contacts
    const primaryContacts = existingContacts.filter(contact => contact.linkPrecedence === "primary")
    let primaryContact = primaryContacts[0]

    // if there are multiple primary contacts, the oldest contact must remail primary while all others
    // must be changed to secondary contacts
    if (primaryContacts.length > 1) {
        primaryContact = primaryContacts.reduce(
            (previousContact, currentContact) => 
                currentContact.createdAt < previousContact.createdAt ? currentContact : previousContact
        )
        
        const otherPrimaryIds = primaryContacts
            .filter(contact => contact.id !== primaryContact.id)
            .map(contact => contact.id)
        
        await prisma.contact.updateMany({
            where: {
                id: {in: otherPrimaryIds}
            },
            data: {
                linkedId: primaryContact.id,
                linkPrecedence: "secondary",
                updatedAt: new Date()
            }
        })
    }
    // check if the input contact details is already known
    const alreadyKnown = existingContacts
        .some(contact => contact.email === inputData.email && contact.phoneNumber === inputData.phoneNumber)

    // If there is new information, create a secondary contact
    if (!alreadyKnown) {
        await prisma.contact.create({
            data: {
                email: inputData.email,
                phoneNumber: inputData.phoneNumber,
                linkedId: primaryContact?.id,
                linkPrecedence: "secondary"
            }
        })
    }

})

app.listen(3000, () => {
    console.log("Server listening on port 3000...")
})