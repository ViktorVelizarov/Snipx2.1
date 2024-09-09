import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { useAuth } from "../AuthProvider";
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Graphs.css';
import { FaRegStar, FaStar } from 'react-icons/fa';

const Graphs = () => {
    const { user } = useAuth();
    const { isDarkMode } = useOutletContext(); // Get isDarkMode from the context
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [selectedGraph, setSelectedGraph] = useState('sentiment');
    const [chartData, setChartData] = useState({ labels: [], datasets: [] });
    const [snippets, setSnippets] = useState([]);
    const chartRef = useRef(null);
    const [users, setUsers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [selectedUserOrTeam, setSelectedUserOrTeam] = useState(user);
    const [selectedEntityType, setSelectedEntityType] = useState('users');
    const [isFavorite, setIsFavorite] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchUsers();
        fetchTeams();
    }, [user]);

    useEffect(() => {
        fetchSnippets();
    }, [selectedUserOrTeam, selectedEntityType]);

    useEffect(() => {
        updateChartData();
    }, [startDate, endDate, selectedGraph, snippets, isDarkMode]);

    const fetchUsers = async () => {
        try {
            const response = await fetch("https://extension-360407.lm.r.appspot.com/api/company_users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(user),
            });
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

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
            let endpoint;
            let payload = {};

            if (selectedEntityType === 'users' && selectedUserOrTeam) {
                endpoint = `https://extension-360407.lm.r.appspot.com/api/snipx_snippets/user`;
                payload = { id: selectedUserOrTeam.id };
            } else if (selectedEntityType === 'teams' && selectedUserOrTeam) {
                endpoint = `https://extension-360407.lm.r.appspot.com/api/team_snippets`;
                payload = { teamIdReq: selectedUserOrTeam.id };
            }

            if (!endpoint) {
                console.error("No endpoint selected for fetching snippets");
                return;
            }

            const response = await axios.post(endpoint, payload);
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
        const labels = sortedSnippets.map(snippet => new Date(snippet.date).toLocaleDateString());
        const dataPoints = sortedSnippets.map(snippet => {
            switch (selectedGraph) {
                case 'green':
                    return snippet.green ? snippet.green.length : 0;
                case 'orange':
                    return snippet.orange ? snippet.orange.length : 0;
                case 'red':
                    return snippet.red ? snippet.red.length : 0;
                case 'length':
                    return snippet.text.length;
                case 'sentiment':
                default:
                    return snippet.score;
            }
        });

        setChartData({
            labels,
            datasets: [
                {
                    label: `${selectedGraph.charAt(0).toUpperCase() + selectedGraph.slice(1)} over time`,
                    data: dataPoints,
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--graph-line-color').trim(),
                    backgroundColor: 'rgba(228, 39, 125, 0.2)',
                },
            ],
        });

        if (chartRef.current) {
            chartRef.current.update();
        }
    };

    const handleUserOrTeamSelection = (selectedId) => {
        if (selectedId === user.id.toString()) {
            setSelectedUserOrTeam(user); // Reset to the current user
        } else {
            const foundUser = users.find(u => u.id === parseInt(selectedId, 10));
            const foundTeam = teams.find(t => t.id === parseInt(selectedId, 10));

            if (foundUser) {
                setSelectedUserOrTeam(foundUser);
            } else if (foundTeam) {
                setSelectedUserOrTeam(foundTeam);
            } else {
                console.error("Selected user or team not found");
            }
        }
    };

    const handleStartDateChange = (dateRange) => {
        setStartDate(dateRange[0]);
        setEndDate(dateRange[1]);
    };

    const handleEntityTypeChange = (e) => {
        setSelectedEntityType(e.target.value);
        setSelectedUserOrTeam(null);
    };

    const toggleFavorite = () => {
        setIsFavorite(!isFavorite);
    };

    const GoToFavoriteGraphs = () => {
        navigate('/favorite-graphs');
    };

    const GoToSkillsMatrix = () => {
        navigate('/skills-matrix'); // Make sure there's a route for Skills Matrix
    };

    return (
        <div className="graphs-page">
            <h2 className="page-title">Graphs</h2>
            <div className="controls-container">
                <div className="dropdowns-container">
                    <div className="dropdown-group">
                        <label>Select Data to View:</label>
                        <select value={selectedGraph} onChange={(e) => setSelectedGraph(e.target.value)}>
                            <option value="sentiment">Sentiment Score</option>
                            <option value="green">Green</option>
                            <option value="orange">Orange</option>
                            <option value="red">Red</option>
                            <option value="length">Snippet Length</option>
                        </select>
                    </div>
                    {user.role === 'admin' && (
                        <>
                            <div className="dropdown-group">
                                <label>Select Data Type:</label>
                                <select value={selectedEntityType} onChange={handleEntityTypeChange}>
                                    <option value="users">Users</option>
                                    <option value="teams">Teams</option>
                                </select>
                            </div>
                            <div className="dropdown-group">
                                <label>Select {selectedEntityType === 'users' ? 'User' : 'Team'}:</label>
                                <select 
                                    value={selectedUserOrTeam ? selectedUserOrTeam.id : user.id} 
                                    onChange={(e) => handleUserOrTeamSelection(e.target.value)}
                                >
                                    <option value={user.id}>Your Data</option>
                                    {selectedEntityType === 'users' && users.map(user => (
                                        <option key={user.id} value={user.id}>{user.email}</option>
                                    ))}
                                    {selectedEntityType === 'teams' && teams.map(team => (
                                        <option key={team.id} value={team.id}>{team.team_name}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}
                    <div className="favorite-group">
                        <button onClick={toggleFavorite} className="favorite-button">
                            {isFavorite ? <FaStar size={24} /> : <FaRegStar size={24} />}
                        </button>
                        <button className="see-favorites-button" onClick={GoToFavoriteGraphs}>
                            See Favorite Graphs
                        </button>
                        <button className="skills-matrix-button" onClick={GoToSkillsMatrix}>
                            Skills Matrix
                        </button>
                    </div>
                </div>
            </div>

            <div className="chart-and-date-container">
                <div className="date-range-picker">
                    <Calendar
                        selectRange={true}
                        onChange={handleStartDateChange}
                        value={[startDate, endDate]}
                    />
                </div>

                <div className="chart-section">
                    <Line
                        data={chartData}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    labels: {
                                        color: getComputedStyle(document.documentElement).getPropertyValue('--black-text').trim(),
                                    },
                                },
                            },
                            scales: {
                                x: {
                                    ticks: {
                                        color: getComputedStyle(document.documentElement).getPropertyValue('--black-text').trim(),
                                    },
                                },
                                y: {
                                    beginAtZero: true,
                                    max: selectedGraph === 'sentiment' ? 10 : undefined,
                                    ticks: {
                                        color: getComputedStyle(document.documentElement).getPropertyValue('--black-text').trim(),
                                    },
                                },
                            },
                        }}
                        ref={chartRef}
                        height={400}
                        width={800}
                    />
                </div>
            </div>
        </div>
    );
};

export default Graphs;
