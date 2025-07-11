import express, { Request, response, Response } from "express"
import zod from "zod"
import { prisma } from "./db/client"

const app = express()

app.use(express.json())

// TODO-2: Test the functionality of enpoint by creating a automated test script running all the possible cases.
// TODO-3: Add modularity by seperating the route to ./routes/identify.ts and zod type to ./schemas/contact.ts
// TODO-4: Recheck and finalize code for deployment / submission
// TODO-5: Add Readme
// TODO-6: Deploy the backend api service
// TODO-7: Submit the task

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
    let existingContacts = []
    try {
        existingContacts = await prisma.contact.findMany({
            where: {
                OR: [
                    {email: inputData.email},
                    {phoneNumber: inputData.phoneNumber}
                ]
            }
        })
    } catch (error) {
        console.error("Error fetching existing contacts:", error)
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }

    // if there are no existing contact, create a primary contact with input
    if (existingContacts.length === 0) {
        try {
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
        } catch (error) {
            console.error("Error creating new contact:", error)
            return res.status(500).json({
                message: "Internal Server Error"
            })
        }
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
        
        try {
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
        } catch (error) {
            console.error("Error updating contacts:", error)
            res.status(500).json({
                message: "Internal Server Error"
            })
        }
    }

    // check if the input contact details is already known
    const alreadyKnown = existingContacts
        .some(contact => contact.email === inputData.email && contact.phoneNumber === inputData.phoneNumber)

    // If there is new information, create a secondary contact
    if (!alreadyKnown) {
        try {
            await prisma.contact.create({
                data: {
                    email: inputData.email,
                    phoneNumber: inputData.phoneNumber,
                    linkedId: primaryContact?.id,
                    linkPrecedence: "secondary"
                }
            })
        } catch (error) {
            console.error("Error creating secondary contact:", error)
            res.status(500).json({
                message: "Internal Server Error"
            })
        }
    }

    // Fetch all the linked contacts
    const allLinkedContacts = await prisma.contact.findMany({
        where: {
            OR: [
                {linkedId: primaryContact.id}
            ]
        }
    })

    // Build the response data
    const linkedEmails = [
        ...new Set([
            primaryContact?.email, //Ensuring the first email is primary email
            ...allLinkedContacts.map(contact => contact.email).filter(Boolean)
        ])
    ]

    const linkedPhoneNumbers = [
        ...new Set([
            primaryContact?.phoneNumber, //Ensuring the first phone-number is primary phone-number
            ...allLinkedContacts.map(contact => contact.phoneNumber).filter(Boolean)
        ])
    ]

    const secondaryContactIds = allLinkedContacts
        .filter(contact => contact.linkPrecedence === "secondary")
        .map(contact => contact.id)

    // Resturn response as json
    return res.status(200).json({
        contact: {
            primaryContactId: primaryContact?.id,
            emails: linkedEmails,
            phoneNumbers: linkedPhoneNumbers,
            secondaryContactIds: secondaryContactIds
        }
    })
})

app.listen(3000, () => {
    console.log("Server listening on port 3000...")
})