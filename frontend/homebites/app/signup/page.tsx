'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Signup() {
  const [selectedRole, setSelectedRole] = useState<'chef' | 'customer' | null>(null)

  return (
    <div className="auth-container">
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
        <div className="container">
          <Link href="/" className="navbar-brand">
            🍳 HomeBites
          </Link>
          <div className="navbar-nav ms-auto">
            <Link href="/login" className="nav-link">Login</Link>
            <Link href="/signup" className="nav-link">Sign Up</Link>
          </div>
        </div>
      </nav>

      <div className="container">
        <div className="row justify-content-center align-items-center min-vh-100">
          <div className="col-lg-8 text-center">
            <div className="hero-section rounded-4 mb-5">
              <h1 className="display-4 fw-bold mb-4">
                Join HomeBites
              </h1>
              <p className="lead mb-5">
                Choose your role and start your culinary journey with us
              </p>
            </div>

            <div className="row g-4">
              <div className="col-md-6">
                <div 
                  className={`card role-selector h-100 ${selectedRole === 'chef' ? 'border-primary' : ''}`}
                  onClick={() => setSelectedRole('chef')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="card-body text-center p-5">
                    <div className="mb-4">
                      <span className="display-1">👨‍🍳</span>
                    </div>
                    <h3 className="card-title mb-3">Join as a Chef</h3>
                    <p className="card-text mb-4">
                      Share your culinary expertise and earn by selling your delicious homemade meals.
                    </p>
                    <Link 
                      href="/signup/chef" 
                      className="btn btn-primary btn-lg w-100"
                    >
                      Chef Signup
                    </Link>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div 
                  className={`card role-selector h-100 ${selectedRole === 'customer' ? 'border-primary' : ''}`}
                  onClick={() => setSelectedRole('customer')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="card-body text-center p-5">
                    <div className="mb-4">
                      <span className="display-1">🍽️</span>
                    </div>
                    <h3 className="card-title mb-3">Join as a Customer</h3>
                    <p className="card-text mb-4">
                      Discover amazing homemade meals from talented local chefs in your area.
                    </p>
                    <Link 
                      href="/signup/customer" 
                      className="btn btn-primary btn-lg w-100"
                    >
                      Customer Signup
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-5">
              <p className="text-muted">
                Already have an account?{' '}
                <Link href="/login" className="text-decoration-none fw-bold">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 