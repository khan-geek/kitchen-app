'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { json } from 'stream/consumers'

export default function KitchenSetup() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState({
    kitchenName: ''
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const checkAuthentication = async () => {
    const res = await fetch('http://localhost:8000/api/auth/dashboard/chef', {
      method: "GET",
      credentials: "include"

    });
    if (res.ok) {
      return true;
    }
    return false;
  }
  useEffect(() => {
    // Check authentication
    const checkAuth = () => {

      const userToken = localStorage.getItem('userToken')
      const userRole = localStorage.getItem('userRole')

      if (!userToken || userRole !== 'chef') {
        // Not authenticated or not a chef, redirect to login
        router.push('/login?redirect=kitchen-setup')
        return false
      }

      // Check if kitchen is already set up
      const kitchenData = localStorage.getItem('kitchenData')
      if (kitchenData) {
        // Kitchen already set up, redirect to dashboard
        router.push('/dashboard/chef')
        return false
      }

      setIsAuthenticated(true)
      return true
    }


    const initKitchenSetup = async () => {
      const check = await checkAuthentication()
      if (check) {
        const kitchenData = localStorage.getItem('kitchenData')
        if (kitchenData) {
          // Kitchen already set up, redirect to dashboard
          router.push('/dashboard/chef')
          return
        }
        setIsAuthenticated(true)
      }
      else {
        router.push('/login?redirect=kitchen-setup')
        return

      }
    }

    initKitchenSetup()
    setIsLoading(false)
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.kitchenName.trim()) {
      newErrors.kitchenName = 'Kitchen name is required'
    } else if (formData.kitchenName.trim().length < 3) {
      newErrors.kitchenName = 'Kitchen name must be at least 3 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      // Here you would typically save the kitchen setup to your backend
      console.log('Kitchen setup:', formData)

      const res = await fetch('http://localhost:8000/api/status', {
        method: "POST",
        credentials: "include",
        body : JSON.stringify({formData})
      });
      const data = await res.json();
      console.log(res.status)
      console.log(res)
      if (res.ok) {
        // Store kitchen data in localStorage for demo purposes
        localStorage.setItem('kitchenData', data.kitchen_name)
        console.log(localStorage.getItem('kitchenData'))
        alert('Kitchen setup completed! Welcome to your dashboard.')
        router.push('/dashboard/chef')

      }
    }
  }

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('userToken')
    localStorage.removeItem('userRole')
    localStorage.removeItem('chefInfo')
    router.push('/')
  }

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5>Loading kitchen setup...</h5>
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
          <p className="text-muted">You need to be logged in as a chef to access this page.</p>
          <Link href="/login" className="btn btn-primary">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
        <div className="container">
          <Link href="/" className="navbar-brand">
            🍳 HomeBites
          </Link>
          <div className="navbar-nav ms-auto">
            <Link href="/dashboard/chef" className="nav-link">Dashboard</Link>
            <button onClick={handleLogout} className="nav-link btn btn-link">Logout</button>
          </div>
        </div>
      </nav>

      <div className="container">
        <div className="row justify-content-center align-items-center min-vh-100">
          <div className="col-lg-6 col-md-8">
            <div className="auth-card p-5">
              <div className="text-center mb-4">
                <div className="mb-3">
                  <span className="display-1">👨‍🍳</span>
                </div>
                <h2 className="fw-bold mb-2">Setup Your Kitchen</h2>
                <p className="text-muted">Tell us about your kitchen to get started</p>
                <div className="alert alert-success">
                  <small>
                    ✅ Account created successfully! Now let's set up your kitchen.
                  </small>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="kitchenName" className="form-label">Kitchen Name *</label>
                  <input
                    type="text"
                    className={`form-control ${errors.kitchenName ? 'is-invalid' : ''}`}
                    id="kitchenName"
                    name="kitchenName"
                    value={formData.kitchenName}
                    onChange={handleChange}
                    placeholder="Enter your kitchen name"
                    required
                  />
                  {errors.kitchenName && <div className="invalid-feedback">{errors.kitchenName}</div>}
                  <div className="form-text">
                    This is how customers will see your kitchen. Choose a memorable name!
                  </div>
                </div>

                <div className="mb-4">
                  <div className="alert alert-info">
                    <h6 className="alert-heading">What's next?</h6>
                    <p className="mb-0 small">
                      After setting up your kitchen, you'll be able to:
                    </p>
                    <ul className="mb-0 small">
                      <li>Add your food items with photos and descriptions</li>
                      <li>Set prices and manage your menu</li>
                      <li>Receive orders from customers</li>
                      <li>Track your earnings and performance</li>
                    </ul>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary w-100 mb-3">
                  Create My Kitchen
                </button>

                <div className="text-center">
                  <p className="text-muted mb-0">
                    Want to skip for now?{' '}
                    <Link href="/dashboard/chef" className="text-decoration-none fw-bold">
                      Go to Dashboard
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 