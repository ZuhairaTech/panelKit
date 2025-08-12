'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';

function getCurrentDate() {
    const now = new Date();
    return now.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

// Wrapper component for Suspense
export default function WeatherPage() {
    return (
        <Suspense fallback={<div>Loading Weather App data...</div>}>
            <WeatherContent />
        </Suspense>
    );
}

function WeatherContent() {
    const [weatherData, setWeatherData] = useState(null);
    const [city, setCity] = useState("kelantan");
    const [inputCity, setInputCity] = useState("");

    async function fetchData(cityName) {
        try {
            const response = await fetch(`/api/weather?address=${cityName}`);
            const jsonData = (await response.json()).data;
            setWeatherData(jsonData);
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        fetchData(city);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (inputCity.trim() !== "") {
            setCity(inputCity);
            fetchData(inputCity);
        }
    };

    return (
        <div className="panelkit-container">
            {/* Sidebar */}
            <div className="panelkit-sidebar">
                <div className="sidebar-section">
                    <div className="sidebar-header">
                        📁 Navigation
                    </div>
                    <Link href="/">
                        <div className="sidebar-item">
                            <span>🏠</span> Home
                        </div>
                    </Link>
                    <div className="sidebar-item active">
                        <span>☁️</span> Weather App
                    </div>
                </div>
                
                <div className="sidebar-section">
                    <div className="sidebar-header">
                        🔐 Notes
                    </div>
                </div>
            </div>

            <div className="panelkit-main">
                <div className="panelkit-tabs">
                    <div className="panelkit-tab active">
                        <span>☁️</span>
                        <span>Weather App Dashboard</span>
                    </div>
                </div>

                <div className='panelkit-content'>
                    <h1 style={{ 
                        fontSize: '24px', 
                        fontWeight: '600', 
                        marginBottom: '24px',
                        color: 'var(--panelkit-text)'
                    }}>
                        Weather App</h1>
                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            placeholder="Enter city or state"
                            value={inputCity}
                            onChange={(e) => setInputCity(e.target.value)}
                        />
                        <button type="submit">Search</button>
                    </form>

                    <article className="widget">
                        {weatherData && weatherData.weather && weatherData.weather[0] ? (
                            <main>
                                <h2>{weatherData.name}, {weatherData.sys?.country}</h2>
                                <p>{getCurrentDate()}</p>
                                <p><strong>Condition:</strong> {weatherData.weather[0].description}</p>
                                <p><strong>Temperature:</strong> {weatherData.main?.temp} °C</p>
                                <p><strong>Feels Like:</strong> {weatherData.main?.feels_like} °C</p>
                                <p><strong>Humidity:</strong> {weatherData.main?.humidity}%</p>
                                <p><strong>Wind:</strong> {weatherData.wind?.speed} m/s</p>
                            </main>
                        ) : (
                            <p>No weather data available.</p>
                        )}
                    </article>
                </div>
            </div>
        </div>
    );
}
