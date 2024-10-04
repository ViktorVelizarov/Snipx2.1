import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './LandingPage.css';
import { useAuth } from "../AuthProvider";
import axios from 'axios';
import 'chartjs-plugin-trendline';

const Home = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [averageScore, setAverageScore] = useState(7.4);
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [overviewData, setOverviewData] = useState([]);
  const [skills, setSkills] = useState([]);
  const [userSkills, setUserSkills] = useState({});
  const [showTrendline, setShowTrendline] = useState(false);
  const chartRef = useRef(null);
  const [snippets, setSnippets] = useState([]);
  const [managedSnippets, setManagedSnippets] = useState([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    const fetchAllSnippets = async () => {
      try {
        const userSnippetsResponse = await axios.post("https://extension-360407.lm.r.appspot.com/api/snipx_snippets/user", { id: user.id });
        setSnippets(userSnippetsResponse.data);

        if (user.role === 'manager' || user.role === 'admin') {
          const managedUsersResponse = await axios.post("https://extension-360407.lm.r.appspot.com/api/managed_users", { id: user.id });
          const managedUsers = managedUsersResponse.data;

          let allManagedSnippets = [];
          for (const managedUser of managedUsers) {
            const managedSnippetsResponse = await axios.post("https://extension-360407.lm.r.appspot.com/api/snipx_snippets/user", { id: managedUser.id });
            allManagedSnippets = [...allManagedSnippets, ...managedSnippetsResponse.data];
          }
          setManagedSnippets(allManagedSnippets);
        }
      } catch (error) {
        console.error("Error fetching snippets or managed users' snippets:", error);
      }
    };

    if (user && user.id) {
      fetchAllSnippets();
      fetchUserSkills(user.id);
    }
  }, [user]);

  useEffect(() => {
    const allSnippets = [...snippets, ...managedSnippets];
    const filteredSnippets = filterSnippetsBySelectedRange(selectedDate, allSnippets);
    updateChartData(filteredSnippets);

    if (chartRef.current) {
      chartRef.current.update();
    }
  }, [selectedDate, snippets, managedSnippets, showTrendline]);

  const fetchUserSkills = async (userId) => {
    const skillCache = {};

    const fetchSkillDetails = async (skillId) => {
      if (skillCache[skillId]) return skillCache[skillId];
      try {
        const response = await axios.get(`https://extension-360407.lm.r.appspot.com/api/skills/${skillId}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        skillCache[skillId] = response.data;
        return response.data;
      } catch (error) {
        console.error(`Error fetching skill details for skill ID: ${skillId}`, error);
        return { skill_name: 'undefined' };
      }
    };

    try {
      const response = await axios.get(`https://extension-360407.lm.r.appspot.com/api/users/${userId}/ratings`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      const userSkillsData = await response.data.reduce(async (accPromise, rating) => {
        const acc = await accPromise;
        const { skill, score, created_at } = rating;
        const date = new Date(created_at).toLocaleDateString();

        let skillName = 'undefined';
        if (skill && skill.skill_name) {
          skillName = skill.skill_name;
        } else if (skill) {
          const fullSkill = await fetchSkillDetails(skill.id);
          skillName = fullSkill.skill_name || 'undefined';
        }

        if (!acc[skillName]) {
          acc[skillName] = { data: [], skillName: skillName };
        }

        acc[skillName].data.push({ date, score: parseFloat(score) });

        return acc;
      }, Promise.resolve({}));

      setSkills(userSkillsData);
    } catch (error) {
      console.error("Error fetching user skills:", error);
    }
  };

  const filterSnippetsBySelectedRange = (selectedDate, allSnippets) => {
    const today = new Date();
    const selectedDay = new Date(selectedDate);
    let startDayOffset = 3;
    let endDayOffset = 3;

    if (today.toDateString() === selectedDay.toDateString()) {
      startDayOffset = 6;
      endDayOffset = 0;
    } else if (today.getTime() - selectedDay.getTime() <= 1 * 24 * 60 * 60 * 1000) {
      startDayOffset = 5;
      endDayOffset = 1;
    } else if (today.getTime() - selectedDay.getTime() <= 2 * 24 * 60 * 60 * 1000) {
      startDayOffset = 4;
      endDayOffset = 2;
    }

    const startDate = new Date(selectedDay);
    startDate.setDate(selectedDay.getDate() - startDayOffset);
    const endDate = new Date(selectedDay);
    endDate.setDate(selectedDay.getDate() + endDayOffset);

    const filteredSnippets = allSnippets.filter(snippet => {
      const snippetDate = new Date(snippet.date);
      return snippetDate >= startDate && snippetDate <= endDate;
    });

    return filteredSnippets;
  };

  const updateChartData = (filteredSnippets) => {
    const sortedSnippets = filteredSnippets.sort((a, b) => new Date(a.date) - new Date(b.date));
    const scores = sortedSnippets.map(snippet => parseFloat(snippet.score));
    const labels = sortedSnippets.map(snippet => new Date(snippet.date).toLocaleDateString());

    const datasets = [
      {
        label: 'Sentiment Scores',
        data: scores,
        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--graph-line-color').trim(),
        backgroundColor: 'rgba(228, 39, 125, 0.2)',
      },
    ];

    if (showTrendline) {
      const trendlinePoints = calculateLinearRegression(scores);
      datasets.push({
        label: 'Trendline',
        data: trendlinePoints,
        borderColor: 'rgba(0, 123, 255, 0.75)',
        backgroundColor: 'rgba(0, 123, 255, 0.1)',
        type: 'line',
        fill: false,
      });
    }

    const newChartData = {
      labels,
      datasets,
    };

    setChartData(newChartData);
    calculateAverageScore(scores);
    updateOverviewData(sortedSnippets);
  };

  const calculateLinearRegression = (data) => {
    const N = data.length;
    const xSum = (N * (N - 1)) / 2;
    const ySum = data.reduce((acc, y) => acc + parseFloat(y), 0);
    const xySum = data.reduce((acc, y, x) => acc + x * parseFloat(y), 0);
    const xSqSum = (N * (N - 1) * (2 * N - 1)) / 6;

    const m = (N * xySum - xSum * ySum) / (N * xSqSum - xSum ** 2);
    const b = (ySum - m * xSum) / N;

    return data.map((_, x) => m * x + b);
  };

  const calculateAverageScore = (scores) => {
    const total = scores.reduce((sum, score) => sum + parseFloat(score), 0);
    const average = total / scores.length || 0;
    setAverageScore(average.toFixed(2));
  };

  const updateOverviewData = (filteredSnippets) => {
    const overviewData = filteredSnippets.map(snippet => ({
      date: new Date(snippet.date).toLocaleDateString(),
      green: snippet.green || 'N/A',
      orange: snippet.orange || 'N/A',
      red: snippet.red || 'N/A',
      actionText: snippet.action_text || 'No action provided',
    })).reverse();

    setOverviewData(overviewData);
  };

  const handleProfilePictureClick = () => {
    setIsPopupOpen(true);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const toggleTrendline = () => {
    setShowTrendline(!showTrendline);
  };

  return (
    <div className="landing-page">
      <div className="profile-section">
        <div
          className="profile-picture"
          style={{
            backgroundImage: user?.profilePictureUrl ? `url(data:image/png;base64,${user.profilePictureUrl})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            cursor: 'pointer',
          }}
          onClick={handleProfilePictureClick}
        >
          {!user?.profilePictureUrl && 'Profile Picture'}
        </div>
        <div className="profile-info">
          {user ? (
            <>
              <h2>Name: {user.email.substring(0, 3)}</h2>
              <p>Email: {user.email}</p>
              <p>Position: {user.role}</p>
            </>
          ) : (
            <p>Loading user information...</p>
          )}
        </div>
      </div>

      {isPopupOpen && (
        <div className="upload-popup">
          <div className="upload-popup-content">
            <h2>Upload New Profile Picture</h2>
            <div className="upload-area" onDrop={handleImageUpload} onDragOver={(e) => e.preventDefault()}>
              {selectedImage ? (
                <img src={selectedImage} alt="Selected" className="preview-image" />
              ) : (
                <p>Drag and drop an image here or click to select</p>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
              id="file-upload"
            />
            <button onClick={() => document.getElementById('file-upload').click()}>Upload Image</button>
            <button onClick={() => setIsPopupOpen(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="overview-section">
        <h2>Weekly Overview</h2>
        <div className="landing-page-table-wrapper">
          <table className="overview-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Green</th>
                <th>Yellow</th>
                <th>Red</th>
                <th>Actions for next day</th>
              </tr>
            </thead>
            <tbody>
              {overviewData.map((row, index) => (
                <tr key={index}>
                  <td>{row.date}</td>
                  <td>{row.green}</td>
                  <td>{row.orange}</td>
                  <td>{row.red}</td>
                  <td>{row.actionText}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="analysis-section">
        <h2>Sentiment Analysis</h2>
        <Line
          className="sentiment-analysis-graph"
          data={chartData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                labels: {
                  color: getComputedStyle(document.documentElement).getPropertyValue('--black-text').trim(),
                },
              },
              title: {
                display: true,
                text: 'Sentiment Scores Over Time',
                color: getComputedStyle(document.documentElement).getPropertyValue('--black-text').trim(),
              },
            },
            scales: {
              x: {
                ticks: {
                  color: getComputedStyle(document.documentElement).getPropertyValue('--black-text').trim(),
                },
              },
              y: {
                ticks: {
                  color: getComputedStyle(document.documentElement).getPropertyValue('--black-text').trim(),
                },
              },
            },
          }}
          ref={chartRef}
        />
        <div className="average-score-container">
          <div className="average-score">
            <div className="circle">{averageScore}</div>
          </div>
          <button onClick={toggleTrendline} className="toggle-trendline-button">
            {showTrendline ? 'Hide' : 'Show'} Trendline
          </button>
        </div>
      </div>

      <div className="calendar-section">
        <Calendar onChange={handleDateChange} value={selectedDate} />
      </div>

      <div className="skills-section">
        <h2>User Skills</h2>
        <table className="skills-table">
          <thead>
            <tr>
              <th>Skill Name</th>
              <th>Score</th>
              <th>Progress Visualization</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(skills).map((skillName, index) => (
              <tr key={index}>
                <td>{skillName !== 'undefined' ? skillName : 'Unknown Skill'}</td>
                <td>{skills[skillName]?.data?.[0]?.score || 'No rating'}</td>
                <td>
                  <div className="skills-chart-container">
                    <SkillChart key={index} skillData={skills[skillName]} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// SkillChart Component
const SkillChart = ({ skillData }) => {
  if (!skillData || skillData.data.length === 0) {
    return <p>No data available for this skill.</p>;
  }

  const chartData = {
    labels: skillData.data.map(d => d.date),
    datasets: [
      {
        label: skillData.skillName,
        data: skillData.data.map(d => d.score),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0,
        max: 11,
        ticks: {
          stepSize: 1,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  return (
    <div className="skill-chart-wrapper">
      <h4>{skillData.skillName}</h4>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default Home;
