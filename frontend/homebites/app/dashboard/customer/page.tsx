'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Order {
  id: string
  kitchenName: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  total: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  orderDate: string
  estimatedDelivery?: string
}

interface Kitchen {
  id: string
  name: string
  description: string
  image: string
  rating: number
  foodCount: number
  isOpen: boolean
}

export default function CustomerDashboard() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [customerInfo, setCustomerInfo] = useState<any>(null)
  const [showWelcome, setShowWelcome] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  // Sample kitchens data
  const [kitchens, setKitchens] = useState<Kitchen[]>([])
  // useEffect(() => {
  //   // Check authentication
  //   const checkAuth = () => {
  //     const userToken = localStorage.getItem('userToken')
  //     const userRole = localStorage.getItem('userRole')

  //     if (!userToken || userRole !== 'customer') {
  //       // Not authenticated or not a customer, redirect to login
  //       router.push('/login?redirect=customer-dashboard')
  //       return false
  //     }

  //     // Get customer info
  //     const storedCustomerInfo = localStorage.getItem('customerInfo')
  //     if (storedCustomerInfo) {
  //       setCustomerInfo(JSON.parse(storedCustomerInfo))
  //     }

  //     setIsAuthenticated(true)
  //     return true
  //   }

  //   checkAuth()
  //   setIsLoading(false)
  // }, [router])
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/auth/status/', {
          credentials: 'include' // Important: sends cookies
        })
        if (!res.ok) {
          throw new Error('Unauthorized')
        }

        const data = await res.json()
        if (data.role !== 'customer') {
          router.push('/login?redirect=customer-dashboard')
          return false
        }

        setCustomerInfo(data)
        setIsAuthenticated(true)
        return true
      } catch (err) {
        router.push('/login?redirect=customer-dashboard')
      }
    }
    const fetchOrders = async () => {

      try {
        const res = await fetch(`http://localhost:8000/api/auth/my-orders/`, {
          credentials: 'include'
        })
        const data = await res.json()

        // Transform backend data into Order[] format
        const formattedOrders = data.map((order: any) => ({
          id: order.id.toString(),
          kitchenName: order.chef.kitchen_name,
          items: order.items.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            price: parseFloat(item.price)
          })),
          total: order.items.reduce((sum: number, item: any) => sum + item.quantity * parseFloat(item.price), 0),
          status: order.status,
          orderDate: order.created_at,
          estimatedDelivery: null
        }))


        setOrders(formattedOrders)
      } catch (err) {
        console.error('Failed to fetch orders', err)
      }
    }
    const fetchKitchens = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/auth/get-all-kitchens/`)
        const data = await res.json()

        const formattedKitchens = data.map((kitchen: any) => ({
          id: kitchen.id.toString(),
          name: kitchen.kitchen_name,
          description: kitchen.description || '', // add in backend if needed
          image: kitchen.image || '/placeholder-kitchen.jpg',
          rating: kitchen.rating || 4.5, // fake or calculated in backend
          foodCount: kitchen.items?.length || 0,
          isOpen: true // you can add isOpen logic based on backend if needed
        }))

        setKitchens(formattedKitchens)
      } catch (err) {
        console.error('Failed to fetch kitchens', err)
      }
    }
    async function init() {
      if (await fetchStatus()) {
        await fetchKitchens()
        await fetchOrders()
        setIsLoading(false)
      }
    }

    init()
  }, [router])


  const handleLogout = async () => {
    await fetch('http://localhost:8000/api/auth/logout/', {
      method: 'POST',
      credentials: 'include',
    })
    router.push('/login')
  }


  const getStatusBadge = (status: Order['status']) => {
    const statusConfig = {
      pending: { class: 'bg-warning', text: 'Pending' },
      confirmed: { class: 'bg-info', text: 'Confirmed' },
      preparing: { class: 'bg-primary', text: 'Preparing' },
      ready: { class: 'bg-success', text: 'Ready' },
      delivered: { class: 'bg-success', text: 'Delivered' },
      cancelled: { class: 'bg-danger', text: 'Cancelled' }
    }

    const config = statusConfig[status]
    return <span className={`badge ${config.class}`}>{config.text}</span>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getTotalOrders = () => orders.length
  const getActiveOrders = () => orders.filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)).length
  const getTotalSpent = () => orders.reduce((total, order) => total + order.total, 0)

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5>Loading your dashboard...</h5>
        </div>
      </div>
    )
  }

  // Show unauthorized message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="mb-3">
            <span className="display-1">🔒</span>
          </div>
          <h4>Access Denied</h4>
          <p className="text-muted">You need to be logged in as a customer to access this page.</p>
          <Link href="/login" className="btn btn-primary">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-vh-100 bg-light">
      {/* Navigation */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">
          <Link href="/" className="navbar-brand">
            🍳 HomeBites
          </Link>
          <div className="navbar-nav me-auto">
            <Link href="/browse" className="nav-link">Browse Kitchens</Link>
            <Link href="/dashboard/customer" className="nav-link active">My Orders</Link>
          </div>
          <div className="navbar-nav">
            <span className="navbar-text me-3">
              Welcome, {customerInfo?.name || 'Customer'}!
            </span>
            <button onClick={handleLogout} className="nav-link btn btn-link">Logout</button>
          </div>
        </div>
      </nav>

      <div className="container py-4">
        {/* Welcome Message */}
        {showWelcome && (
          <div className="alert alert-success alert-dismissible fade show mb-4" role="alert">
            <div className="d-flex align-items-center">
              <div className="me-3">
                <span className="display-6">🎉</span>
              </div>
              <div>
                <h5 className="alert-heading mb-1">Welcome to HomeBites!</h5>
                <p className="mb-0">
                  Hello {customerInfo?.name || 'there'}! We're excited to have you here.
                  Discover amazing home-cooked meals from talented chefs in your area.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={() => setShowWelcome(false)}
              aria-label="Close"
            ></button>
          </div>
        )}

        {/* Dashboard Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="h3 mb-1">My Dashboard</h1>
                <p className="text-muted mb-0">Track your orders and discover amazing kitchens</p>
              </div>
              <Link href="/browse" className="btn btn-primary">
                Browse All Kitchens
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row mb-4">
          <div className="col-md-3 mb-3">
            <div className="card bg-primary text-white">
              <div className="card-body">
                <h5 className="card-title">Total Orders</h5>
                <h2 className="mb-0">{getTotalOrders()}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card bg-success text-white">
              <div className="card-body">
                <h5 className="card-title">Active Orders</h5>
                <h2 className="mb-0">{getActiveOrders()}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card bg-info text-white">
              <div className="card-body">
                <h5 className="card-title">Total Spent</h5>
                <h2 className="mb-0">${getTotalSpent().toFixed(2)}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card bg-warning text-white">
              <div className="card-body">
                <h5 className="card-title">Available Kitchens</h5>
                <h2 className="mb-0">{kitchens.filter(k => k.isOpen).length}</h2>
              </div>
            </div>
          </div>
        </div>

        {/* Available Kitchens Section */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Available Kitchens</h5>
                <Link href="/browse" className="btn btn-sm btn-outline-primary">
                  View All
                </Link>
              </div>
              <div className="card-body">
                <div className="row">
                  {kitchens.slice(0, 6).map(kitchen => (
                    <div key={kitchen.id} className="col-lg-4 col-md-6 mb-3">
                      <div className="card h-100">
                        <div className="position-relative">
                          <img
                            src={kitchen.image}
                            className="card-img-top"
                            alt={kitchen.name}
                            style={{ height: '200px', objectFit: 'cover' }}
                          />
                          <div className="position-absolute top-0 end-0 m-2">
                            {kitchen.isOpen ? (
                              <span className="badge bg-success">Open</span>
                            ) : (
                              <span className="badge bg-secondary">Closed</span>
                            )}
                          </div>
                        </div>
                        <div className="card-body">
                          <h6 className="card-title mb-1">{kitchen.name}</h6>
                          <div className="d-flex align-items-center mb-2">
                            <span className="text-warning me-1">★</span>
                            <span className="small">{kitchen.rating}</span>
                            <span className="text-muted small ms-2">({kitchen.foodCount} items)</span>
                          </div>
                          <p className="card-text small text-muted">{kitchen.description}</p>
                          <Link
                            href={`/kitchen/${kitchen.id}`}
                            className="btn btn-sm btn-outline-primary w-100"
                          >
                            View Menu
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Order History</h5>
              </div>
              <div className="card-body">
                {orders.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="mb-3">
                      <span className="display-1">🍽️</span>
                    </div>
                    <h4>No orders yet</h4>
                    <p className="text-muted">Start exploring kitchens and place your first order!</p>
                    <Link href="/browse" className="btn btn-primary">
                      Browse Kitchens
                    </Link>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Kitchen</th>
                          <th>Items</th>
                          <th>Total</th>
                          <th>Status</th>
                          <th>Order Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(order => (
                          <tr key={order.id}>
                            <td>
                              <strong>{order.id}</strong>
                            </td>
                            <td>{order.kitchenName}</td>
                            <td>
                              <div>
                                {order.items.map((item, index) => (
                                  <div key={index} className="small">
                                    {item.quantity}x {item.name}
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td>
                              <strong className="text-success">
                                ${order.total.toFixed(2)}
                              </strong>
                            </td>
                            <td>
                              {getStatusBadge(order.status)}
                            </td>
                            <td>
                              <div className="small">
                                {formatDate(order.orderDate)}
                              </div>
                              {order.estimatedDelivery && (
                                <div className="small text-muted">
                                  Est. delivery: {formatDate(order.estimatedDelivery)}
                                </div>
                              )}
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => alert(`Order details for ${order.id}`)}
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 