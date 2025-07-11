import zod from "zod";

export const ContactInput = zod.object({
    email: zod.email().optional(),
    phoneNumber: zod.string().optional()
}).refine(
    data => data.email || data.phoneNumber,
    { message: "At least one of email or phoneNumber is required" }
)