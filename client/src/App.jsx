import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import CreateOrder from './pages/CreateOrder'
import Clients from './pages/Clients'
import Products from './pages/Products'
import Transactions from './pages/Transactions'
import Tickets from './pages/Tickets'
import TicketDetail from './pages/TicketDetail'
import Profile from './pages/Profile'
import TopUp from './pages/TopUp'
import TopupRequests from './pages/TopupRequests'
import ApiDocs from './pages/ApiDocs'

export default function App() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/new" element={<CreateOrder />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/tickets/:id" element={<TicketDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/topup" element={<TopUp />} />
        <Route path="/developer" element={<ApiDocs />} />

        {/* Admin-only routes */}
        <Route path="/clients" element={<ProtectedRoute adminOnly><Clients /></ProtectedRoute>} />
        <Route path="/products" element={<ProtectedRoute adminOnly><Products /></ProtectedRoute>} />
        <Route path="/topup-requests" element={<ProtectedRoute adminOnly><TopupRequests /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
