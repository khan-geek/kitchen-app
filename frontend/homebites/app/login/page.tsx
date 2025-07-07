'use client'
import { useRouter } from 'next/navigation'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Login() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRole, setSelectedRole] = useState<'chef' | 'customer'>('customer')
  const [step, setStep] = useState<'login' | 'otp'>('login')
  const [formData, setFormData] = useState({
    email: '',
    kitchenName: '',
    password: '',
    otp: ''
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
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
  useEffect(() => {

    const fetchStatus = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/auth/status/', {
          credentials: 'include' // Important: sends cookies
        })
        return res
      }
      catch (err) {
        return null
      }



    }

    async function init() {
      const res = await fetchStatus()
      if (res && res.ok) {
        const user = await res.json()
        console.log("use effect", user)
        if (user.role == 'chef') {
          router.push("/dashboard/chef")
        }
        else if (user.role == 'customer') {
          router.push("/dashboard/customer")
        }
      }
      else {
        setIsLoading(false)
      }
    }

    init()
  }, [router])


  const validateLoginForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (selectedRole === 'customer') {
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required'
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email is invalid'
      }
    } else {
      if (!formData.kitchenName.trim()) {
        newErrors.kitchenName = 'Kitchen name is required'
      }
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateOtpForm = () => {
    const newErrors: { [key: string]: string } = {}

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

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (validateLoginForm()) {
      // Here you would typically verify credentials with your backend
      const res = await fetch('http://localhost:8000/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier: selectedRole == 'chef' ? formData.kitchenName : formData.email, password: formData.password }),
        credentials: 'include'
      });

      console.log('Login attempt:', { role: selectedRole, ...formData })
      if (res.ok) {
        const user = (await res.json()).user
        console.log(user.role)
        if (user.role == 'chef') {
          router.push("/dashboard/chef")
        }
        else if (user.role == 'customer') {
          router.push("/dashboard/customer")
        }

      }
      // Simulate OTP requirement for security
      // alert('For security, please enter the OTP sent to your registered email/phone.')
      // setStep('otp')
    }
  }

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateOtpForm()) {
      // Here you would typically verify OTP with your backend
      console.log('OTP verification:', formData.otp)
      alert(`${selectedRole === 'chef' ? 'Chef' : 'Customer'} login successful!`)
    }
  }

  const resendOtp = () => {
    // Here you would typically resend OTP
    alert('OTP resent to your registered email/phone!')
  }

  const goBackToLogin = () => {
    setStep('login')
    setFormData(prev => ({ ...prev, otp: '' }))
    setErrors({})
  }

  if (!isLoading) {
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
            <div className="col-lg-5 col-md-7">
              <div className="auth-card p-5">
                <div className="text-center mb-4">
                  <h2 className="fw-bold mb-2">
                    {step === 'login' ? 'Welcome Back' : 'Verify OTP'}
                  </h2>
                  <p className="text-muted">
                    {step === 'login'
                      ? 'Sign in to your account'
                      : 'Enter the verification code for security'
                    }
                  </p>
                  {step === 'otp' && (
                    <div className="alert alert-info">
                      <small>
                        OTP has been sent to your registered email/phone for security verification
                      </small>
                    </div>
                  )}
                </div>

                {step === 'login' ? (
                  <>
                    {/* Role Selection */}
                    <div className="mb-4">
                      <div className="btn-group w-100" role="group">
                        <input
                          type="radio"
                          className="btn-check"
                          name="role"
                          id="customer-role"
                          checked={selectedRole === 'customer'}
                          onChange={() => setSelectedRole('customer')}
                        />
                        <label className="btn btn-outline-primary" htmlFor="customer-role">
                          🍽️ Customer
                        </label>

                        <input
                          type="radio"
                          className="btn-check"
                          name="role"
                          id="chef-role"
                          checked={selectedRole === 'chef'}
                          onChange={() => setSelectedRole('chef')}
                        />
                        <label className="btn btn-outline-primary" htmlFor="chef-role">
                          👨‍🍳 Chef
                        </label>
                      </div>
                    </div>

                    <form onSubmit={handleLoginSubmit}>
                      {selectedRole === 'customer' ? (
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
                      ) : (
                        <div className="mb-3">
                          <label htmlFor="kitchenName" className="form-label">Kitchen Name *</label>
                          <input
                            type="text"
                            className={`form-control ${errors.kitchenName ? 'is-invalid' : ''}`}
                            id="kitchenName"
                            name="kitchenName"
                            value={formData.kitchenName}
                            onChange={handleChange}
                            placeholder="Enter your kitchen name"
                          />
                          {errors.kitchenName && <div className="invalid-feedback">{errors.kitchenName}</div>}
                        </div>
                      )}

                      <div className="mb-4">
                        <label htmlFor="password" className="form-label">Password *</label>
                        <input
                          type="password"
                          className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Enter your password"
                        />
                        {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                      </div>

                      <button type="submit" className="btn btn-primary w-100 mb-3">
                        Sign In
                      </button>
                    </form>
                  </>
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
                        Enter the 6-digit security code sent to your registered contact
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary w-100 mb-3">
                      Verify & Sign In
                    </button>

                    <div className="text-center">
                      <button
                        type="button"
                        className="btn btn-link text-decoration-none me-3"
                        onClick={resendOtp}
                      >
                        Resend OTP
                      </button>
                      <button
                        type="button"
                        className="btn btn-link text-decoration-none"
                        onClick={goBackToLogin}
                      >
                        Back to Login
                      </button>
                    </div>
                  </form>
                )}

                <div className="text-center mt-4">
                  <p className="text-muted mb-0">
                    Don't have an account?{' '}
                    <Link href="/" className="text-decoration-none fw-bold">
                      Sign up here
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
}