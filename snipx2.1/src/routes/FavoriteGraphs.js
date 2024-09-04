import React, { useState, useEffect, useRef } from 'react';
import { Line, Bar, Radar } from 'react-chartjs-2';
import { useAuth } from "../AuthProvider";
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './FavoriteGraphs.css';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    RadialLinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

// Register required components
ChartJS.register(
    CategoryScale,
    LinearScale,
    RadialLinearScale,  // Ensure this is registered
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const FavoriteGraphs = () => {
    const { user } = useAuth();
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [teams, setTeams] = useState([]);
    const [snippets, setSnippets] = useState([]);
    const [trendsData, setTrendsData] = useState({ labels: [], datasets: [] });
    const [dayStatsData, setDayStatsData] = useState({ labels: [], datasets: [] });
    const [criticalPanthersData, setCriticalPanthersData] = useState({ labels: [], datasets: [] });
    const chartRef = useRef(null);

    useEffect(() => {
        fetchTeams();
    }, [user]);

    useEffect(() => {
        if (selectedTeam) {
            fetchSnippets();
        }
    }, [selectedTeam]);

    useEffect(() => {
        updateChartData();
    }, [startDate, endDate, snippets]);

    const fetchTeams = async () => {
        try {
            const response = await axios.get(`https://extension-360407.lm.r.appspot.com/api/teams?userId=${user.id}`, {
                headers: {
                    "Authorization": `Bearer ${user.token}`
                }
            });
            setTeams(response.data);
        } catch (error) {
            console.error("Error fetching teams:", error);
        }
    };

    const fetchSnippets = async () => {
        try {
            const response = await axios.post("https://extension-360407.lm.r.appspot.com/api/team_snippets", {
                teamIdReq: selectedTeam.id,
            });
            console.log("snippets:", response.data)
            setSnippets(response.data);
        } catch (error) {
            console.error("Error fetching snippets:", error);
        }
    };

    const updateChartData = () => {
        const filteredSnippets = snippets.filter(snippet => {
            const snippetDate = new Date(snippet.date);
            return snippetDate >= startDate && snippetDate <= endDate;
        });

        const sortedSnippets = filteredSnippets.sort((a, b) => new Date(a.date) - new Date(b.date));
        const trendLabels = sortedSnippets.map(snippet => new Date(snippet.date).toLocaleDateString());
        const sentimentScores = sortedSnippets.map(snippet => snippet.score);
        const dayStats = new Array(7).fill(0).map(() => []);
        const criticalPanthers = [];

        sortedSnippets.forEach(snippet => {
            const dayOfWeek = new Date(snippet.date).getDay();
            dayStats[dayOfWeek].push(snippet.score);

            if (snippet.score < 3) {
                criticalPanthers.push(snippet);
            }
        });

        const dayStatsAverages = dayStats.map(scores => {
            if (scores.length === 0) return 0;
            return scores.reduce((sum, score) => sum + score, 0) / scores.length;
        });

        setTrendsData({
            labels: trendLabels,
            datasets: [
                {
                    label: 'Sentiment Scores Over Time',
                    data: sentimentScores,
                    borderColor: 'rgba(75,192,192,1)',
                    backgroundColor: 'rgba(75,192,192,0.2)',
                },
            ],
        });

        setDayStatsData({
            labels: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            datasets: [
                {
                    label: 'Average Sentiment by Day',
                    data: dayStatsAverages,
                    backgroundColor: 'rgba(153, 102, 255, 0.6)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                },
            ],
        });

        setCriticalPanthersData({
            labels: criticalPanthers.map(snippet => new Date(snippet.date).toLocaleDateString()),
            datasets: [
                {
                    label: 'Critical Panthers (Low Sentiment)',
                    data: criticalPanthers.map(snippet => snippet.score),
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                },
            ],
        });

        if (chartRef.current) {
            chartRef.current.update();
        }
    };

    return (
        <div className="favorite-graphs-page">
            <h2 className="page-title">Team Analytics Dashboard</h2>

            <div className="team-selection">
                <label>Select Team:</label>
                <select
                    value={selectedTeam ? selectedTeam.id : ''}
                    onChange={(e) => {
                        const team = teams.find(t => t.id === parseInt(e.target.value));
                        setSelectedTeam(team);
                    }}
                >
                    <option value="" disabled>Select a team</option>
                    {teams.map(team => (
                        <option key={team.id} value={team.id}>{team.team_name}</option>
                    ))}
                </select>
            </div>

            <div className="chart-section">
                <h3>Trends Across Team</h3>
                <Line data={trendsData} ref={chartRef} />
            </div>

            <div className="chart-section">
                <h3>Stats by Days of the Week</h3>
                <Bar data={dayStatsData} ref={chartRef} />
            </div>

            <div className="chart-section">
                <h3>Critical Panthers</h3>
                <Radar data={criticalPanthersData} ref={chartRef} />
            </div>

            <div className="chart-section">
                <h3>Ad Hoc Reports</h3>
                <Calendar
                    selectRange={true}
                    onChange={(dateRange) => {
                        setStartDate(dateRange[0]);
                        setEndDate(dateRange[1]);
                    }}
                    value={[startDate, endDate]}
                />
                <Bar data={trendsData} ref={chartRef} /> {/* Placeholder for ad hoc reports */}
            </div>
        </div>
    );
};

export default FavoriteGraphs;
