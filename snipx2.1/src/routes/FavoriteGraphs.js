import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  LineElement,
  BarElement,
  PointElement,
  LineController,
  BarController,
  RadarController,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import './FavoriteGraphs.css';

// Register required elements, scales, and controllers
ChartJS.register(
  ArcElement,
  LineElement,
  BarElement,
  PointElement,
  LineController,
  BarController,
  RadarController,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
);

const FavoriteGraphs = () => {
  // Placeholder data for the graphs
  const lineData = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June'],
    datasets: [
      {
        label: 'Line Graph Example',
        data: [65, 59, 80, 81, 56, 55],
        borderColor: 'rgba(75,192,192,1)',
        backgroundColor: 'rgba(75,192,192,0.2)',
      },
    ],
  };

  const barData = {
    labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
    datasets: [
      {
        label: 'Bar Graph Example',
        data: [12, 19, 3, 5, 2, 3],
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
          'rgba(153, 102, 255, 0.2)',
          'rgba(255, 159, 64, 0.2)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const doughnutData = {
    labels: ['Red', 'Blue', 'Yellow'],
    datasets: [
      {
        label: 'Doughnut Graph Example',
        data: [300, 50, 100],
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const radarData = {
    labels: ['Running', 'Swimming', 'Eating', 'Cycling', 'Jumping'],
    datasets: [
      {
        label: 'Radar Graph Example',
        data: [20, 10, 4, 2, 7],
        backgroundColor: 'rgba(179,181,198,0.2)',
        borderColor: 'rgba(179,181,198,1)',
        pointBackgroundColor: 'rgba(179,181,198,1)',
      },
    ],
  };

  return (
    <div className="favorite-graphs-page">
      <h2>Favorite Graphs</h2>

      <div className="graphs-container">
        <div className="graph-wrapper">
          <Line data={lineData} />
        </div>
        <div className="graph-wrapper">
          <Bar data={barData} />
        </div>
        <div className="graph-wrapper">
          <Doughnut data={doughnutData} />
        </div>
        <div className="graph-wrapper">
          <Radar data={radarData} />
        </div>
      </div>
    </div>
  );
};

export default FavoriteGraphs;
