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
    RadialLinearScale,  
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const FavoriteGraphs = () => {
    const { user } = useAuth();
    const [teams, setTeams] = useState([]);
    const [snippets, setSnippets] = useState([[], [], []]); // Initialize snippets as an array of arrays
    const [chartRefs, setChartRefs] = useState([useRef(null), useRef(null), useRef(null)]); // Array of refs for charts

    // For each graph's team and timing
    const [selectedTeams, setSelectedTeams] = useState([null, null, null]);
    const [timePeriods, setTimePeriods] = useState(['Last week', 'Last week', 'Last week']);
    const [calendarVisible, setCalendarVisible] = useState([false, false, false]);
    const [dateRanges, setDateRanges] = useState([
        { start: new Date(), end: new Date() },
        { start: new Date(), end: new Date() },
        { start: new Date(), end: new Date() }
    ]);

    useEffect(() => {
        fetchTeams();
    }, [user]);

    useEffect(() => {
        selectedTeams.forEach((team, index) => {
            if (team) {
                fetchSnippets(team.id, index);
            }
        });
    }, [selectedTeams, timePeriods]);

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

    const fetchSnippets = async (teamId, index) => {
        try {
            const response = await axios.post("https://extension-360407.lm.r.appspot.com/api/team_snippets", {
                teamIdReq: teamId,
            });
            setSnippets(prev => {
                const newSnippets = [...prev];
                newSnippets[index] = response.data;
                return newSnippets;
            });
        } catch (error) {
            console.error("Error fetching snippets:", error);
        }
    };

    const handleTimePeriodChange = (index, value) => {
        const updatedTimePeriods = [...timePeriods];
        updatedTimePeriods[index] = value;
        setTimePeriods(updatedTimePeriods);
        if (value === "Calendar") {
            toggleCalendarVisibility(index, true);
        } else {
            toggleCalendarVisibility(index, false);
        }
    };

    const toggleCalendarVisibility = (index, visible) => {
        setCalendarVisible(prev => {
            const updatedVisibility = [...prev];
            updatedVisibility[index] = visible;
            return updatedVisibility;
        });
    };

    const handleDateRangeChange = (index, range) => {
        setDateRanges(prev => {
            const updatedRanges = [...prev];
            updatedRanges[index] = { start: range[0], end: range[1] };
            return updatedRanges;
        });
    };

    // Modify this function to handle empty or undefined snippets
    const getAverageSentimentByDay = (snippets = []) => {
        const dayStats = new Array(7).fill(0).map(() => []);

        if (!snippets || snippets.length === 0) {
            return dayStats.map(() => 0);  // Return an array of zeros if no data
        }

        snippets.forEach(snippet => {
            const dayOfWeek = new Date(snippet.date).getDay();
            if (dayStats[dayOfWeek]) {
                dayStats[dayOfWeek].push(snippet.score);
            }
        });

        return dayStats.map(scores => scores.length ? (scores.reduce((a, b) => a + b) / scores.length) : 0);
    };

    return (
        <div className="favorite-graphs-page">
            <h2 className="page-title">Team Analytics Dashboard</h2>

            {[0, 1, 2].map((i) => (
                <div key={i} className="chart-section">
                    <div className="dropdown-group">
                        <label>Select Team for Graph {i + 1}:</label>
                        <select
                            value={selectedTeams[i] ? selectedTeams[i].id : ''}
                            onChange={(e) => {
                                const team = teams.find(t => t.id === parseInt(e.target.value));
                                setSelectedTeams(prev => {
                                    const updatedTeams = [...prev];
                                    updatedTeams[i] = team;
                                    return updatedTeams;
                                });
                            }}
                        >
                            <option value="" disabled>Select a team</option>
                            {teams.map(team => (
                                <option key={team.id} value={team.id}>{team.team_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="dropdown-group">
                        <label>Select Time Period for Graph {i + 1}:</label>
                        <select
                            value={timePeriods[i]}
                            onChange={(e) => handleTimePeriodChange(i, e.target.value)}
                        >
                            <option value="Last week">Last week</option>
                            <option value="Last month">Last month</option>
                            <option value="Last year">Last year</option>
                            <option value="Calendar">Calendar</option>
                        </select>
                    </div>

                    {calendarVisible[i] && (
                        <div className="calendar-container">
                            <Calendar
                                selectRange={true}
                                onChange={(range) => handleDateRangeChange(i, range)}
                                value={[dateRanges[i].start, dateRanges[i].end]}
                            />
                        </div>
                    )}

                    <div className="chart-section">
                        {i === 0 && (
                            <Radar
                                data={snippets[i] && snippets[i].length > 0
                                    ? {
                                        labels: snippets[i].filter(snippet => snippet.score < 5).map(snippet => new Date(snippet.date).toLocaleDateString()),
                                        datasets: [{
                                            label: `Critical Panthers (Low Sentiment)`,
                                            data: snippets[i].filter(snippet => snippet.score < 5).map(snippet => snippet.score),
                                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                                            borderColor: 'rgba(255, 99, 132, 1)',
                                            pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                                        }]
                                    }
                                    : { labels: [], datasets: [] }
                                }
                                ref={chartRefs[i]}
                            />
                        )}

                        {i === 1 && (
                            <Bar
                                data={snippets[i] && snippets[i].length > 0
                                    ? {
                                        labels: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                                        datasets: [{
                                            label: `Average Sentiment by Day`,
                                            data: getAverageSentimentByDay(snippets[i]),
                                            backgroundColor: 'rgba(153, 102, 255, 0.6)',
                                            borderColor: 'rgba(153, 102, 255, 1)',
                                        }]
                                    }
                                    : { labels: [], datasets: [] }
                                }
                                ref={chartRefs[i]}
                            />
                        )}

                        {i === 2 && (
                            <Line
                                data={snippets[i] && snippets[i].length > 0
                                    ? {
                                        labels: snippets[i].map(snippet => new Date(snippet.date).toLocaleDateString()),
                                        datasets: [{
                                            label: `Sentiment Scores Over Time`,
                                            data: snippets[i].map(snippet => snippet.score),
                                            borderColor: 'rgba(75,192,192,1)',
                                            backgroundColor: 'rgba(75,192,192,0.2)',
                                        }]
                                    }
                                    : { labels: [], datasets: [] }
                                }
                                ref={chartRefs[i]}
                            />
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default FavoriteGraphs;
