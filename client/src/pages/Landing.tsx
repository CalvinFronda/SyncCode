import { useState } from "react";
import { useNavigate } from "react-router";
import { v4 as uuidv4 } from "uuid";

function Landing() {
  const navigate = useNavigate();
  const [name, setName] = useState("");

  const createRoom = () => {
    if (!name.trim()) return;
    const roomId = uuidv4();
    navigate(`/room/${roomId}`, { state: { username: name } });
  };

  return (
    <div className="landing-page">
      <h1>SyncCode</h1>
      <p>Real-time collaborative code editor with execution.</p>
      <div className="input-group">
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="name-input"
          onKeyDown={(e) => e.key === "Enter" && createRoom()}
        />
        <button onClick={createRoom} className="create-button" disabled={!name.trim()}>
          Create New Session
        </button>
      </div>
    </div>
  );
}

export default Landing;
