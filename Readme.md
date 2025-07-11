# Bitespeed Identity Consolidation API

Backend service for identifying and consolidating customer identities based on email and phone number.

**Live API:** https://bitespeed-backend-task-pylm.onrender.com/identify

## Tech Stack

- Node.js + TypeScript
- Express.js
- Prisma ORM
- PostgreSQL
- Zod validation
- Deployed on Render

## API Usage

### POST /identify

Consolidates contact information to identify customers across multiple touchpoints.

**Request:**
```json
{
  "email": "user@example.com",
  "phoneNumber": "1234567890"
}
```

At least one field (email or phoneNumber) is required.

**Response:**
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["user@example.com", "user.alt@example.com"],
    "phoneNumbers": ["1234567890", "0987654321"],
    "secondaryContactIds": [2, 3]
  }
}
```

## Local Setup

1. Clone the repo:
```bash
git clone https://github.com/vikram-ramji/bitespeed-backend-task.git
cd bitespeed-backend-task
```

2. Configure environment:
```bash
# .env
DATABASE_URL=postgresql://user:password@localhost:5432/database
PORT=3000
```

3. Setup database:
```bash
pnpm prisma migrate dev
```

4. Build and run:
```bash
pnpm build
pnpm start
```

## Testing

Run the test suite:
```bash
pnpm dlx ts-node tests/testIdentify.ts
```
- Change the input values in test cases to avoid duplicates

## Implementation Details

The service handles several scenarios:
- New contacts become primary
- Duplicate information doesn't create new records
- New email/phone for existing contact creates secondary link
- Multiple primary contacts get merged (oldest remains primary)

Built with proper error handling, input validation, and modular code structure.

---

**Author:** Vikram Ramji Iyer
**Email:** vikramramji24@gmail.com
