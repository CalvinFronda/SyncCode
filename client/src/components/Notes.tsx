import { useState } from "react";

function Notes() {
  const [notes, setNotes] = useState("");

  return (
    <div className="notes-container h-full p-4 bg-[#1e1e1e]">
      <textarea
        className="w-full h-full p-4 bg-[#252526] text-[#d4d4d4] border border-[#3e3e42]  resize-none focus:outline-none  font-sans text-sm leading-relaxed"
        placeholder="Type your notes here... (Private to you for now)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
    </div>
  );
}

export default Notes;
