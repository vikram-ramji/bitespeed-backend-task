"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactInput = void 0;
const zod_1 = __importDefault(require("zod"));
exports.ContactInput = zod_1.default.object({
    email: zod_1.default.email().optional(),
    phoneNumber: zod_1.default.string().optional()
}).refine(data => data.email || data.phoneNumber, { message: "At least one of email or phoneNumber is required" });
