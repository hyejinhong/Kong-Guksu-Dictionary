import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Tailwind CSS를 위한 기본 CSS 파일
import App from './App';
// import reportWebVitals from './reportWebVitals'; // 필요 없으면 삭제

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals(); // 필요 없으면 삭제