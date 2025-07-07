
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface FoodItem {
  id: string
  name: string
  origin: string
  description: string
  ingredients: string[]
  allergens: string[]
  image: string
  is_published: boolean
  price: number
}
interface KitchenData {
  kitchen_name: string
}

export default function ChefDashboard() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [showAddFoodModal, setShowAddFoodModal] = useState(false)
  const [kitchenData, setKitchenData] = useState<KitchenData | null>(null)

  // 1. Check auth and fetch items
  useEffect(() => {
    async function init() {
      try {
        const res = await fetch('http://localhost:8000/api/auth/status/', {
          credentials: 'include',
        })
        if (!res.ok) throw new Error('Not authenticated')

        const user = await res.json()
        if (user.role !== 'chef') throw new Error('Not a chef')

        setIsAuthenticated(true)

        // Fetch kitchen items
        const itemsRes = await fetch('http://localhost:8000/api/auth/dashboard/chef/', {
          credentials: 'include',
        })
        if (!itemsRes.ok) throw new Error('Failed to load items')

        const itemsData = await itemsRes.json()
        setFoodItems(itemsData)
      } catch (e) {
        router.push('/login?redirect=chef-dashboard')
      } finally {
        setIsLoading(false)
      }
    }

    init()
  }, [router])

  const addFoodItem = async (foodData: Omit<FoodItem, 'id' | 'is_published'>) => {
    try {
      const res = await fetch('http://localhost:8000/api/auth/dashboard/chef/', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(foodData),
      })
      if (!res.ok) throw new Error('Failed to add item')

      const newItem = await res.json()
      setFoodItems(prev => [...prev, newItem])
      setShowAddFoodModal(false)
    } catch (err) {
      console.error(err)
    }
  }
  // const togglePublish = (foodId: string) => {
  //   setFoodItems(prev =>
  //     prev.map(food =>
  //       food.id === foodId
  //         ? { ...food, isPublished: !food.is_published }
  //         : food
  //     )
  //   )
  // }
  // const deleteFood = (foodId: string) => {
  //   setFoodItems(prev => prev.filter(food => food.id !== foodId))
  // }
  const togglePublish = async (foodId: string, currentStatus: boolean) => {
  try {
    const response = await fetch(`http://localhost:8000/api/auth/dashboard/chef/${foodId}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Important: sends the cookies
      body: JSON.stringify({ is_published: !currentStatus }),
    });

    if (!response.ok) {
      throw new Error("Failed to toggle publish status");
    }

    const updatedItem = await response.json();

    setFoodItems((prev) =>
      prev.map((food) =>
        food.id === foodId ? { ...food, is_published: updatedItem.is_published } : food
      )
    );
  } catch (error) {
    console.error("Error toggling publish status:", error);
  }
};
  const deleteFood = async (foodId: string) => {
  try {
    console.log(foodId)
    const response = await fetch(`http://localhost:8000/api/auth/dashboard/chef/${foodId}/`, {
      method: 'DELETE',
      credentials: 'include', // important if you're using cookie-based JWT auth
    });

    if (!response.ok) {
      const data = await response.json();
      console.error("Delete failed:", data.error || data);
      return;
    }

    // Remove item from frontend state
    setFoodItems(prev => prev.filter(food => food.id !== foodId));
  } catch (error) {
    console.error("Error deleting food:", error);
  }
};

  const handleLogout = async () => {
    await fetch('http://localhost:8000/api/auth/logout/', {
      method: 'POST',
      credentials: 'include',
    })
    router.push('/login')
  }

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
    <div className="min-vh-100 bg-light">
      {/* Navigation */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">
          <Link href="/dashboard/chef" className="navbar-brand">
            🍳 {kitchenData?.kitchen_name || 'My Kitchen'}
          </Link>
          <div className="navbar-nav ms-auto">
            <span className="navbar-text me-3">
              Welcome, Chef!
            </span>
            <button onClick={handleLogout} className="nav-link btn btn-link">Logout</button>
          </div>
        </div>
      </nav>

      <div className="container py-4">
        {/* Dashboard Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="h3 mb-1">Kitchen Dashboard</h1>
                <p className="text-muted mb-0">Manage your food items and orders</p>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => setShowAddFoodModal(true)}
              >
                + Add New Food
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row mb-4">
          <div className="col-md-3 mb-3">
            <div className="card bg-primary text-white">
              <div className="card-body">
                <h5 className="card-title">Total Items</h5>
                <h2 className="mb-0">{foodItems.length}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card bg-success text-white">
              <div className="card-body">
                <h5 className="card-title">Published</h5>
                <h2 className="mb-0">{foodItems.filter(f => f.is_published).length}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card bg-warning text-white">
              <div className="card-body">
                <h5 className="card-title">Draft</h5>
                <h2 className="mb-0">{foodItems.filter(f => !f.is_published).length}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card bg-info text-white">
              <div className="card-body">
                <h5 className="card-title">Orders</h5>
                <h2 className="mb-0">0</h2>
              </div>
            </div>
          </div>
        </div>

        {/* Food Items Grid */}
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Your Food Items</h5>
              </div>
              <div className="card-body">
                {foodItems.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="mb-3">
                      <span className="display-1">🍽️</span>
                    </div>
                    <h4>No food items yet</h4>
                    <p className="text-muted">Start by adding your first food item</p>
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowAddFoodModal(true)}
                    >
                      Add Your First Food
                    </button>
                  </div>
                ) : (
                  <div className="row">
                    {foodItems.map(food => (
                      <div key={food.id} className="col-lg-4 col-md-6 mb-4">
                        <div className="card h-100">
                          <img
                            src={food.image || '/placeholder-food.jpg'}
                            className="card-img-top"
                            alt={food.name}
                            style={{ height: '200px', objectFit: 'cover' }}
                          />
                          <div className="card-body">
                            <h5 className="card-title">{food.name}</h5>
                            <p className="text-muted mb-2">{food.origin}</p>
                            <p className="card-text">{food.description}</p>
                            <div className="mb-3">
                              <strong>Ingredients:</strong>
                              <div className="d-flex flex-wrap gap-1 mt-1">
                                {food.ingredients.map((ingredient, index) => (
                                  <span key={index} className="badge bg-light text-dark">
                                    {ingredient}
                                  </span>
                                ))}
                              </div>
                            </div>
                            {food.allergens.length > 0 && (
                              <div className="mb-3">
                                <strong className="text-danger">Allergens:</strong>
                                <div className="d-flex flex-wrap gap-1 mt-1">
                                  {food.allergens.map((allergen, index) => (
                                    <span key={index} className="badge bg-danger">
                                      {allergen}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="h5 mb-0">${food.price}</span>
                              <div className="btn-group">
                                <button
                                  className={`btn btn-sm ${food.is_published ? 'btn-success' : 'btn-outline-success'}`}
                                  onClick={() => togglePublish(food.id, food.is_published)}
                                >
                                  {food.is_published ? 'Published' : 'Publish'}
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => deleteFood(food.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Food Modal */}
      {showAddFoodModal && (
        <AddFoodModal
          onClose={() => setShowAddFoodModal(false)}
          onAdd={addFoodItem}
        />
      )}
    </div>
  )
}

function AddFoodModal({ onClose, onAdd }: { onClose: () => void; onAdd: any }) {
  const [formData, setFormData] = useState({
    name: '',
    origin: '',
    description: '',
    ingredients: '',
    allergens: '',
    price: '',
    image: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd({
      name: formData.name,
      origin: formData.origin,
      description: formData.description,
      ingredients: formData.ingredients.split(',').map(i => i.trim()).filter(Boolean),
      allergens: formData.allergens.split(',').map(i => i.trim()).filter(Boolean),
      price: parseFloat(formData.price),
      image: formData.image,
    })
  }

  return (
    <div className="modal fade show" style={{ display: 'block' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Add New Food Item</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="foodName" className="form-label">Food Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="foodName"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="foodOrigin" className="form-label">Food Origin *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="foodOrigin"
                    value={formData.origin}
                    onChange={(e) => setFormData(prev => ({ ...prev, origin: e.target.value }))}
                    placeholder="e.g., Italian, Indian, Mexican, or any cuisine"
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="foodDescription" className="form-label">Description *</label>
                <textarea
                  className="form-control"
                  id="foodDescription"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="foodIngredients" className="form-label">Ingredients *</label>
                <input
                  type="text"
                  className="form-control"
                  id="foodIngredients"
                  value={formData.ingredients}
                  onChange={(e) => setFormData(prev => ({ ...prev, ingredients: e.target.value }))}
                  placeholder="e.g., chicken, rice, vegetables (separate with commas)"
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="foodAllergens" className="form-label">Allergens</label>
                <input
                  type="text"
                  className="form-control"
                  id="foodAllergens"
                  value={formData.allergens}
                  onChange={(e) => setFormData(prev => ({ ...prev, allergens: e.target.value }))}
                  placeholder="e.g., nuts, dairy, gluten (separate with commas)"
                />
                <div className="form-text">Leave empty if no allergens</div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="foodPrice" className="form-label">Price ($) *</label>
                  <input
                    type="number"
                    className="form-control"
                    id="foodPrice"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="foodImage" className="form-label">Image URL</label>
                  <input
                    type="url"
                    className="form-control"
                    id="foodImage"
                    value={formData.image}
                    onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                    placeholder="https://example.com/food-image.jpg"
                  />
                  <div className="form-text">Optional - will use placeholder if empty</div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Add Food Item
              </button>
            </div>
          </form>
        </div>
      </div>
      {/* <div className="modal-backdrop fade show"></div> */}
    </div>
  )
}
