import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import AdminLayout from './layouts/AdminLayout';
import CustomerLayout from './layouts/CustomerLayout';
import DriverLayout from './layouts/DriverLayout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Drivers from './pages/Drivers';
import Packages from './pages/Packages';
import Bookings from './pages/Bookings';
import Payments from './pages/Payments';
import Reviews from './pages/Reviews';

import CustomerDashboard from './pages/customer/CustomerDashboard';
import CustomerPackages from './pages/customer/CustomerPackages';
import CustomerBookings from './pages/customer/CustomerBookings';
import CustomerPayments from './pages/customer/CustomerPayments';
import CustomerReviews from './pages/customer/CustomerReviews';

import DriverDashboard from './pages/driver/DriverDashboard';
import DriverPackagesAdd from './pages/driver/DriverPackagesAdd';
import DriverBookings from './pages/driver/DriverBookings';
import DriverPayments from './pages/driver/DriverPayments';
import DriverReviews from './pages/driver/DriverReviews';

// Helper to determine the default landing path per role
const getRoleDashboard = (role) => {
  const r = role?.toUpperCase();
  if (r === 'ADMIN') return '/admin/dashboard';
  if (r === 'DRIVER') return '/driver/dashboard';
  if (r === 'CUSTOMER') return '/customer/dashboard';
  return '/login';
};

// Route guards
const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role?.toUpperCase() !== 'ADMIN') {
    return <Navigate to={getRoleDashboard(user?.role)} replace />;
  }
  return children;
};

const CustomerRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role?.toUpperCase() !== 'CUSTOMER') {
    return <Navigate to={getRoleDashboard(user?.role)} replace />;
  }
  return children;
};

// DriverRoute: accessible before login; authenticated non-DRIVER users are redirected
const DriverRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  // If logged in but NOT a driver, redirect to correct area
  if (isAuthenticated && user?.role?.toUpperCase() !== 'DRIVER') {
    return <Navigate to={getRoleDashboard(user?.role)} replace />;
  }
  // Allow access whether authenticated or not
  return children;
};

const RootRedirect = () => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={getRoleDashboard(user?.role)} replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root landing redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Public login route */}
        <Route path="/login" element={<Login />} />

        {/* Protected ADMIN area */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users"     element={<Users />} />
          <Route path="drivers"   element={<Drivers />} />
          <Route path="packages"  element={<Packages />} />
          <Route path="bookings"  element={<Bookings />} />
          <Route path="payments"  element={<Payments />} />
          <Route path="reviews"   element={<Reviews />} />
        </Route>

        {/* Protected CUSTOMER area */}
        <Route
          path="/customer"
          element={
            <CustomerRoute>
              <CustomerLayout />
            </CustomerRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<CustomerDashboard />} />
          <Route path="packages"  element={<CustomerPackages />} />
          <Route path="bookings"  element={<CustomerBookings />} />
          <Route path="payments"  element={<CustomerPayments />} />
          <Route path="reviews"   element={<CustomerReviews />} />
        </Route>

        {/* Protected DRIVER area */}
        <Route
          path="/driver"
          element={
            <DriverRoute>
              <DriverLayout />
            </DriverRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"    element={<DriverDashboard />} />
          <Route path="packages-add" element={<DriverPackagesAdd />} />
          <Route path="bookings"     element={<DriverBookings />} />
          <Route path="payments"     element={<DriverPayments />} />
          <Route path="reviews"      element={<DriverReviews />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
