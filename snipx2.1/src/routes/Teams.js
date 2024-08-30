import React, { useState, useEffect } from "react";
import './Teams.css';
import { useAuth } from "../AuthProvider";

function Teams() {
    const [teams, setTeams] = useState([]);
    const [newTeamName, setNewTeamName] = useState("");
    const [newTeamMembers, setNewTeamMembers] = useState([]);
    const [users, setUsers] = useState([]);
    const [editingTeamId, setEditingTeamId] = useState(null);
    const [editingTeamName, setEditingTeamName] = useState("");
    const [editingTeamMembers, setEditingTeamMembers] = useState([]);
    const { user } = useAuth();

    // Function to fetch teams
    const fetchTeams = async () => {
        try {
            const response = await fetch(`https://extension-360407.lm.r.appspot.com/api/teams?userId=${user.id}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user.token}`  // Assuming JWT token for authentication
                }
            });

            const data = await response.json();
            console.log('received teams:', data);
            
            // Ensure average_score is rounded to one decimal place
            const formattedTeams = data.map(team => ({
                ...team,
                average_score: parseFloat(team.average_score.toFixed(1))
            }));

            setTeams(formattedTeams);
        } catch (error) {
            console.error("Error fetching teams:", error);
        }
    };

    // Function to fetch users
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

    // Fetch teams and users on component mount or when user changes
    useEffect(() => {
        fetchTeams();
        fetchUsers();
    }, [user]);

    // Function to handle creating a new team
    const handleCreateTeam = async () => {
        try {
            const response = await fetch("https://extension-360407.lm.r.appspot.com/api/teams", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    teamName: newTeamName,
                    userIds: newTeamMembers,
                    currentUserId: user.id,
                }),
            });
            if (response.ok) {
                await fetchTeams();
                setNewTeamName("");
                setNewTeamMembers([]);
            } else {
                console.error("Failed to create team");
            }
        } catch (error) {
            console.error("Error creating team:", error);
        }
    };

    // Function to handle editing a team
    const handleEditClick = (team) => {
        setEditingTeamId(team.id);
        setEditingTeamName(team.team_name);
        setEditingTeamMembers(team.teamMembers.map(member => member.user_id));
    };

    // Function to handle saving edited team
    const handleSaveTeam = async (id) => {
        try {
            const response = await fetch(`https://extension-360407.lm.r.appspot.com/api/teams/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    team_name: editingTeamName,
                    userIds: editingTeamMembers,
                }),
            });
            if (response.ok) {
                await fetchTeams();
                setEditingTeamId(null);
            } else {
                console.error("Failed to save team");
            }
        } catch (error) {
            console.error("Error saving team:", error);
        }
    };

    // Function to handle canceling edit
    const handleCancelEdit = () => {
        setEditingTeamId(null);
    };

    // Function to handle deleting a team
    const handleDeleteTeam = async (id) => {
        const confirmed = window.confirm("Are you sure you want to delete this team?");
        if (confirmed) {
            try {
                const response = await fetch(`https://extension-360407.lm.r.appspot.com/api/teams/${id}`, {
                    method: "DELETE",
                });
                if (response.ok) {
                    await fetchTeams();
                } else {
                    console.error("Failed to delete team");
                }
            } catch (error) {
                console.error("Error deleting team:", error);
            }
        }
    };

    return (
        <div className="teams-container">
            <h1 className="page-title">Teams</h1>

            {/* New Team Form */}
            <div className="new-team-form">
                <h2 className="form-title">Add Team</h2>
                <div className="form-inputs">
                    <input
                        type="text"
                        placeholder="Team Name"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        className="input-field"
                    />
                    <select
                        multiple
                        value={newTeamMembers}
                        onChange={(e) => setNewTeamMembers(Array.from(e.target.selectedOptions, option => option.value))}
                        className="input-field"
                    >
                        {users.map((user) => (
                            <option key={user.id} value={user.id}>
                                {user.email}
                            </option>
                        ))}
                    </select>
                    <button onClick={handleCreateTeam} className="create-button">Create</button>
                </div>
            </div>

            {/* Teams Table */}
            <div className="teams-table">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Team Name</th>
                            <th>Members</th>
                            <th>Average Score</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teams.map((team) => (
                            <tr key={team.id}>
                                <td>{team.id}</td>
                                <td>
                                    {editingTeamId === team.id ? (
                                        <input
                                            type="text"
                                            value={editingTeamName}
                                            onChange={(e) => setEditingTeamName(e.target.value)}
                                            className="input-field"
                                        />
                                    ) : (
                                        team.team_name
                                    )}
                                </td>
                                <td>
                                    {editingTeamId === team.id ? (
                                        <select
                                            multiple
                                            value={editingTeamMembers}
                                            onChange={(e) => setEditingTeamMembers(Array.from(e.target.selectedOptions, option => option.value))}
                                            className="input-field"
                                        >
                                            {users.map((user) => (
                                                <option key={user.id} value={user.id}>
                                                    {user.email}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        team.teamMembers.map(member => users.find(user => user.id === member.user_id)?.email || "Unknown").join(", ")
                                    )}
                                </td>
                                <td>{team.average_score.toFixed(1)}</td>
                                <td>
                                    {editingTeamId === team.id ? (
                                        <>
                                            <button
                                                onClick={() => handleSaveTeam(team.id)}
                                                className="save-button"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={handleCancelEdit}
                                                className="cancel-button"
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => handleEditClick(team)}
                                                className="edit-button"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTeam(team.id)}
                                                className="delete-button"
                                            >
                                                Delete
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Teams;
