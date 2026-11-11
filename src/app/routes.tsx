import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components";
import {
  ChallengeDetail,
  Challenges,
  FriendProfile,
  Friends,
  GoalDetail,
  Goals,
  Home,
  Leaderboard,
  NotFound,
  Notifications,
  Profile,
  Settings,
  Transactions,
} from "./screens";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Home },
      { path: "goals", Component: Goals },
      { path: "goals/:id", Component: GoalDetail },
      { path: "transactions", Component: Transactions },
      { path: "challenges", Component: Challenges },
      { path: "challenges/:id", Component: ChallengeDetail },
      { path: "leaderboard", Component: Leaderboard },
      { path: "friends", Component: Friends },
      { path: "friends/:id", Component: FriendProfile },
      { path: "profile", Component: Profile },
      { path: "settings", Component: Settings },
      { path: "notifications", Component: Notifications },
      { path: "*", Component: NotFound },
    ],
  },
]);
