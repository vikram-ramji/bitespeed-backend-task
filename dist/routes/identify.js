"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentifyContact = void 0;
const contact_1 = require("../schemas/contact");
const client_1 = require("../db/client");
const IdentifyContact = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate request input/payload
    const parsed = contact_1.ContactInput.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            message: "Invalid Input"
        });
    }
    // Get the validated inputData fully typed
    const inputData = parsed.data;
    // Get all existing contacts with either the same email or phoneNumber
    let existingContacts = [];
    try {
        existingContacts = yield client_1.prisma.contact.findMany({
            where: {
                OR: [
                    ...(inputData.email ? [{ email: inputData.email }] : []),
                    ...(inputData.phoneNumber ? [{ phoneNumber: inputData.phoneNumber }] : [])
                ]
            }
        });
    }
    catch (error) {
        console.error("Error fetching existing contacts:", error);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
    // if there are no existing contact, create a primary contact with input
    if (existingContacts.length === 0) {
        try {
            const newContact = yield client_1.prisma.contact.create({
                data: {
                    email: inputData.email,
                    phoneNumber: inputData.phoneNumber
                }
            });
            return res.status(200).json({
                contact: {
                    primaryContactId: newContact.id,
                    emails: [newContact.email].filter(Boolean),
                    phoneNumbers: [newContact.phoneNumber].filter(Boolean),
                    secondaryContactIds: []
                }
            });
        }
        catch (error) {
            console.error("Error creating new contact:", error);
            return res.status(500).json({
                message: "Internal Server Error"
            });
        }
    }
    // get the primary contacts
    const primaryContacts = existingContacts.filter(contact => contact.linkPrecedence === "primary");
    let primaryContact = primaryContacts[0];
    // if there are multiple primary contacts, the oldest contact must remail primary while all others
    // must be changed to secondary contacts
    if (primaryContacts.length > 1) {
        primaryContact = primaryContacts.reduce((previousContact, currentContact) => currentContact.createdAt < previousContact.createdAt ? currentContact : previousContact);
        const otherPrimaryIds = primaryContacts
            .filter(contact => contact.id !== primaryContact.id)
            .map(contact => contact.id);
        try {
            yield client_1.prisma.contact.updateMany({
                where: {
                    id: { in: otherPrimaryIds }
                },
                data: {
                    linkedId: primaryContact.id,
                    linkPrecedence: "secondary",
                    updatedAt: new Date()
                }
            });
        }
        catch (error) {
            console.error("Error updating contacts:", error);
            res.status(500).json({
                message: "Internal Server Error"
            });
        }
    }
    // Check if the input contact is already known
    const alreadyKnown = existingContacts.some(contact => {
        const emailMatch = inputData.email ? contact.email === inputData.email : true;
        const phoneMatch = inputData.phoneNumber ? contact.phoneNumber === inputData.phoneNumber : true;
        return emailMatch && phoneMatch;
    });
    // If there is new information, create a secondary contact
    if (!alreadyKnown) {
        try {
            yield client_1.prisma.contact.create({
                data: {
                    email: inputData.email || null,
                    phoneNumber: inputData.phoneNumber || null,
                    linkedId: primaryContact === null || primaryContact === void 0 ? void 0 : primaryContact.id,
                    linkPrecedence: "secondary"
                }
            });
        }
        catch (error) {
            console.error("Error creating secondary contact:", error);
            res.status(500).json({
                message: "Internal Server Error"
            });
        }
    }
    // Fetch all the linked contacts
    const allLinkedContacts = yield client_1.prisma.contact.findMany({
        where: {
            OR: [
                { linkedId: primaryContact.id }
            ]
        }
    });
    // Build the response data
    const linkedEmails = [
        ...new Set([
            primaryContact === null || primaryContact === void 0 ? void 0 : primaryContact.email, //Ensuring the first email is primary email
            ...allLinkedContacts.map(contact => contact.email).filter(Boolean)
        ])
    ];
    const linkedPhoneNumbers = [
        ...new Set([
            primaryContact === null || primaryContact === void 0 ? void 0 : primaryContact.phoneNumber, //Ensuring the first phone-number is primary phone-number
            ...allLinkedContacts.map(contact => contact.phoneNumber).filter(Boolean)
        ])
    ];
    const secondaryContactIds = allLinkedContacts
        .filter(contact => contact.linkPrecedence === "secondary")
        .map(contact => contact.id);
    // Resturn response as json
    return res.status(200).json({
        contact: {
            primaryContactId: primaryContact === null || primaryContact === void 0 ? void 0 : primaryContact.id,
            emails: linkedEmails,
            phoneNumbers: linkedPhoneNumbers,
            secondaryContactIds: secondaryContactIds
        }
    });
});
exports.IdentifyContact = IdentifyContact;
