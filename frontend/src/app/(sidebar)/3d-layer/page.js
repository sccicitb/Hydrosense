"use client";
import React, { useEffect } from "react";

const Dashboard = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "Build/V18.loader.js";
    script.async = true;

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div style={{ width: "100svw", height: "100svh", overflow: "hidden" }}>
      <iframe
        src="index.html"
        width="100%"
        height="100%"
        // style={{ border: "none", position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        allowFullScreen
      />
    </div>
  );
};

export default Dashboard;
