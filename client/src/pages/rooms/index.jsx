import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RoomsEntryScreen from './rooms.jsx';
import CreateRoom from './create.jsx';
import JoinRoom from './join.jsx';
import Room from './room.jsx';

export default function RoomsRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RoomsEntryScreen />} />
      <Route path="/create" element={<CreateRoom />} />
      <Route path="/join" element={<JoinRoom />} />
      <Route path="/:id" element={<Room />} />
      <Route path="*" element={<Navigate to="/rooms" replace />} />
    </Routes>
  );
} 