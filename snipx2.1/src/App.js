import Users from "./routes/Users";
import Teams from "./routes/Teams";
import Snippets from "./routes/Snippets";
import AddSnippet from "./routes/AddSnippet";
import MySnippets from "./routes/MySnippets";
import LandingPage from "./routes/LandingPage";
import WeeklyReport from "./routes/WeeklyReport";
import NotAuthorized from "./routes/NotAuthorized";
import Login from "./routes/Login";
import NavBar from './routes/NavBar';
import Graphs from "./routes/Graphs";
import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
  defer,
} from "react-router-dom";

import { AuthProvider } from "./AuthProvider";
import React, { createContext } from "react";
import Home from "./routes/Home";
import MainLayout from "./routes/MainLayout";
import { ProtectedLayout } from "./routes/ProtectedLayout";
// Creating context for the base API URL.
// export const apiUrl = createContext("http://localhost:8080"); //local api during development
export const apiUrl = createContext("https://extension-360407.lm.r.appspot.com");

// The ProtectedLayout component is used to wrap routes that require user authentication.
export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<AuthProvider />}>
       <Route path="/" element={<NavBar />}>
        <Route path="login" element={<Login />} />
        <Route path="not-authorized" element={<NotAuthorized />} />
        <Route index element={<Home />} />
          <Route path="home" element={<LandingPage />} />
          <Route path="add-snippet" element={<AddSnippet />} />
          <Route path="weekly-report" element={<WeeklyReport />} />
          <Route path="my-snippets" element={<MySnippets />} />
          <Route path="graphs" element={<Graphs />} />
        <Route element={<ProtectedLayout />}>
          
          <Route path="snippets" element={<Snippets />} />
          <Route path="users" element={<Users />} />
          <Route path="teams" element={<Teams />} />
        </Route>
      </Route>
    </Route>
  )
);