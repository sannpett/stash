import { RouterProvider } from "react-router";
import { AuthGate } from "./AuthGate";
import { router } from "./routes";

export default function App() {
  return (
    <AuthGate>
      <RouterProvider router={router} />
    </AuthGate>
  );
}
