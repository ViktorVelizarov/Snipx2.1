import React, { useState, useEffect } from "react";
import './Notifications.css'; 

function UserSkillHoursAndNotifications() {
    const [userSkillHours, setUserSkillHours] = useState([]);
    const [notifications, setNotifications] = useState([]);

    // Function to fetch user skill hours
    const fetchUserSkillHours = async () => {
        try {
            const response = await fetch("https://extension-360407.lm.r.appspot.com/api/user-skill-hours", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                }
            });

            const data = await response.json();
            console.log('Received user skill hours:', data);
            setUserSkillHours(data);
        } catch (error) {
            console.error("Error fetching user skill hours:", error);
        }
    };

    // Function to fetch notifications
    const fetchNotifications = async () => {
        try {
            const response = await fetch("https://extension-360407.lm.r.appspot.com/api/notifications", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                }
            });

            const data = await response.json();
            console.log('Received notifications:', data);
            setNotifications(data);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    // Fetch user skill hours and notifications on component mount
    useEffect(() => {
        fetchUserSkillHours();
        fetchNotifications();
    }, []);

    return (
        <div className="container">
            <h1 className="page-title">User Skill Hours and Notifications</h1>

            {/* User Skill Hours Table */}
            <div className="table-container">
                <h2 className="table-title">User Skill Hours</h2>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>User ID</th>
                            <th>Skill ID</th>
                            <th>Hours</th>
                        </tr>
                    </thead>
                    <tbody>
                        {userSkillHours.map((record) => (
                            <tr key={record.id}>
                                <td>{record.id}</td>
                                <td>{record.user_id}</td>
                                <td>{record.skill_id}</td>
                                <td>{record.hours}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Notifications Table */}
            <div className="table-container">
                <h2 className="table-title">Notifications</h2>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>User ID</th>
                            <th>Skill ID</th>
                            <th>Approved</th>
                        </tr>
                    </thead>
                    <tbody>
                        {notifications.map((notification) => (
                            <tr key={notification.id}>
                                <td>{notification.id}</td>
                                <td>{notification.user_id}</td>
                                <td>{notification.skill_id}</td>
                                <td>{notification.approved ? 'Yes' : 'No'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default UserSkillHoursAndNotifications;
