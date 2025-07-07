'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function CustomerSignup() {
  const [step, setStep] = useState<'info' | 'otp'>('info')
  const [formData, setFormData] = useState({
    first_name: '',
    second_name: '',
    email: '',
    phone_number: '',
    country: '',
    password: '',
    confirmPassword: '',
    otp: ''
  })

  const [errors, setErrors] = useState<{[key: string]: string}>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  const validateInfoForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required'
    }

    if (!formData.second_name.trim()) {
      newErrors.second_name = 'Second name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = 'Phone number is required'
    }

    if (!formData.country) {
      newErrors.country = 'Country is required'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateOtpForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.otp.trim()) {
      newErrors.otp = 'OTP is required'
    } else if (formData.otp.length !== 6) {
      newErrors.otp = 'OTP must be 6 digits'
    } else if (!/^\d{6}$/.test(formData.otp)) {
      newErrors.otp = 'OTP must contain only numbers'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (validateInfoForm()) {
       const res = await fetch('http://localhost:8000/api/auth/signup/customer/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include'
      });
      // Here you would typically send the data to your backend to generate OTP
      console.log('Customer info submitted:', formData)
      // Simulate OTP generation
      alert('OTP has been sent to your email and phone number!')
      // setStep('otp')
    }
  }

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateOtpForm()) {
      // Here you would typically verify OTP with your backend
      console.log('OTP verification:', formData.otp)
      alert('Customer account created successfully! You can now login with your email.')
    }
  }

  const resendOtp = () => {
    // Here you would typically resend OTP
    alert('OTP resent to your email and phone number!')
  }

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
          <div className="col-lg-6 col-md-8">
            <div className="auth-card p-5">
              <div className="text-center mb-4">
                <h2 className="fw-bold mb-2">Join as a Customer</h2>
                <p className="text-muted">
                  {step === 'info' 
                    ? 'Discover amazing homemade meals from local chefs' 
                    : 'Verify your account with OTP'
                  }
                </p>
                {step === 'otp' && (
                  <div className="alert alert-info">
                    <small>
                      OTP has been sent to <strong>{formData.email}</strong> and <strong>{formData.phone_number}</strong>
                    </small>
                  </div>
                )}
              </div>

              {step === 'info' ? (
                <form onSubmit={handleInfoSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="first_name" className="form-label">First Name *</label>
                      <input
                        type="text"
                        className={`form-control ${errors.first_name ? 'is-invalid' : ''}`}
                        id="first_name"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        placeholder="Enter your first name"
                      />
                      {errors.first_name && <div className="invalid-feedback">{errors.first_name}</div>}
                    </div>

                    <div className="col-md-6 mb-3">
                      <label htmlFor="second_name" className="form-label">Second Name *</label>
                      <input
                        type="text"
                        className={`form-control ${errors.second_name ? 'is-invalid' : ''}`}
                        id="second_name"
                        name="second_name"
                        value={formData.second_name}
                        onChange={handleChange}
                        placeholder="Enter your second name"
                      />
                      {errors.second_name && <div className="invalid-feedback">{errors.second_name}</div>}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email Address *</label>
                    <input
                      type="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email address"
                    />
                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="phone_number" className="form-label">Phone Number *</label>
                    <input
                      type="tel"
                      className={`form-control ${errors.phone_number ? 'is-invalid' : ''}`}
                      id="phone_number"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      placeholder="Enter your phone number"
                    />
                    {errors.phone_number && <div className="invalid-feedback">{errors.phone_number}</div>}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="country" className="form-label">Country *</label>
                    <select
                      className={`form-select ${errors.country ? 'is-invalid' : ''}`}
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                    >
                      <option value="">Select your country</option>
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="UK">United Kingdom</option>
                      <option value="AU">Australia</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                      <option value="IT">Italy</option>
                      <option value="ES">Spain</option>
                      <option value="JP">Japan</option>
                      <option value="IN">India</option>
                      <option value="BR">Brazil</option>
                      <option value="MX">Mexico</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.country && <div className="invalid-feedback">{errors.country}</div>}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">Password *</label>
                    <input
                      type="password"
                      className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a password"
                    />
                    {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                  </div>

                  <div className="mb-4">
                    <label htmlFor="confirmPassword" className="form-label">Confirm Password *</label>
                    <input
                      type="password"
                      className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                    />
                    {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
                  </div>

                  <button type="submit" className="btn btn-primary w-100 mb-3">
                    Continue to Verification
                  </button>
                </form>
              ) : (
                <form onSubmit={handleOtpSubmit}>
                  <div className="mb-4">
                    <label htmlFor="otp" className="form-label">Enter OTP *</label>
                    <input
                      type="text"
                      className={`form-control form-control-lg text-center ${errors.otp ? 'is-invalid' : ''}`}
                      id="otp"
                      name="otp"
                      value={formData.otp}
                      onChange={handleChange}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      style={{ fontSize: '1.5rem', letterSpacing: '0.5rem' }}
                    />
                    {errors.otp && <div className="invalid-feedback">{errors.otp}</div>}
                    <div className="form-text text-center">
                      Enter the 6-digit code sent to your email and phone
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary w-100 mb-3">
                    Verify & Create Account
                  </button>

                  <div className="text-center">
                    <button 
                      type="button" 
                      className="btn btn-link text-decoration-none"
                      onClick={resendOtp}
                    >
                      Resend OTP
                    </button>
                  </div>
                </form>
              )}

              <div className="text-center mt-4">
                <p className="text-muted mb-0">
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
    </div>
  )
} 