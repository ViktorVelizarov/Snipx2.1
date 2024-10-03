import React, { useState, useEffect, useRef } from 'react';
import { Line, Bar, Radar } from 'react-chartjs-2';
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
    Legend
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
    Legend
);

const TeamAnalytics = () => {
    const { user } = useAuth();
    const { isDarkMode } = useOutletContext();
    const [teams, setTeams] = useState([]);
    const [users, setUsers] = useState([]);
    const [skills, setSkills] = useState([]);
    const [userSkillsWithRatings, setUserSkillsWithRatings] = useState([]);
    const [snippets, setSnippets] = useState([]);
    const [filteredSnippets, setFilteredSnippets] = useState([]);
    const [selectedEntity, setSelectedEntity] = useState(null);
    const [selectedEntityType, setSelectedEntityType] = useState('teams'); // Default to 'teams'
    const [selectedTimePeriod, setSelectedTimePeriod] = useState('Last week');
    const [customDateRange, setCustomDateRange] = useState([new Date(), new Date()]);
    const [showCalendar, setShowCalendar] = useState(false);
    const [companyId, setCompanyId] = useState(null);
    const [isDataReady, setIsDataReady] = useState(false);

    const lineChartRef = useRef(null);
    const barChartRef = useRef(null);
    const radarChartRef = useRef(null);
    const pdpRadarChartRef = useRef(null);

    const defaultChartData = {
        labels: [],
        datasets: [
            {
                label: 'No Data',
                data: [],
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                borderColor: 'rgba(0, 0, 0, 0.1)',
            },
        ],
    };

    useEffect(() => {
        if (user) {
            fetchCompanyId();
            fetchTeams();
            fetchUsers();
        }
    }, [user]);

    useEffect(() => {
        if (companyId) {
            fetchSkills();
        }
    }, [companyId]);

    useEffect(() => {
        if (selectedEntity) {
            fetchSnippets();
            fetchUserSkills(selectedEntity.id);
        }
    }, [selectedEntity, selectedTimePeriod, customDateRange]);

    useEffect(() => {
        if (filteredSnippets.length || userSkillsWithRatings.length) {
            updateCharts(filteredSnippets, userSkillsWithRatings);
        }
    }, [filteredSnippets, userSkillsWithRatings]);

    const fetchCompanyId = async () => {
        try {
            const response = await axios.get(`https://extension-360407.lm.r.appspot.com/api/users/${user.id}/company`, {
                headers: { "Authorization": `Bearer ${user.token}` },
            });
            setCompanyId(response.data.companyId);
        } catch (error) {
            console.error("Error fetching company ID:", error);
        }
    };

    const fetchTeams = async () => {
        try {
            const response = await axios.get(`https://extension-360407.lm.r.appspot.com/api/teams?userId=${user.id}`, {
                headers: { "Authorization": `Bearer ${user.token}` }
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

    const fetchSkills = async () => {
        if (!companyId) return;
        try {
            const response = await axios.get(`https://extension-360407.lm.r.appspot.com/api/skills/${companyId}`, {
                headers: { "Authorization": `Bearer ${user.token}` }
            });
            setSkills(response.data);
        } catch (error) {
            console.error("Error fetching skills:", error);
        }
    };

    const fetchUserSkills = async (entityId) => {
        try {
            const response = await axios.get(`https://extension-360407.lm.r.appspot.com/api/users/${entityId}/ratings`, {
                headers: { "Authorization": `Bearer ${user.token}` }
            });

            const ratingsData = response.data.reduce((acc, rating) => {
                if (rating.skill && rating.skill.id) {
                    acc[rating.skill.id] = parseFloat(rating.score);
                }
                return acc;
            }, {});

            const userSkillsWithRatings = skills.map(skill => ({
                skillName: skill.skill_name,
                score: ratingsData[skill.id] || 0
            }));

            setUserSkillsWithRatings(userSkillsWithRatings);
        } catch (error) {
            console.error("Error fetching user skills:", error);
        }
    };

    const fetchSnippets = async () => {
        try {
            if (selectedEntityType === 'teams') {
                fetchTeamSnippets(selectedEntity.id);
            } else if (selectedEntityType === 'users') {
                fetchUserSnippets(selectedEntity.id);
            }
        } catch (error) {
            console.error("Error fetching snippets:", error);
        }
    };

    const fetchUserSnippets = async (userId) => {
        try {
            const response = await axios.post(`https://extension-360407.lm.r.appspot.com/api/snipx_snippets/user`, {
                id: userId
            }, {
                headers: { "Authorization": `Bearer ${user.token}` }
            });
            const filteredSnippets = filterSnippetsByTime(response.data);
            setFilteredSnippets(filteredSnippets);
            setIsDataReady(true);
        } catch (error) {
            console.error("Error fetching user snippets:", error);
        }
    };

    const fetchTeamSnippets = async (teamId) => {
        try {
            const teamMembers = users.filter(user => user.teamId === teamId);
            let allSnippets = [];

            for (const member of teamMembers) {
                const response = await axios.post(`https://extension-360407.lm.r.appspot.com/api/snipx_snippets/user`, {
                    id: member.id
                }, {
                    headers: { "Authorization": `Bearer ${user.token}` }
                });
                allSnippets = [...allSnippets, ...response.data];
            }

            const teamDayStats = {};
            allSnippets.forEach(snippet => {
                const snippetDate = new Date(snippet.date).toLocaleDateString();
                const score = parseFloat(snippet.score);

                if (!teamDayStats[snippetDate]) {
                    teamDayStats[snippetDate] = { totalScore: 0, snippetCount: 0 };
                }

                teamDayStats[snippetDate].totalScore += score;
                teamDayStats[snippetDate].snippetCount += 1;
            });

            const teamSnippets = Object.keys(teamDayStats).map(date => ({
                date,
                score: teamDayStats[date].totalScore / teamDayStats[date].snippetCount
            }));

            const sortedSnippets = teamSnippets.sort((a, b) => new Date(a.date) - new Date(b.date));

            const filteredSnippets = filterSnippetsByTime(sortedSnippets);

            setFilteredSnippets(filteredSnippets);
            setIsDataReady(true);
        } catch (error) {
            console.error("Error fetching team snippets:", error);
        }
    };

    const filterSnippetsByTime = (snippets) => {
        const now = new Date();
        let filteredData = snippets;

        if (selectedTimePeriod === 'Last week') {
            const oneWeekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
            filteredData = snippets.filter(snippet => new Date(snippet.date) >= oneWeekAgo);
        } else if (selectedTimePeriod === 'Last month') {
            const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            filteredData = snippets.filter(snippet => new Date(snippet.date) >= oneMonthAgo);
        } else if (selectedTimePeriod === 'Last year') {
            const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            filteredData = snippets.filter(snippet => new Date(snippet.date) >= oneYearAgo);
        } else if (selectedTimePeriod === 'Calendar') {
            filteredData = snippets.filter(snippet => {
                const snippetDate = new Date(snippet.date);
                return snippetDate >= customDateRange[0] && snippetDate <= customDateRange[1];
            });
        }

        filteredData = filteredData.sort((a, b) => new Date(a.date) - new Date(b.date));

        return filteredData;
    };

    const updateCharts = (data, skillsData) => {
        const trendLabels = data.map(snippet => new Date(snippet.date).toLocaleDateString());
        const sentimentScores = data.map(snippet => parseFloat(snippet.score));

        const dayStats = new Array(7).fill(0).map(() => ({ total: 0, count: 0 }));

        data.forEach(snippet => {
            const dayOfWeek = new Date(snippet.date).getDay();
            dayStats[dayOfWeek].total += parseFloat(snippet.score);
            dayStats[dayOfWeek].count += 1;
        });

        const dayStatsAverages = dayStats.map(day => day.count === 0 ? 0 : day.total / day.count);

        const lineColor = getComputedStyle(document.documentElement).getPropertyValue('--graph-line-color').trim();
        const textColor = getComputedStyle(document.documentElement).getPropertyValue('--black-text').trim();

        if (lineChartRef.current) {
            lineChartRef.current.data = {
                labels: trendLabels,
                datasets: [{
                    label: 'Sentiment Scores Over Time',
                    data: sentimentScores,
                    borderColor: lineColor,
                    backgroundColor: 'rgba(75,192,192,0.2)',
                }]
            };
            lineChartRef.current.options = {
                scales: {
                    y: {
                        min: 0,
                        max: 10,
                        ticks: {
                            color: textColor,
                            stepSize: 0.1
                        }
                    }
                }
            };
            lineChartRef.current.update();
        }

        if (barChartRef.current) {
            barChartRef.current.data = {
                labels: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                datasets: [{
                    label: 'Average Sentiment by Day',
                    data: dayStatsAverages,
                    backgroundColor: 'rgba(153, 102, 255, 0.6)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                }]
            };
            barChartRef.current.options = {
                scales: {
                    y: { min: 0, max: 10, ticks: { color: textColor } }
                }
            };
            barChartRef.current.update();
        }

        if (radarChartRef.current) {
            radarChartRef.current.data = {
                labels: data.map(snippet => new Date(snippet.date).toLocaleDateString()),
                datasets: [{
                    label: 'Critical Panthers (Low Sentiment)',
                    data: data.filter(snippet => parseFloat(snippet.score) < 4).map(snippet => parseFloat(snippet.score)),
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                }]
            };
            radarChartRef.current.options = {
                scales: { r: { min: 0, max: 10, ticks: { color: textColor } } }
            };
            radarChartRef.current.update();
        }

        if (pdpRadarChartRef.current) {
            const skillNames = skillsData.map(skill => skill.skillName);
            const skillScores = skillsData.map(skill => parseFloat(skill.score));

            pdpRadarChartRef.current.data = {
                labels: skillNames,
                datasets: [{
                    label: 'PDP Progress',
                    data: skillScores,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                }]
            };
            pdpRadarChartRef.current.options = {
                scales: { r: { min: 0, max: 5, ticks: { color: textColor } } }
            };
            pdpRadarChartRef.current.update();
        }
    };

    const handleEntityTypeChange = (type) => {
        setSelectedEntityType(type);
        setSelectedEntity(null);
        setFilteredSnippets([]);  // Clear snippets when switching entity types
    };

    const handleTeamSelection = (e) => {
        const entity = teams.find(team => team.id === parseInt(e.target.value));
        setSelectedEntity(entity);
    };

    const handleUserSelection = (e) => {
        const entity = users.find(user => user.id === parseInt(e.target.value));
        setSelectedEntity(entity);
    };

    const handleTimePeriodChange = (value) => {
        setSelectedTimePeriod(value);
        setShowCalendar(value === 'Calendar');
        if (selectedEntity && value !== 'Calendar') {
            setFilteredSnippets([]);  // Clear the existing snippets before fetching new data
            fetchSnippets(); // Fetch new data when time period changes
        }
    };

    const onCalendarChange = (dateRange) => {
        setCustomDateRange(dateRange);
        if (selectedEntity) {
            setFilteredSnippets([]);  // Clear the existing snippets before fetching new data
            fetchSnippets(); // Fetch new data based on calendar range
        }
    };

    return (
        <div className="team-analytics-page">
            <h2 className="page-title">Team Analytics Dashboard</h2>

            <div className="dropdown-container">
                <select value={selectedEntityType} onChange={(e) => handleEntityTypeChange(e.target.value)}>
                    <option value="teams">Teams</option>
                    <option value="users">Users</option>
                </select>

                {selectedEntityType === 'teams' ? (
                    <select
                        value={selectedEntity ? selectedEntity.id : ''}
                        onChange={handleTeamSelection}
                    >
                        <option value="" disabled>Select Team</option>
                        {teams.map(team => (
                            <option key={team.id} value={team.id}>{team.team_name}</option>
                        ))}
                    </select>
                ) : (
                    <select
                        value={selectedEntity ? selectedEntity.id : ''}
                        onChange={handleUserSelection}
                    >
                        <option value="" disabled>Select User</option>
                        {users.map(user => (
                            <option key={user.id} value={user.id}>{user.email}</option>
                        ))}
                    </select>
                )}

                <select value={selectedTimePeriod} onChange={(e) => handleTimePeriodChange(e.target.value)}>
                    <option value="Last week">Last week</option>
                    <option value="Last month">Last month</option>
                    <option value="Last year">Last year</option>
                    <option value="Calendar">Calendar</option>
                </select>
            </div>

            {showCalendar && (
                <div className="calendar-container">
                    <Calendar
                        onChange={onCalendarChange}
                        selectRange={true}
                        value={customDateRange}
                    />
                </div>
            )}

            <div className="grid-container">
                <div className="chart-section">
                    <h3>Sentiment Scores Over Time</h3>
                    <Line ref={lineChartRef} data={defaultChartData} />
                </div>

                <div className="chart-section">
                    <h3>Average Sentiment by Day</h3>
                    <Bar ref={barChartRef} data={defaultChartData} />
                </div>

                <div className="chart-section">
                    <h3>Critical Panthers</h3>
                    <Radar ref={radarChartRef} data={defaultChartData} />
                </div>

                <div className="chart-section">
                    <h3>PDP Progress</h3>
                    <Radar ref={pdpRadarChartRef} data={defaultChartData} />
                </div>

            </div>
        </div>
    );
};

export default TeamAnalytics;
