import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './LandingPage.css';
import { useAuth } from "../AuthProvider";
import axios from 'axios';

const Home = ({ isDarkMode }) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [averageScore, setAverageScore] = useState(7.4); // Initial average score
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [overviewData, setOverviewData] = useState([]); // Store overview data
  const chartRef = useRef(null); // Reference to the chart instance
  const [snippets, setSnippets] = useState([]); // Store all snippets
  const navigate = useNavigate(); // Get the navigate function

  console.log("user in landing page:", user.profilePictureUrl)

  useEffect(() => {
    const fetchAllSnippets = async () => {
      try {
        const response = await axios.post("https://extension-360407.lm.r.appspot.com/api/snipx_snippets/user", {
          id: user.id,
        });
        setSnippets(response.data); // Store all snippets
      } catch (error) {
        console.error("Error fetching snippets:", error);
      }
    };

    if (user && user.id) {
      fetchAllSnippets();
    }
  }, [user]);

  useEffect(() => {
    const filteredSnippets = filterSnippetsBySelectedRange(selectedDate);
    updateChartData(filteredSnippets);
  }, [selectedDate, snippets, isDarkMode]); // Re-run when selectedDate, snippets, or isDarkMode changes

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: getComputedStyle(document.documentElement).getPropertyValue('--black-text').trim(), // Set text color based on dark mode
        },
      },
      title: {
        display: true,
        text: 'Sentiment Scores Over Time',
        color: getComputedStyle(document.documentElement).getPropertyValue('--black-text').trim(), // Set title color
      },
      tooltip: {
        bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--black-text').trim(), // Set tooltip text color
        titleColor: getComputedStyle(document.documentElement).getPropertyValue('--black-text').trim(),
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--black-text').trim(),
      },
    },
    scales: {
      x: {
        ticks: {
          color: getComputedStyle(document.documentElement).getPropertyValue('--black-text').trim(), // X-axis labels color
        },
      },
      y: {
        ticks: {
          color: getComputedStyle(document.documentElement).getPropertyValue('--black-text').trim(), // Y-axis labels color
        },
      },
    },
  };

  const updateChartData = (filteredSnippets) => {
    const sortedSnippets = filteredSnippets.sort((a, b) => new Date(a.date) - new Date(b.date));
    const scores = sortedSnippets.map(snippet => snippet.score);
    const labels = sortedSnippets.map(snippet => new Date(snippet.date).toLocaleDateString());

    const newChartData = {
      labels,
      datasets: [
        {
          label: 'Sentiment Scores',
          data: scores,
          borderColor: getComputedStyle(document.documentElement).getPropertyValue('--graph-line-color').trim(),
          backgroundColor: 'rgba(228, 39, 125, 0.2)',
        },
      ],
    };

    setChartData(newChartData);
    calculateAverageScore(scores); // Calculate average score
    updateOverviewData(sortedSnippets); // Update overview data

    if (chartRef.current) {
      chartRef.current.update();
    }
  };

  const filterSnippetsBySelectedRange = (selectedDate) => {
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

    const filteredSnippets = snippets.filter(snippet => {
      const snippetDate = new Date(snippet.date);
      return snippetDate >= startDate && snippetDate <= endDate;
    });

    return filteredSnippets;
  };

  const calculateAverageScore = (scores) => {
    const total = scores.reduce((sum, score) => sum + parseFloat(score), 0);
    const average = total / scores.length || 0;
    setAverageScore(average.toFixed(2)); // Set average score to two decimal places
  };

  const updateOverviewData = (filteredSnippets) => {
    const overviewData = filteredSnippets.map(snippet => ({
      date: new Date(snippet.date).toLocaleDateString(),
      green: snippet.green || 'N/A',
      orange: snippet.orange || 'N/A',
      red: snippet.red || 'N/A',
    })).reverse();

    setOverviewData(overviewData);
  };

  const handleChartClick = () => {
    navigate('/graphs');
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  return (
    <div className="landing-page">
    <div className="profile-section">
      <div
        className="profile-picture"
        style={{
          backgroundImage: user?.profilePictureUrl ? `url(${user.profilePictureUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
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
              </tr>
            </thead>
            <tbody>
              {overviewData.map((row, index) => (
                <tr key={index}>
                  <td>{row.date}</td>
                  <td>{row.green}</td>
                  <td>{row.orange}</td>
                  <td>{row.red}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div  onClick={handleChartClick} style={{ cursor: 'pointer' }} className="analysis-section">
        <h2>Sentiment Analysis</h2>
            <Line className="sentiment-analysis-graph" 
              data={chartData}
              options={chartOptions} // Add the options here
              ref={chartRef}
              onClick={handleChartClick} // Handle chart clicks 
            />
        <div className="average-score">
          <div className="circle">{averageScore}</div>
        </div>
      </div>

      <div className="calendar-section">
        <Calendar onChange={handleDateChange} value={selectedDate} />
        {/* <div className="calendar-controls">
          <button>Green</button>
          <button>Yellow</button>
          <button>Red</button>
          <button>Week</button>
          <button>Month</button>
        </div> */}
      </div>
    </div>
  );

};

export default Home;