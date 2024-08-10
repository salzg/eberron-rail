import { useState, useEffect } from 'react';
import path from 'path';
import fs from 'fs/promises';
import { GetStaticProps } from 'next';
import { Route, RoutesData } from '@/types/types';

interface HomeProps {
  stations: string[];
  routes: Route[];
}

const Home: React.FC<HomeProps> = ({ stations, routes }) => {
  const [start, setStart] = useState<string>('');
  const [end, setEnd] = useState<string>('');
  const [optimalRoute, setOptimalRoute] = useState<Route | null>(null);

  useEffect(() => {
    if (start && end) {
      const route = findShortestRoute(start, end);
      setOptimalRoute(route);
    }
  }, [start, end]);

  const findShortestRoute = (fromStation: string, toStation: string): Route | null => {
    const queue: { station: string; route: Route[]; duration: number }[] = [];
    const visited = new Set<string>();

    queue.push({ station: fromStation, route: [], duration: 0 });

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;

      const { station, route, duration } = current;

      if (station === toStation) {
        return {
          ...route[0],
          duration: duration,
        };
      }

      visited.add(station);

      const neighbors = routes.filter((r) => r.from === station);

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.to)) {
          queue.push({
            station: neighbor.to,
            route: [...route, neighbor],
            duration: duration + neighbor.duration,
          });
        }
      }
    }

    return null; // No route found
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

      {optimalRoute && (
        <div>
          <h2>Optimal Route from {start} to {end}</h2>
          <p>Line: {optimalRoute.line}</p>
          <p>Duration: {optimalRoute.duration} hours</p>
          <p>Departure: {optimalRoute.departure.hour}</p>
          <p>Arrival: {optimalRoute.arrival.hour}</p>
        </div>
      )}
    </div>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  const filePath = path.join(process.cwd(), 'data', 'routes.json');
  const jsonData = await fs.readFile(filePath, 'utf-8');
  const data: RoutesData = JSON.parse(jsonData);

  return {
    props: {
      stations: data.stations,
      routes: data.routes,
    },
  };
};

export default Home;