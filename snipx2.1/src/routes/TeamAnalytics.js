import React, { useState, useEffect, useRef } from 'react';
import { Line, Bar, Radar, Doughnut } from 'react-chartjs-2';
import { useAuth } from "../AuthProvider";
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './TeamAnalytics.css';
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

const TeamAnalytics = () => {
    const { user } = useAuth();
    const { isDarkMode } = useOutletContext();
    const [teams, setTeams] = useState([]);
    const [users, setUsers] = useState([]);
    const [snippets, setSnippets] = useState([]);
    const [selectedTimePeriod, setSelectedTimePeriod] = useState('Last week');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [selectedTeams, setSelectedTeams] = useState([]);
    const lineChartRef = useRef(null);
    const barChartRef = useRef(null);
    const radarCriticalPanthersRef = useRef(null);
    const radarPDPChartRef = useRef(null);

    const [pdpData, setPdpData] = useState({ labels: [], datasets: [] });
    const [progressData, setProgressData] = useState({
        labels: ['Progress', 'Remaining'],
        datasets: [
            {
                data: [70, 30],
                backgroundColor: ['green', 'red'],
                borderWidth: 0,
                cutout: '50%',
            }
        ]
    });
    const [dateRanges, setDateRanges] = useState({ start: new Date(), end: new Date() });
    const progress = 80;
    const remaining = 100 - progress;

    useEffect(() => {
        fetchTeams();
        fetchUsers();
        generatePdpData();
        generateProgressData();
    }, [user]);

    useEffect(() => {
        if (selectedUsers.length || selectedTeams.length) {
            fetchSnippets();
        }
    }, [selectedUsers, selectedTeams, selectedTimePeriod]);

    useEffect(() => {
        setProgressData({
            labels: ['Progress', 'Remaining'],
            datasets: [
                {
                    data: [progress, remaining],
                    backgroundColor: ['green', 'red'],
                    cutout: '50%',
                    circumference: 180,
                    rotation: -90,
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

    const fetchUsers = async () => {
        try {
            const response = await axios.post("https://extension-360407.lm.r.appspot.com/api/company_users", user);
            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const fetchSnippets = async () => {
        try {
            const userIds = selectedUsers.map(user => user.id);
            const teamIds = selectedTeams.map(team => team.id);
            const response = await axios.post("https://extension-360407.lm.r.appspot.com/api/team_snippets", {
                userIds,
                teamIds,
                timePeriod: selectedTimePeriod,
            });
            setSnippets(response.data);
            updateChartData(response.data);
        } catch (error) {
            console.error("Error fetching snippets:", error);
        }
    };

    const updateChartData = (data) => {
        const trendLabels = data.map(snippet => new Date(snippet.date).toLocaleDateString());
        const sentimentScores = data.map(snippet => snippet.score);
        const criticalPanthers = data.filter(snippet => snippet.score < 5); // Critical Panthers

        const sentimentDataSets = selectedUsers.map((user, index) => ({
            label: `${user.email}`,
            data: sentimentScores,
            borderColor: `rgba(${index * 40}, 99, 132, 1)`,
            backgroundColor: `rgba(${index * 40}, 99, 132, 0.2)`,
        }));

        // Sentiment Scores Over Time
        if (lineChartRef.current) {
            lineChartRef.current.data = {
                labels: trendLabels,
                datasets: sentimentDataSets
            };
            lineChartRef.current.update();
        }

        // Average Sentiment by Day
        const dayStats = [0, 0, 0, 0, 0, 0, 0];
        data.forEach(snippet => {
            const dayOfWeek = new Date(snippet.date).getDay();
            dayStats[dayOfWeek] += snippet.score;
        });

        if (barChartRef.current) {
            barChartRef.current.data = {
                labels: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                datasets: [{
                    label: 'Average Sentiment by Day',
                    data: dayStats,
                    backgroundColor: 'rgba(153, 102, 255, 0.6)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                }]
            };
            barChartRef.current.update();
        }

        // Critical Panthers (Radar)
        if (radarCriticalPanthersRef.current) {
            radarCriticalPanthersRef.current.data = {
                labels: criticalPanthers.map(snippet => new Date(snippet.date).toLocaleDateString()),
                datasets: [{
                    label: 'Critical Panthers',
                    data: criticalPanthers.map(snippet => snippet.score),
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                }]
            };
            radarCriticalPanthersRef.current.update();
        }
    };

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

    const handleDateRangeChange = (range) => {
        setDateRanges({ start: range[0], end: range[1] });
        fetchSnippets();
    };

    return (
        <div className="team-analytics-page">
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
                                legend: { display: false }
                            }
                        }} 
                    />
                </div>
            </div>

            {/* Dropdowns */}
            <div className="dropdown-row">
                <select value={selectedTimePeriod} onChange={(e) => setSelectedTimePeriod(e.target.value)}>
                    <option value="Last week">Last week</option>
                    <option value="Last month">Last month</option>
                    <option value="Last year">Last year</option>
                    <option value="Calendar">Calendar</option>
                </select>

                <select
                    multiple
                    value={selectedUsers.map(user => user.id)}
                    onChange={(e) => {
                        const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
                        const updatedUsers = users.filter(user => selectedIds.includes(user.id));
                        setSelectedUsers(updatedUsers);
                    }}
                >
                    {users.map(user => (
                        <option key={user.id} value={user.id}>
                            {user.email}
                        </option>
                    ))}
                </select>

                <select
                    multiple
                    value={selectedTeams.map(team => team.id)}
                    onChange={(e) => {
                        const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
                        const updatedTeams = teams.filter(team => selectedIds.includes(team.id));
                        setSelectedTeams(updatedTeams);
                    }}
                >
                    {teams.map(team => (
                        <option key={team.id} value={team.id}>
                            {team.team_name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid-container">
                {/* Sentiment Scores Over Time */}
                <div className="chart-section">
                    <h3>Sentiment Scores Over Time</h3>
                    <Line ref={lineChartRef} data={{ labels: [], datasets: [] }} options={{
                        scales: {
                            x: { ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--black-text').trim() }},
                            y: { ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--black-text').trim() }},
                        },
                    }} />
                </div>

                {/* PDP Progress */}
                <div className="chart-section">
                    <h3>PDP Progress - Skill Matrix</h3>
                    <Radar ref={radarPDPChartRef} data={pdpData} options={{
                        scales: {
                            r: {
                                pointLabels: { color: getComputedStyle(document.documentElement).getPropertyValue('--black-text').trim() }
                            }
                        },
                    }} />
                </div>

                {/* Average Sentiment by Day */}
                <div className="chart-section">
                    <h3>Average Sentiment by Day</h3>
                    <Bar ref={barChartRef} data={{ labels: [], datasets: [] }} options={{
                        scales: {
                            x: { ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--black-text').trim() }},
                            y: { ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--black-text').trim() }},
                        },
                    }} />
                </div>

                {/* Critical Panthers */}
                <div className="chart-section">
                    <h3>Critical Panthers</h3>
                    <Radar ref={radarCriticalPanthersRef} data={{ labels: [], datasets: [] }} options={{
                        scales: {
                            r: {
                                ticks: { display: false },
                                grid: { display: false },
                                pointLabels: { color: getComputedStyle(document.documentElement).getPropertyValue('--black-text').trim() }
                            }
                        },
                    }} />
                </div>
            </div>
        </div>
    );
};

export default TeamAnalytics;