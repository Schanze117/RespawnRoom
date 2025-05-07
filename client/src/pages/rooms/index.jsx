import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RoomsEntryScreen from './rooms';
import CreateRoom from './create';
import JoinRoom from './join';
import Room from './room';

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