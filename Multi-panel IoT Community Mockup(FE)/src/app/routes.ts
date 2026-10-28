import { createBrowserRouter } from "react-router"
import Login from "../pages/Login"
import Home from "../pages/Home"
import Sensor from "../pages/Sensor"
import History from "../pages/History"
import Profile from "../pages/Profile"

export const router = createBrowserRouter([
  { path: "/dang-nhap", Component: Login },
  { path: "/login", Component: Login },
  { path: "/", Component: Home },
  { path: "/sensor", Component: Sensor },
  { path: "/history", Component: History },
  { path: "/profile", Component: Profile },
])
