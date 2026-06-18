import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Drivers from './pages/Drivers';
import Packages from './pages/Packages';
import Images from './pages/Images';
import Bookings from './pages/Bookings';
import Payments from './pages/Payments';
import Reviews from './pages/Reviews';

// Private route guard — redirects to /login if not authenticated
const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login />} />

        {/* Protected admin area */}
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <AdminLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users"     element={<Users />} />
          <Route path="drivers"   element={<Drivers />} />
          <Route path="packages"  element={<Packages />} />
          <Route path="images"    element={<Images />} />
          <Route path="bookings"  element={<Bookings />} />
          <Route path="payments"  element={<Payments />} />
          <Route path="reviews"   element={<Reviews />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
