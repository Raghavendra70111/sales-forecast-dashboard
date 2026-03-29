import axios from 'axios';

const API = axios.create({
  baseURL: 'http://127.0.0.1:5000/api', // Matches your working backend
});

export const fetchStats = () => API.get('/stats');
export const fetchChartData = () => API.get('/sales-chart');
export const fetchForecast = () => API.get('/forecast');