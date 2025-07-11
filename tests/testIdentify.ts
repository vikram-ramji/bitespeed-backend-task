import axios from "axios";

const baseURL = "http://localhost:3000"; // Change if needed

type ContactResponse = {
  contact: {
    primaryContactId: number;
    emails: string[];
    phoneNumbers: string[];
    secondaryContactIds: number[];
  };
};