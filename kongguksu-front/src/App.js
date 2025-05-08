import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import MainLayout from "./MainLayout"; 
import "./index.css"; 

function App() {
  return (
    <Router>
      <MainLayout />
    </Router>
  );
}

export default App;