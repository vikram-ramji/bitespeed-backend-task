import axios from "axios"

const baseURL = "http://localhost:3000" // Change if needed

type ContactResponse = {
  contact: {
    primaryContactId: number
    emails: string[]
    phoneNumbers: string[]
    secondaryContactIds: number[]
  }
}

const testCases = [
  {
    description: "Case 1: New email & phone — should create primary",
    input: { email: "test1@gmail.com", phoneNumber: "1000000000" },
  },
  {
    description: "Case 2: Same input again — no new contact",
    input: { email: "test1@gmail.com", phoneNumber: "1000000000" },
  },
  {
    description: "Case 3: Same phone, new email — should create secondary",
    input: { email: "test2@gmail.com", phoneNumber: "1000000000" },
  },
  {
    description: "Case 4: Same email, new phone — should create secondary",
    input: { email: "test1@gmail.com", phoneNumber: "2000000000" },
  },
  {
    description: "Case 5: Only phone — match with primary",
    input: { phoneNumber: "1000000000" },
  },
  {
    description: "Case 6: Only email — match with primary",
    input: { email: "test1@gmail.com" },
  },
  {
    description: "Case 7a: Create first primary contact",
    input: { email: "john.doe@example.com", phoneNumber: "919191" },
  },
  {
    description: "Case 7b: Create second primary contact",
    input: { email: "jane.smith@company.org", phoneNumber: "717171" },
  },
  {
    description: "Case 7c: Merge two primaries — older one remains primary, newer becomes secondary",
    input: { email: "john.doe@example.com", phoneNumber: "717171" },
    setupNote: "This should link the two separate primary contacts created in 7a and 7b, making the older one primary",
  },
  {
    description: "Case 8: Missing input — should return 400",
    input: {},
    expectFailure: true,
  },
];

(async () => {
  let primaryId: number | null = null

  for (const testCase of testCases) {
    try {
      const res = await axios.post<ContactResponse>(`${baseURL}/identify`, testCase.input)
      const data = res.data.contact

      console.log(testCase.description)

      if (testCase.setupNote) {
        console.log(testCase.setupNote)
      }
      
      console.log("Input:", testCase.input)
      console.log("Response:", data)

      // Save primary ID from Case 1 for validation
      if (testCase.description.includes("Case 1")) {
        primaryId = data.primaryContactId
      }

      // Validate primary consistency
      if (
        primaryId &&
        testCase.description.startsWith("Case") &&
        !testCase.description.startsWith("Case 1") &&
        !testCase.description.startsWith("Case 7") // Case 7 allows merge
      ) {
        if (data.primaryContactId !== primaryId) {
          console.warn(
            `Expected primaryContactId to be ${primaryId}, but got ${data.primaryContactId}`
          )
        }
      }
    } catch (err: any) {
      if (testCase.expectFailure) {
        console.log(`${testCase.description} (Properly failed as expected)`)
        console.log("Error response:", err.response?.data)
      } else {
        console.error(`${testCase.description}`)
        if (err.response) {
          console.error("Response:", err.response.data)
        } else {
          console.error(err.message)
        }
      }
    }

    console.log("#----------------------------#")
  }
})()
