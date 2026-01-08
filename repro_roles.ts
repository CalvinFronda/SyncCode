import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const BASE_URL = "http://localhost:3000";

async function runTest() {
  const roomId = uuidv4();
  const browserId1 = uuidv4();
  const browserId2 = uuidv4();
  const browserId3 = uuidv4();

  console.log(`--- Starting Test for Room: ${roomId} ---`);

  try {
    // 1. User 1: Create Room (Should be Interviewer)
    console.log(`\n[User 1] Joining... (Browser: ${browserId1})`);
    const res1 = await axios.post(`${BASE_URL}/session`, {
      roomId,
      username: "User1",
      browserId: browserId1,
    });
    console.log(`[User 1] Role: ${res1.data.role}`);
    if (res1.data.role !== "interviewer")
      throw new Error("User 1 should be interviewer");
    const token1 = res1.data.token;

    // 2. User 2: Join Candidate (Should be Candidate)
    console.log(`\n[User 2] Joining... (Browser: ${browserId2})`);
    const res2 = await axios.post(`${BASE_URL}/session`, {
      roomId,
      username: "User2",
      browserId: browserId2,
      // No invite token
    });
    console.log(`[User 2] Role: ${res2.data.role}`);
    if (res2.data.role !== "candidate")
      throw new Error("User 2 should be candidate");

    // 3. User 1: Generate Invite Token
    console.log(`\n[User 1] Generating Invite Token...`);
    const inviteRes = await axios.post(
      `${BASE_URL}/invite`,
      {
        roomId,
        role: "interviewer",
      },
      {
        headers: { Authorization: `Bearer ${token1}` },
      }
    );
    const inviteToken = inviteRes.data.inviteToken;
    console.log(`[Invite Token]: ${inviteToken}`);

    // 4. User 3: Join with Token AND Role (Should be Interviewer)
    console.log(
      `\n[User 3] Joining with Token + Role... (Browser: ${browserId3})`
    );
    const res3 = await axios.post(`${BASE_URL}/session`, {
      roomId,
      username: "User3",
      browserId: browserId3,
      inviteToken,
      requestedRole: "interviewer",
    });
    console.log(`[User 3] Role: ${res3.data.role}`);
    if (res3.data.role !== "interviewer")
      throw new Error("User 3 should be interviewer");

    console.log("\n--- SUCCESS: Logic behaves as expected ---");
  } catch (error: any) {
    console.error("\n--- FAILED ---");
    // console.error(error.response?.data || error.message);
    console.error(error.response?.data || error);
  }
}

runTest();
