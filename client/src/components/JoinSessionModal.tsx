import { Dispatch, SetStateAction, useState } from "react";

function JoinSessionModal({
  onInputChange,
}: {
  onInputChange: Dispatch<SetStateAction<string>>;
}) {
  const [inputName, setInputName] = useState<string>("");

  return (
    <div className="modal">
      <h1>Join Session</h1>
      <p>Please enter your name to join the room.</p>
      <div className="input-group">
        <input
          type="text"
          placeholder="Your Name"
          value={inputName}
          onChange={(e) => setInputName(e.target.value)}
          className="name-input"
          onKeyDown={(e) => {
            if (e.key === "Enter" && inputName.trim()) onInputChange(inputName);
          }}
        />
        <button
          onClick={() => inputName.trim() && onInputChange(inputName)}
          className="create-button"
          disabled={!inputName.trim()}
        >
          Join Room
        </button>
      </div>
    </div>
  );
}

export default JoinSessionModal;
