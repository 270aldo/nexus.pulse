import { createBrowserRouter, Outlet } from "react-router-dom";
import { userRoutes } from "./user-routes";
import NotFoundPage from "./pages/NotFoundPage";
import SomethingWentWrongPage from "./pages/SomethingWentWrongPage";
import { AppProvider } from "./components/AppProvider";

// Wrapper para incluir AppProvider en todas las rutas
const AppLayout = () => {
  return (
    <AppProvider>
      <Outlet />
    </AppProvider>
  );
};

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <SomethingWentWrongPage />,
    children: [
      ...userRoutes,
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);