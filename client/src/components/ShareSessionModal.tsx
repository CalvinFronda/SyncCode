import { useState } from "react";
import axios from "axios";

// Fetch base URL from env (duplicate logic from Room.tsx, could be centralized)
const baseUrl = import.meta.env.DEV
  ? "http://localhost:3000"
  : import.meta.env.VITE_NGROK_URL;

interface ShareSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  role: "interviewer" | "candidate";
  sessionToken: string | null;
}

function ShareSessionModal({
  isOpen,
  onClose,
  roomId,
  role,
  sessionToken,
}: ShareSessionModalProps) {
  const [interviewerLink, setInterviewerLink] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedType, setCopiedType] = useState<
    "candidate" | "interviewer" | null
  >(null);

  if (!isOpen) return null;

  const handleCopyCandidate = () => {
    const url = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(url);
    setCopiedType("candidate");
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleGenerateInterviewer = async () => {
    if (!sessionToken) return;
    setIsLoading(true);
    try {
      const res = await axios.post(
        `${baseUrl}/invite`,
        { roomId, role: "interviewer" },
        {
          headers: { Authorization: `Bearer ${sessionToken}` },
        }
      );
      const token = res.data.inviteToken;
      const url = `${window.location.origin}/room/${roomId}?role=interviewer&token=${token}`;
      navigator.clipboard.writeText(url);
      setInterviewerLink(url);
      setCopiedType("interviewer");
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err) {
      console.error("Failed to generate invite", err);
      alert("Failed to generate inviter link");
    } finally {
      setIsLoading(false);
    }
  };

  console.log(role);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Invite Others</h2>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="share-section">
          <h3>Candidate Link (Read Only)</h3>
          <p>
            Share this link with the candidate. They will have limited
            permissions.
          </p>
          <div className="input-with-button">
            <input
              readOnly
              value={`${window.location.origin}/room/${roomId}`}
            />
            <button onClick={handleCopyCandidate}>
              {copiedType === "candidate" ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {role === "interviewer" && (
          <div className="share-section interviewer-section">
            <h3>Interviewer Link (Admin)</h3>
            <p>
              Generate a secure link for another interviewer.{" "}
              <strong>This link grants full permissions.</strong>
            </p>
            <div className="input-with-button">
              <input
                readOnly
                placeholder="Click generate to create link..."
                value={interviewerLink}
              />
              <button
                onClick={handleGenerateInterviewer}
                disabled={isLoading}
                className="secondary-button"
              >
                {isLoading
                  ? "Generating..."
                  : copiedType === "interviewer"
                  ? "Copied!"
                  : "Generate & Copy"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ShareSessionModal;
