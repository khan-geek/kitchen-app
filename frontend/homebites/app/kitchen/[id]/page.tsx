'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

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

interface Kitchen {
  id: string
  name: string
  cuisineType: string
  foodItems: FoodItem[]
}

export default function KitchenPage() {
  const params = useParams()
  const kitchenId = params.id as string

  const [kitchen, setKitchen] = useState<Kitchen | null>(null)
  const [cart, setCart] = useState<{ [key: string]: number }>({})
  const [showCart, setShowCart] = useState(false)

  // Sample data - in real app this would come from backend API


  useEffect(() => {
    const fetchKitchenData = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/auth/kitchen/${kitchenId}/`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch kitchen');
        }

        const data = await res.json();

        const formattedKitchen: Kitchen = {
          id: kitchenId,
          name: data.kitchen_name,
          cuisineType: data.cuisine_type || 'Unknown',
          foodItems: data.food_items,
        };

        setKitchen(formattedKitchen);
      } catch (err) {
        console.error('Error fetching kitchen:', err);
        setKitchen(null);
      }
    };

    if (kitchenId) {
      fetchKitchenData();
    }
  }, [kitchenId]);


  const addToCart = (foodId: string) => {
    setCart(prev => ({
      ...prev,
      [foodId]: (prev[foodId] || 0) + 1
    }))
  }

  const removeFromCart = (foodId: string) => {
    setCart(prev => {
      const newCart = { ...prev }
      if (newCart[foodId] > 1) {
        newCart[foodId] -= 1
      } else {
        delete newCart[foodId]
      }
      return newCart
    })
  }

  const getCartTotal = () => {
    if (!kitchen) return 0
    return Object.entries(cart).reduce((total, [foodId, quantity]) => {
      const food = kitchen.foodItems.find(f => f.id.toString() === foodId)
      
      return total + (Number(food?.price) || 0) * quantity
    }, 0)
  }

  const getCartItemCount = () => {
    return Object.values(cart).reduce((total, quantity) => total + quantity, 0)
  }

  // const placeOrder = () => {
  //   alert('Order placed successfully! The chef will contact you soon.')
  //   setCart({})
  //   setShowCart(false)
  // }
  const placeOrder = async () => {
    if (!kitchen) return;

    const payload = {
      kitchen_id: kitchen.id,
      items: Object.entries(cart).map(([foodId, quantity]) => ({
        item_id: Number(foodId),
        quantity,
      })),
    };

    try {
      const response = await fetch('http://localhost:8000/api/auth/place-order/', {
        method: 'POST',
        credentials: 'include', // important if you use JWT in httpOnly cookie
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert('Failed to place order: ' + (errorData?.error || response.status));
        return;
      }

      const data = await response.json();
      alert('Order placed successfully!');
      setCart({});
      setShowCart(false);
      console.log('Order created:', data);
    } catch (err) {
      console.error('Order failed:', err);
      alert('Something went wrong while placing the order.');
    }
  };


  if (!kitchen) {
    return (
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="mb-3">
            <span className="display-1">🔍</span>
          </div>
          <h4>Kitchen not found</h4>
          <Link href="/browse" className="btn btn-primary">
            Back to Kitchens
          </Link>
        </div>
      </div>
    )
  }

  const publishedFoodItems = kitchen.foodItems.filter(food => food.is_published)

  return (
    <div className="min-vh-100 bg-light">
      {/* Navigation */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">
          <Link href="/" className="navbar-brand">
            🍳 HomeBites
          </Link>
          <div className="navbar-nav me-auto">
            <Link href="/browse" className="nav-link">← Back to Kitchens</Link>
          </div>
          <div className="navbar-nav">
            <button
              className="btn btn-outline-light position-relative"
              onClick={() => setShowCart(true)}
            >
              🛒 Cart
              {getCartItemCount() > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {getCartItemCount()}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <div className="container py-4">
        {/* Kitchen Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card bg-gradient-primary text-white">
              <div className="card-body text-center py-5">
                <h1 className="display-4 mb-2">{kitchen.name}</h1>
                <p className="lead mb-0">{kitchen.cuisineType} Cuisine</p>
                <div className="mt-3">
                  <span className="badge bg-light text-dark fs-6">
                    {publishedFoodItems.length} items available
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Food Items Grid */}
        <div className="row">
          {publishedFoodItems.map(food => (
            <div key={food.id} className="col-lg-4 col-md-6 mb-4">
              <div className="card h-100 shadow-sm">
                <img
                  src={food.image}
                  className="card-img-top"
                  alt={food.name}
                  style={{ height: '250px', objectFit: 'cover' }}
                />
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="card-title mb-0">{food.name}</h5>
                    <span className="badge bg-primary">{food.origin}</span>
                  </div>
                  <p className="card-text text-muted">{food.description}</p>

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
                      <strong className="text-danger">⚠️ Allergens:</strong>
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
                    <span className="h4 text-success mb-0">${food.price}</span>
                    <div className="d-flex align-items-center">
                      {cart[food.id] ? (
                        <div className="btn-group me-2">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => removeFromCart(food.id)}
                          >
                            -
                          </button>
                          <span className="btn btn-sm btn-outline-primary disabled">
                            {cart[food.id]}
                          </span>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => addToCart(food.id)}
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-primary"
                          onClick={() => addToCart(food.id)}
                        >
                          Add to Cart
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Modal */}
      {showCart && (
        <div className="modal fade show" style={{ display: 'block' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Your Cart</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCart(false)}
                ></button>
              </div>
              <div className="modal-body">
                {Object.keys(cart).length === 0 ? (
                  <div className="text-center py-4">
                    <span className="display-4">🛒</span>
                    <h5>Your cart is empty</h5>
                    <p className="text-muted">Add some delicious food to get started!</p>
                  </div>
                ) : (
                  <div>
                    {Object.entries(cart).map(([foodId, quantity]) => {
                      const food = kitchen.foodItems.find(f => f.id.toString() === foodId)
                      if (!food) return null

                      return (
                        <div key={foodId} className="d-flex justify-content-between align-items-center mb-3">
                          <div>
                            <h6 className="mb-1">{food.name}</h6>
                            <small className="text-muted">${food.price} each</small>
                          </div>
                          <div className="d-flex align-items-center">
                            <div className="btn-group me-3">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => removeFromCart(foodId)}
                              >
                                -
                              </button>
                              <span className="btn btn-sm btn-outline-primary disabled">
                                {quantity}
                              </span>
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => addToCart(foodId)}
                              >
                                +
                              </button>
                            </div>
                            <span className="fw-bold">${(Number(food.price) * quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      )
                    })}
                    <hr />
                    <div className="d-flex justify-content-between align-items-center">
                      <h5>Total:</h5>
                      <h5 className="text-success">${getCartTotal().toFixed(2)}</h5>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCart(false)}
                >
                  Continue Shopping
                </button>
                {Object.keys(cart).length > 0 && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={placeOrder}
                  >
                    Place Order
                  </button>
                )}
              </div>
            </div>
          </div>
          {/* <div className="modal-backdrop fade show"></div> */}
        </div>
      )}
    </div>
  )
} 