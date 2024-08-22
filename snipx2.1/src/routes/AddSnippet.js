import React, { useState, useEffect, Suspense } from "react";
import 'react-quill/dist/quill.snow.css';
import './AddSnippet.css';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { useAuth } from "../AuthProvider";
import { useNavigate } from 'react-router-dom';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Dynamically import React Quill for rich text editing
const ReactQuill = React.lazy(() => import('react-quill'));

const Snippets = () => {
    const { user } = useAuth();
    const navigate = useNavigate(); // Initialize the navigate function

    const [inputText, setInputText] = useState("");
    const [results, setResults] = useState({ green: [], orange: [], red: [], explanations: "", score: "", sentiment: "" });
    const [showOutputs, setShowOutputs] = useState(false);
    const [showGraphic, setShowGraphic] = useState(false);
    const [scores, setScores] = useState([]);
    const [dates, setDates] = useState([]);
    const [currentScore, setCurrentScore] = useState("");
    const [currentDate, setCurrentDate] = useState("");
    const [loading, setLoading] = useState(false); // Loading state

    useEffect(() => {
        if (user && user.role === "deleted") {
            navigate("/login"); // Redirect to login if user is deleted
        }
    }, [user, navigate]);

    useEffect(() => {
        const now = new Date();
        const formattedDate = now.toISOString().slice(0, 10); // YYYY-MM-DD format
        setCurrentDate(formattedDate);
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true); // Start loading

        try {
            const response1 = await fetch(`https://extension-360407.lm.r.appspot.com/api/analyze`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ text: inputText }),
            });
            const data1 = await response1.json();
            console.log("data from first API", data1);

            const response2 = await fetch(`https://extension-360407.lm.r.appspot.com/api/sentimentAnalysis`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ text: inputText }),
            });
            const data2 = await response2.json();
            console.log("data from sentimentAnalysis API", data2);

            const cleanedExplanations = data2.explanations ? data2.explanations.replace(/<\/?[^>]+(>|$)/g, "") : "";

            setResults({
                green: data1["green"] || [],
                orange: data1["orange"] || [],
                red: data1["red"] || [],
                explanations: cleanedExplanations || "",
                score: data2["score"] || "",
                sentiment: data2["sentiment"] || "",
            });
            setCurrentScore(data2["score"] || "");

            setShowOutputs(true);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false); // Stop loading
        }
    };

    const toggleGraphic = () => {
        setShowGraphic(!showGraphic);
    };

    const handleDateChange = (event) => {
        setCurrentDate(event.target.value);
    };

    const handleApprove = async () => {
        setLoading(true); // Start loading

        const payload = {
            snipx_user_id: user.id,
            type: "daily",
            inputText,
            date: currentDate,
            green: results.green,
            orange: results.orange,
            red: results.red,
            explanations: results.explanations,
            score: results.score,
            sentiment: results.sentiment,
        };

        try {
            const response = await fetch(`https://extension-360407.lm.r.appspot.com/api/snipx_snippets`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error("Failed to send data to the API");
            }

            const result = await response.json();
            console.log("API response:", result);

            // Show an alert when the response is received
            window.alert("Data has been successfully approved!");

            if (currentScore !== "" && currentDate !== "") {
                setScores([...scores, parseInt(currentScore)]);
                setDates([...dates, currentDate]);
                setCurrentScore("");
                setCurrentDate("");
            }
        } catch (error) {
            console.error("Error:", error);
            window.alert("An error occurred while approving the data.");
        } finally {
            setLoading(false); // Stop loading
        }
    };

    const data = {
        labels: dates,
        datasets: [
            {
                label: 'Sentiment Score',
                data: scores,
                borderColor: getComputedStyle(document.documentElement).getPropertyValue('--btn-bg-color').trim(),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: false,
                tension: 0.1,
            },
        ],
    };

    const options = {
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    };

    function autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    }

    useEffect(() => {
        const textareas = document.querySelectorAll('.auto-resize');
        textareas.forEach((textarea) => {
            autoResizeTextarea(textarea);
        });
    }, [results]);

    return (
        <div className="snippets-container">
            <h1 className="page-title">Add Snippet</h1>
            <form onSubmit={handleSubmit} className="form-container">
                <div className="input-container">
                    <label htmlFor="date-input">Enter a date</label>
                    <input
                        id="date-input"
                        type="date"
                        value={currentDate}
                        onChange={handleDateChange}
                        className="date-input"
                    />
                </div>
                <div className="snippet-container">
                    <label htmlFor="snippet-input" className="snippet-label">Enter a snippet</label>
                    <Suspense fallback={<div>Loading editor...</div>}>
                        <ReactQuill
                            value={inputText}
                            onChange={setInputText}
                            placeholder="Enter your text here..."
                            className="snippet-input"
                        />
                    </Suspense>
                </div>
                <button type="submit" className="submit-button" disabled={loading}>
                    {loading ? "Submitting..." : "Submit"}
                </button>
            </form>
    
            {loading && (
                <div className="loading-container">
                    <div className="spinner"></div>
                </div>
            )}
    
            <div className="flex flex-col items-center w-full max-w-lg mt-8 space-y-4">
                {showOutputs && results.green.length > 0 && (
                    <div className="w-full">
                        <h2 className="green-title mb-2">Green</h2>
                        {results.green.map((item, index) => (
                            <textarea
                                key={`green-${index}`}
                                value={item}
                                className="auto-resize mb-2"
                                onChange={(e) => setResults((prevResults) => ({
                                    ...prevResults,
                                    green: prevResults.green.map((el, idx) => idx === index ? e.target.value : el)
                                }))}
                            />
                        ))}
                    </div>
                )}
    
                {showOutputs && results.orange.length > 0 && (
                    <div className="w-full">
                        <h2 className="orange-title mb-2">Orange</h2>
                        {results.orange.map((item, index) => (
                            <textarea
                                key={`orange-${index}`}
                                value={item}
                                className="auto-resize mb-2"
                                onChange={(e) => setResults((prevResults) => ({
                                    ...prevResults,
                                    orange: prevResults.orange.map((el, idx) => idx === index ? e.target.value : el)
                                }))}
                            />
                        ))}
                    </div>
                )}
    
                {showOutputs && results.red.length > 0 && (
                    <div className="w-full">
                        <h2 className="red-title mb-2">Red</h2>
                        {results.red.map((item, index) => (
                            <textarea
                                key={`red-${index}`}
                                value={item}
                                className="auto-resize mb-2"
                                onChange={(e) => setResults((prevResults) => ({
                                    ...prevResults,
                                    red: prevResults.red.map((el, idx) => idx === index ? e.target.value : el)
                                }))}
                            />
                        ))}
                    </div>
                )}
    
                {showOutputs && (
                    <>
                        <div className="w-full">

                            <h2 className="explanation-score-sentiment-title">Explanations</h2>

                            <textarea
                                value={results.explanations}
                                className="auto-resize mb-2"
                                placeholder="Explanations"
                                onChange={(e) => setResults((prevResults) => ({
                                    ...prevResults,
                                    explanations: e.target.value
                                }))}
                            />
                        </div>
    
                        <div className="w-full">
                            <h2 className="explanation-score-sentiment-title">Score</h2>
                            <textarea
                                value={results.score}
                                className="auto-resize mb-2"
                                placeholder="Score"
                                onChange={(e) => {
                                    const newScore = e.target.value;
                                    setResults((prevResults) => ({
                                        ...prevResults,
                                        score: newScore
                                    }));
                                    setCurrentScore(newScore);
                                }}
                            />
                        </div>
    
                        <div className="w-full">
                            <h2 className="explanation-score-sentiment-title">Sentiment</h2>
                            <textarea
                                value={results.sentiment}
                                className="auto-resize mb-2"
                                placeholder="Sentiment"
                                onChange={(e) => setResults((prevResults) => ({
                                    ...prevResults,
                                    sentiment: e.target.value
                                }))}
                            />
                        </div>
    
                        <div className="button-group flex justify-center mt-4">
                            <button
                                onClick={handleApprove}
                                className="approve-button mb-4"
                                disabled={loading}
                            >
                                {loading ? "Approving..." : "Approve"}
                            </button>
                            <button onClick={toggleGraphic}>
                                {showGraphic ? "Hide Graph" : "Show Graph"}
                            </button>
                        </div>
                    </>
                )}
            </div>
    
            {showGraphic && (
                <div className="graphic-placeholder mt-8 w-full">
                    <Line data={data} options={options} />
                </div>
            )}
        </div>
    );    
};

export default Snippets;
