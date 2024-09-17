import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthProvider";
import "./UserPDP.css"; // Assuming similar styling as your other pages

const UploadPDP = () => {
    const { user } = useAuth();
    const [PDPText, setPDPText] = useState("");
    const [AIAnalysis, setAIAnalysis] = useState(""); // For storing the AI analysis
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false); // State to track analyzing process

    useEffect(() => {
        const fetchPDP = async () => {
            if (!user || !user.id) return;

            try {
                const response = await fetch(`https://extension-360407.lm.r.appspot.com/api/getPDP/${user.id}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch PDP.");
                }

                const data = await response.json();
                if (data.PDP) {
                    setPDPText(data.PDP);
                }
            } catch (error) {
                console.error("Error fetching PDP:", error);
            }
        };

        fetchPDP();
    }, [user]);

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
                body: JSON.stringify({ userId: user.id, PDPText }), // Send the current PDPText
            });
    
            if (!response.ok) {
                throw new Error("Failed to upload PDP.");
            }
    
            const data = await response.json();
            alert("PDP uploaded successfully!");
    
            setPDPText(data.PDP); // Update with the newly saved text from the server (optional)
    
        } catch (error) {
            console.error("Error uploading PDP:", error);
            alert("An error occurred while uploading the PDP.");
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyze = async () => {
        setAnalyzing(true);
        try {
            const response = await fetch('https://extension-360407.lm.r.appspot.com/api/analyzePDP', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ PDPText }), // Send the PDPText to the API for analysis
            });

            if (!response.ok) {
                throw new Error("Failed to analyze PDP.");
            }

            const data = await response.json();
            setAIAnalysis(data.AIAnalysis); // Set the result from the AI analysis in the text field
        } catch (error) {
            console.error("Error analyzing PDP:", error);
            alert("An error occurred while analyzing the PDP.");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSubmitAIAnalysis = async () => {
        if (!user || !user.id) {
            alert("User ID is missing. Please log in.");
            return;
        }

        try {
            const response = await fetch('https://extension-360407.lm.r.appspot.com/api/uploadAIPDP', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: user.id, PDPText: AIAnalysis }), // Send the AI analysis to the API
            });

            if (!response.ok) {
                throw new Error("Failed to upload AI PDP.");
            }

            alert("AI PDP uploaded successfully!");
        } catch (error) {
            console.error("Error uploading AI PDP:", error);
            alert("An error occurred while uploading the AI PDP.");
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
            <div className="button-group">
                <button
                    className="upload-button"
                    onClick={handleUpload}
                    disabled={loading}
                >
                    {loading ? "Uploading..." : "Upload PDP"}
                </button>
                <button
                    className="analyze-button"
                    onClick={handleAnalyze}
                    disabled={analyzing}
                >
                    {analyzing ? "Analyzing..." : "Analyze PDP"}
                </button>
            </div>
            
            {/* Textarea for AI Analysis result */}
            {AIAnalysis && (
                <div className="ai-analysis-container">
                    <h2>AI Analysis Result</h2>
                    <textarea
                        className="ai-analysis-textarea"
                        value={AIAnalysis}
                        onChange={(e) => setAIAnalysis(e.target.value)} // Allow editing
                        rows={10}
                    />
                    <button className="submit-ai-analysis-button" onClick={handleSubmitAIAnalysis}>
                        Submit
                    </button>
                </div>
            )}
        </div>
    );
};

export default UploadPDP;
