import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { useAuth } from "../AuthProvider";
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Graphs.css';

const Graphs = () => {
    const { user } = useAuth();
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [selectedGraph, setSelectedGraph] = useState('sentiment');
    const [chartData, setChartData] = useState({ labels: [], datasets: [] });
    const [snippets, setSnippets] = useState([]);
    const chartRef = useRef(null);
    const [users, setUsers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [selectedUserOrTeam, setSelectedUserOrTeam] = useState(user); // Default to the current user
    const [selectedEntityType, setSelectedEntityType] = useState('users'); // Default to 'users'

    useEffect(() => {
        fetchUsers();
        fetchTeams();
    }, [user]);

    useEffect(() => {
        fetchSnippets(); // Fetch snippets when the selected user or team changes
    }, [selectedUserOrTeam]);

    useEffect(() => {
        updateChartData(); // Update chart data whenever snippets, selected graph, or date range changes
    }, [startDate, endDate, selectedGraph, snippets]);

    const fetchUsers = async () => {
      try {
        const response = await fetch("https://extension-360407.lm.r.appspot.com/api/snipx_users");
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
            const endpoint = `https://extension-360407.lm.r.appspot.com/api/snipx_snippets/user`;
            const response = await axios.post(endpoint, {
                id: selectedUserOrTeam.id,
            });

            setSnippets(response.data); // Store the fetched snippets
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
  

    const handleStartDateChange = (date) => {
        setStartDate(date);
    };

    const handleEndDateChange = (date) => {
        setEndDate(date);
    };

    const handleEntityTypeChange = (e) => {
        setSelectedEntityType(e.target.value);
        setSelectedUserOrTeam(null); // Reset selected user or team when switching types
    };
    
    return (
        <div className="graphs-page">
            <div className="date-selection">
                <div>
                    <h3>Select Start Date</h3>
                    <Calendar onChange={handleStartDateChange} value={startDate} />
                </div>
                <div>
                    <h3>Select End Date</h3>
                    <Calendar onChange={handleEndDateChange} value={endDate} />
                </div>
            </div>
    
            <div className="graph-selection">
                <h3>Select Data to View</h3>
                <select value={selectedGraph} onChange={(e) => setSelectedGraph(e.target.value)}>
                    <option value="sentiment">Sentiment Score</option>
                    <option value="green">Green</option>
                    <option value="orange">Orange</option>
                    <option value="red">Red</option>
                    <option value="length">Snippet Length</option>
                </select>
    
                {user.role === 'admin' && (
                    <>
                        <h3>Select Data Type</h3>
                        <select value={selectedEntityType} onChange={handleEntityTypeChange}>
                            <option value="users">Users</option>
                            <option value="teams">Teams</option>
                        </select>
    
                        <h3>Select {selectedEntityType === 'users' ? 'User' : 'Team'}</h3>
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
                    </>
                )}
            </div>
    
            <div className="chart-section">
                <Line
                    data={chartData}
                    options={{
                      responsive: true,
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
                              beginAtZero: true, // Ensure the y-axis starts at 0
                              max: selectedGraph === 'sentiment' ? 10 : undefined, // Set max to 10 if sentiment is selected
                              ticks: {
                                  color: getComputedStyle(document.documentElement).getPropertyValue('--black-text').trim(),
                              },
                          },
                      },
                    }}
                    ref={chartRef}
                />
            </div>
        </div>
    );
    
};

export default Graphs;
