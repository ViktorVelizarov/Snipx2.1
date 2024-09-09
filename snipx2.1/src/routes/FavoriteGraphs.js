import React, { useState, useEffect, useRef } from 'react';
import { Line, Bar, Radar, Doughnut } from 'react-chartjs-2';
import { useAuth } from "../AuthProvider";
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './FavoriteGraphs.css';
import { useOutletContext } from 'react-router-dom';

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
    Legend,
    ArcElement
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    RadialLinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const FavoriteGraphs = () => {
    const { user } = useAuth();
    const { isDarkMode } = useOutletContext(); // Capture dark mode state
    const [teams, setTeams] = useState([]);
    const [snippets, setSnippets] = useState([[], [], []]);
    const chartRefs = [useRef(null), useRef(null), useRef(null)];
    const pdpChartRef = useRef(null);
    const progressChartRef = useRef(null);

    const [selectedTeams, setSelectedTeams] = useState([null, null, null]);
    const [timePeriods, setTimePeriods] = useState(['Last week', 'Last week', 'Last week']);
    const [pdpData, setPdpData] = useState({ labels: [], datasets: [] });
    const [progressData, setProgressData] = useState({
        labels: ['Progress', 'Remaining'],
        datasets: [
            {
                data: [70, 30], // 70% progress, 30% remaining
                backgroundColor: ['green', 'red'],
                borderWidth: 0,
                cutout: '50%', // Doughnut style
            }
        ]
    });
    const [calendarVisible, setCalendarVisible] = useState([false, false, false]);
    const [dateRanges, setDateRanges] = useState([
        { start: new Date(), end: new Date() },
        { start: new Date(), end: new Date() },
        { start: new Date(), end: new Date() }
    ]);
    const defaultChartData = {
        labels: [],
        datasets: []
    };
    const progress = 80; // Example progress value
    const remaining = 100 - progress;

    useEffect(() => {
        fetchTeams();
        generatePdpData(); // Generate PDP data when component mounts
        generateProgressData(); // Generate overall progress data
    }, [user]);

    useEffect(() => {
        selectedTeams.forEach((team, index) => {
            if (team) {
                fetchSnippets(team.id, index);
            }
        });
    }, [selectedTeams]);

    useEffect(() => {
        snippets.forEach((_, index) => {
            if (snippets[index].length > 0) {
                updateChartData(index);
            }
        });
    }, [snippets, timePeriods, dateRanges, isDarkMode]); // Add isDarkMode to the dependency array

    useEffect(() => {
        setProgressData({
            labels: ['Progress', 'Remaining'],
            datasets: [
                {
                    data: [progress, remaining],
                    backgroundColor: ['green', 'red'],
                    cutout: '50%', // Doughnut style for thickness
                    circumference: 180,
                    rotation: -90, // Rotate to start from top and face down
                }
            ]
        });
    }, [progress, remaining]);

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

    const filterSnippetsByTime = (snippets, timePeriod, dateRange) => {
        const now = new Date();
        let filteredSnippets = snippets;

        if (timePeriod === 'Last week') {
            const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));
            filteredSnippets = snippets.filter(snippet => new Date(snippet.date) >= oneWeekAgo);
        } else if (timePeriod === 'Last month') {
            const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));
            filteredSnippets = snippets.filter(snippet => new Date(snippet.date) >= oneMonthAgo);
        } else if (timePeriod === 'Last year') {
            const oneYearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
            filteredSnippets = snippets.filter(snippet => new Date(snippet.date) >= oneYearAgo);
        } else if (timePeriod === 'Calendar') {
            filteredSnippets = snippets.filter(snippet => {
                const snippetDate = new Date(snippet.date);
                return snippetDate >= dateRange.start && snippetDate <= dateRange.end;
            });
        }

        return filteredSnippets;
    };

    const updateChartData = (index) => {
        const filteredSnippets = filterSnippetsByTime(snippets[index], timePeriods[index], dateRanges[index]);

        const sortedSnippets = filteredSnippets.sort((a, b) => new Date(a.date) - new Date(b.date));
        const trendLabels = sortedSnippets.map(snippet => new Date(snippet.date).toLocaleDateString());
        const sentimentScores = sortedSnippets.map(snippet => snippet.score);
        const dayStats = new Array(7).fill(0).map(() => []);
        const criticalPanthers = [];

        sortedSnippets.forEach(snippet => {
            const dayOfWeek = new Date(snippet.date).getDay();
            dayStats[dayOfWeek].push(snippet.score);

            if (snippet.score < 5) {
                criticalPanthers.push(snippet);
            }
        });

        const dayStatsAverages = dayStats.map(scores => {
            if (scores.length === 0) return 0;
            return scores.reduce((sum, score) => sum + score, 0) / scores.length;
        });

        const lineColor = getComputedStyle(document.documentElement).getPropertyValue('--graph-line-color').trim();
        const textColor = getComputedStyle(document.documentElement).getPropertyValue('--black-text').trim();

        // Update the charts for the respective graph
        if (index === 0 && chartRefs[0].current) {
            chartRefs[0].current.data = {
                labels: criticalPanthers.map(snippet => new Date(snippet.date).toLocaleDateString()),
                datasets: [{
                    label: 'Critical Panthers (Low Sentiment)',
                    data: criticalPanthers.map(snippet => snippet.score),
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                }]
            };
            chartRefs[0].current.options = {
                plugins: {
                    legend: {
                        labels: {
                            color: textColor,
                        },
                    },
                },
                scales: {
                    r: {
                        ticks: { display: false }, // Hide the ticks (axis labels)
                        grid: { display: false }, // Hide the grid
                        pointLabels: {
                            color: textColor, // Change color of radar labels (dates)
                        },
                    }
                },
            };
            chartRefs[0].current.update();
        }

        if (index === 1 && chartRefs[1].current) {
            chartRefs[1].current.data = {
                labels: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                datasets: [{
                    label: 'Average Sentiment by Day',
                    data: dayStatsAverages,
                    backgroundColor: 'rgba(153, 102, 255, 0.6)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                }]
            };
            chartRefs[1].current.options = {
                plugins: {
                    legend: {
                        labels: {
                            color: textColor,
                        },
                    },
                },
                scales: {
                    x: {
                        ticks: {
                            color: textColor,
                        },
                    },
                    y: {
                        ticks: {
                            color: textColor,
                        },
                    },
                },
            };
            chartRefs[1].current.update();
        }

        if (index === 2 && chartRefs[2].current) {
            chartRefs[2].current.data = {
                labels: trendLabels,
                datasets: [{
                    label: 'Sentiment Scores Over Time',
                    data: sentimentScores,
                    borderColor: lineColor,
                    backgroundColor: 'rgba(75,192,192,0.2)',
                }]
            };
            chartRefs[2].current.options = {
                plugins: {
                    legend: {
                        labels: {
                            color: textColor,
                        },
                    },
                },
                scales: {
                    x: {
                        ticks: {
                            color: textColor,
                        },
                    },
                    y: {
                        ticks: {
                            color: textColor,
                        },
                    },
                },
            };
            chartRefs[2].current.update();
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

        updateChartData(index);
    };

    // Generate PDP Radar data (sample for skill matrix)
    const generatePdpData = () => {
        const pdpLabels = ['Leadership', 'Communication', 'Problem Solving', 'Teamwork', 'Adaptability'];
        const pdpScores = pdpLabels.map(() => Math.floor(Math.random() * 10) + 1);
        setPdpData({
            labels: pdpLabels,
            datasets: [
                {
                    label: 'PDP Progress',
                    data: pdpScores,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                    pointBorderColor: '#fff',
                },
            ],
        });
    };

    // Generate progress data for half-circle doughnut chart
    const generateProgressData = () => {
        const progress = 70;
        setProgressData({
            labels: ['Progress', 'Remaining'],
            datasets: [
                {
                    data: [progress, 100 - progress],
                    backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(192, 192, 192, 0.6)'],
                    borderColor: ['rgba(75, 192, 192, 1)', 'rgba(192, 192, 192, 1)'],
                    borderWidth: 1,
                },
            ],
        });
    };

    return (
        <div className="favorite-graphs-page">
            {/* Overall Progress Half-circle Doughnut */}
            <div className="overall-progress">
                <h2 className="page-title">Team Analytics Dashboard</h2>
                <div className="half-doughnut-container">
                <Doughnut 
                        data={progressData} 
                        options={{ 
                            responsive: true, 
                            maintainAspectRatio: false, 
                            plugins: {
                                legend: { display: false } // Hide legend for a clean look
                            }
                        }} 
                    />
                </div>
            </div>

            <div className="centered-content">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="chart-section">
                        <h3>{i === 0 ? 'Critical Panthers' : i === 1 ? 'Average Sentiment by Day' : 'Sentiment Scores Over Time'}</h3>
                        <div className="dropdown-container">
                            <select
                                value={selectedTeams[i] ? selectedTeams[i].id : ''}
                                onChange={(e) => {
                                    const team = teams.find(t => t.id === parseInt(e.target.value));
                                    const updatedTeams = [...selectedTeams];
                                    updatedTeams[i] = team;
                                    setSelectedTeams(updatedTeams);
                                }}
                            >
                                <option value="" disabled>Select a team</option>
                                {teams.map(team => (
                                    <option key={team.id} value={team.id}>{team.team_name}</option>
                                ))}
                            </select>

                            <select
                                value={timePeriods[i]}
                                onChange={(e) => handleTimePeriodChange(i, e.target.value)}
                            >
                                <option value="Last week">Last week</option>
                                <option value="Last month">Last month</option>
                                <option value="Last year">Last year</option>
                                <option value="Calendar">Calendar</option>
                            </select>

                            {calendarVisible[i] && (
                                <Calendar
                                    className="date-range-picker"
                                    selectRange
                                    onChange={(range) => handleDateRangeChange(i, range)}
                                    value={[dateRanges[i].start, dateRanges[i].end]}
                                />
                            )}
                        </div>

                        {i === 0 && <Radar ref={chartRefs[0]} data={defaultChartData} />}
                        {i === 1 && <Bar ref={chartRefs[1]} data={defaultChartData} />}
                        {i === 2 && <Line ref={chartRefs[2]} data={defaultChartData} />}
                    </div>
                ))}

                {/* PDP Radar Chart */}
                <div className="chart-section">
                    <h3>PDP Progress - Skill Matrix</h3>
                    <Radar
                        data={pdpData}
                        ref={pdpChartRef}
                        options={{
                            plugins: {
                                legend: {
                                    labels: {
                                        color: getComputedStyle(document.documentElement).getPropertyValue('--black-text').trim(),
                                    },
                                },
                            },
                            scales: {
                                r: {
                                    pointLabels: {
                                        color: getComputedStyle(document.documentElement).getPropertyValue('--black-text').trim(),
                                    },
                                },
                            },
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default FavoriteGraphs;
