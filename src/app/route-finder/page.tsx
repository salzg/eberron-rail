// app/route-finder/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Route, RoutesData, TrainTime } from '@/types/types';
import TinyQueue from 'tinyqueue';
import { Console } from 'console';

interface QueueNode {
    station: string;
    distance: number;
    route: Route[];
    time: TrainTime;  // New field to track the current time at this station
  }
  

export default function RouteFinderPage() {
    const [stations, setStations] = useState<string[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [start, setStart] = useState<string>('');
    const [end, setEnd] = useState<string>('');
    const [startingTime, setStartingTime] = useState<string>('08:00');  // Default start time
    const [optimalRoute, setOptimalRoute] = useState<Route[] | null>(null);
    
    useEffect(() => {
        async function fetchData() {
          const response = await fetch('/data/routes.json');
          if (!response.ok) {
            console.error('Failed to fetch routes data:', response.statusText);
            return;
          }
          try {
            const data = await response.json();
            const parsedRoutes = data.routes.map((route: any) => ({
              ...route,
              departure: TrainTime.fromString(route.departure),
              arrival: TrainTime.fromString(route.arrival),
            }));
            setStations(data.stations);
            setRoutes(parsedRoutes);
          } catch (error) {
            console.error('Error parsing JSON:', error);
          }
        }
        fetchData();
      }, []);
    
      useEffect(() => {
        if (start && end) {
          const route = findShortestRoute(start, end, TrainTime.fromString(startingTime));
          if(!route){
            console.log("No route found!")
          }
          console.log(route);
          setOptimalRoute(route);
        }
      }, [start, end, startingTime]);

    const findShortestRoute = (fromStation: string, toStation: string, startTime: TrainTime): Route[] | null => {
        const totalTimes: { [key: string]: number } = {};
        const previousStations: { [key: string]: Route[] } = {};
        const queue = new TinyQueue<QueueNode>([], (a, b) => a.distance - b.distance);
      
        routes.forEach(route => {
          totalTimes[route.from] = Infinity;
          totalTimes[route.to] = Infinity;
        });
        totalTimes[fromStation] = 0;
        queue.push({ station: fromStation, distance: 0, route: [], time: startTime });
      
        while (queue.length > 0) {
          const current = queue.pop();
      
          if (!current || current.station === toStation) {
            return current?.route || null;
          }
      
          const { station, distance, route, time } = current;
      
          const lookAheadEndTime = time.addTime(new TrainTime(24, 0)); // 24-hour window from the current arrival time
      
          if (distance > totalTimes[station]) {
            continue;
          }
      
          const neighbors = routes.filter(r => r.from === station);
      
          for (const neighbor of neighbors) {
            // Calculate the next train's departure time with the correct overhang
            let nextDepartureTime = new TrainTime(neighbor.departure.hours, neighbor.departure.minutes, time.overhang);
      
            // If the next departure is before or exactly at the current time, move to the next day
            if (nextDepartureTime.compareTo(time) <= 0) {
              nextDepartureTime.overhang += 1;
            }
      
            // Skip this connection if it's outside the 24-hour look-ahead window
            if (nextDepartureTime.compareTo(lookAheadEndTime) > 0) {
              continue;
            }
      
            // Calculate the waiting time between arrival and the next departure
            const waitTime = nextDepartureTime.compareTo(time); // This is in minutes
      
            // Calculate the new arrival time with correct overhang
            const newArrivalTime = nextDepartureTime.addTime(new TrainTime(neighbor.duration, 0));
      
            // Calculate the total time spent (travel + waiting)
            const totalTime = distance + waitTime + neighbor.duration;
      
            if (totalTime < totalTimes[neighbor.to]) {
              totalTimes[neighbor.to] = totalTime;
              const newRoute = [...route, { ...neighbor, departure: nextDepartureTime, arrival: newArrivalTime }];
              previousStations[neighbor.to] = newRoute;
              queue.push({ station: neighbor.to, distance: totalTime, route: newRoute, time: newArrivalTime });
            }
          }
    }
      
        console.log("No route found");
        return null;
      };
      

    return (
        <div>
          <h1>Route Finder</h1>
          <div>
            <label htmlFor="start">Start Station:</label>
            <select id="start" value={start} onChange={(e) => setStart(e.target.value)}>
              <option value="">Select a station</option>
              {stations.map((station) => (
                <option key={station} value={station}>
                  {station}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="end">End Station:</label>
            <select id="end" value={end} onChange={(e) => setEnd(e.target.value)}>
              <option value="">Select a station</option>
              {stations.map((station) => (
                <option key={station} value={station}>
                  {station}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="startingTime">Starting Time:</label>
            <input
              type="time"
              id="startingTime"
              value={startingTime}
              onChange={(e) => setStartingTime(e.target.value)}
            />
          </div>
    
          {optimalRoute && (
            <div>
              <h2>Optimal Route from {start} to {end}</h2>
              {optimalRoute.map((leg, index) => (
                <div key={index}>
                  <h3>Leg {index + 1}</h3>
                  <p><strong>From:</strong> {leg.from} <strong>To:</strong> {leg.to}</p>
                  <p><strong>Departure:</strong> {leg.departure.toString()} <strong>Arrival:</strong> {leg.arrival.toString()}</p>
                  <p><strong>Line:</strong> {leg.line} <strong>Type:</strong> {leg.type}</p>
                  <p><strong>Duration:</strong> {leg.duration} hours</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
}
