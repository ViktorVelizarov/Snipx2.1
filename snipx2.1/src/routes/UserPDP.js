import React, { useState } from "react";
import { useAuth } from "../AuthProvider";
import "./UserPDP.css"; // Assuming similar styling as your other pages

const UploadPDP = () => {
    const { user } = useAuth();
    const [PDPText, setPDPText] = useState("");
    const [loading, setLoading] = useState(false);

    const handleUpload = async () => {
        if (!user || !user.id) {
            alert("User ID is missing. Please log in.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('https://extension-360407.lm.r.appspot.com/api/uploadPDP', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: user.id, PDPText }),
            });

            if (!response.ok) {
                throw new Error("Failed to upload PDP.");
            }

            const result = await response.json();
            alert("PDP uploaded successfully!");
            setPDPText("");  // Reset the text area after successful upload

        } catch (error) {
            console.error("Error uploading PDP:", error);
            alert("An error occurred while uploading the PDP.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="upload-pdp-container">
            <h1 className="page-title">Upload Your PDP</h1>
            <textarea
                className="pdp-textarea"
                value={PDPText}
                onChange={(e) => setPDPText(e.target.value)}
                placeholder="Enter your PDP here..."
                rows={10}
            />
            <button
                className="upload-button"
                onClick={handleUpload}
                disabled={loading}
            >
                {loading ? "Uploading..." : "Upload PDP"}
            </button>
        </div>
    );
};

export default UploadPDP;
