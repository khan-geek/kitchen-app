'use client'

import { useState, useEffect } from 'react'
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
  foodItems: FoodItem[]
}

export default function BrowseKitchens() {
  // Sample data - in real app this would come from backend
  // const [kitchens] = useState<Kitchen[]>([
    // {
    //   id: '1',
    //   name: 'Mama\'s Italian Kitchen',
    //   foodItems: [
    //     {
    //       id: '1',
    //       name: 'Margherita Pizza',
    //       origin: 'Italian',
    //       description: 'Classic pizza with fresh mozzarella, tomato sauce, and basil',
    //       ingredients: ['pizza dough', 'mozzarella', 'tomato sauce', 'basil', 'olive oil'],
    //       allergens: ['gluten', 'dairy'],
    //       image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400',
    //       isPublished: true,
    //       price: 18.99
    //     },
    //     {
    //       id: '2',
    //       name: 'Spaghetti Carbonara',
    //       origin: 'Italian',
    //       description: 'Creamy pasta with eggs, cheese, and pancetta',
    //       ingredients: ['spaghetti', 'eggs', 'pecorino cheese', 'pancetta', 'black pepper'],
    //       allergens: ['gluten', 'dairy', 'eggs'],
    //       image: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400',
    //       isPublished: true,
    //       price: 16.99
    //     }
    //   ]
    // },
    // {
    //   id: '2',
    //   name: 'Spice Garden',
    //   foodItems: [
    //     {
    //       id: '3',
    //       name: 'Butter Chicken',
    //       origin: 'Indian',
    //       description: 'Tender chicken in rich tomato and cream sauce',
    //       ingredients: ['chicken', 'tomato', 'cream', 'butter', 'spices'],
    //       allergens: ['dairy'],
    //       image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400',
    //       isPublished: true,
    //       price: 22.99
    //     },
    //     {
    //       id: '4',
    //       name: 'Biryani',
    //       origin: 'Indian',
    //       description: 'Fragrant rice dish with aromatic spices and tender meat',
    //       ingredients: ['basmati rice', 'chicken', 'spices', 'saffron', 'onions'],
    //       allergens: [],
    //       image: 'https://images.unsplash.com/photo-1563379091339-03246963d4a9?w=400',
    //       isPublished: true,
    //       price: 24.99
    //     }
    //   ]
    // },
    // {
    //   id: '3',
    //   name: 'Taco Fiesta',
    //   foodItems: [
    //     {
    //       id: '5',
    //       name: 'Street Tacos',
    //       origin: 'Mexican',
    //       description: 'Authentic street-style tacos with fresh ingredients',
    //       ingredients: ['corn tortillas', 'pork', 'onions', 'cilantro', 'lime'],
    //       allergens: [],
    //       image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400',
    //       isPublished: true,
    //       price: 12.99
    //     }
    //   ]
    // }
  // ])


const [kitchens, setKitchens] = useState<Kitchen[]>([])

useEffect(() => {
  const fetchKitchens = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/auth/get-all-kitchens/')
      const data = await res.json()
      setKitchens(data)
    } catch (error) {
      console.error('Failed to load kitchens:', error)
    }
  }

  fetchKitchens()
}, [])
  const [searchTerm, setSearchTerm] = useState('')

  const filteredKitchens = kitchens.filter(kitchen => {
    const matchesSearch = kitchen.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         kitchen.foodItems.some(food => 
                           food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           food.origin.toLowerCase().includes(searchTerm.toLowerCase())
                         )
    return matchesSearch
  })

  return (
    <div className="min-vh-100 bg-light">
      {/* Navigation */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">
          <Link href="/" className="navbar-brand">
            🍳 HomeBites
          </Link>
          <div className="navbar-nav ms-auto">
            <Link href="/browse" className="nav-link active">Browse Kitchens</Link>
            <Link href="/dashboard/customer" className="nav-link">My Orders</Link>
            <Link href="/" className="nav-link">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="container py-4">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <h1 className="h2 mb-3">Discover Local Kitchens</h1>
            <p className="text-muted">Explore amazing homemade meals from talented local chefs</p>
          </div>
        </div>

        {/* Search */}
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="input-group">
              <span className="input-group-text">🔍</span>
              <input
                type="text"
                className="form-control"
                placeholder="Search kitchens, food items, or cuisines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Kitchens Grid */}
        {filteredKitchens.length === 0 ? (
          <div className="text-center py-5">
            <div className="mb-3">
              <span className="display-1">🔍</span>
            </div>
            <h4>No kitchens found</h4>
            <p className="text-muted">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="row">
            {filteredKitchens.map(kitchen => (
              <div key={kitchen.id} className="col-lg-6 col-xl-4 mb-4">
                <div className="card h-100 shadow-sm">
                  <div className="card-header bg-white">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h5 className="mb-1">{kitchen.name}</h5>
                        <span className="text-muted">
                          {kitchen.foodItems.filter(f => f.is_published).length} items available
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      {kitchen.foodItems
                        .filter(food => food.is_published)
                        .slice(0, 2)
                        .map(food => (
                          <div key={food.id} className="col-6 mb-3">
                            <div className="text-center">
                              <img
                                src={food.image}
                                alt={food.name}
                                className="img-fluid rounded mb-2"
                                style={{ height: '100px', width: '100%', objectFit: 'cover' }}
                              />
                              <h6 className="mb-1">{food.name}</h6>
                              <small className="text-muted d-block">{food.origin}</small>
                              <p className="text-success mb-0">${food.price}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                    {kitchen.foodItems.filter(f => f.is_published).length > 2 && (
                      <div className="text-center mt-3">
                        <small className="text-muted">
                          +{kitchen.foodItems.filter(f => f.is_published).length - 2} more items
                        </small>
                      </div>
                    )}
                  </div>
                  <div className="card-footer bg-white">
                    <Link 
                      href={`/kitchen/${kitchen.id}`}
                      className="btn btn-primary w-100"
                    >
                      View Kitchen
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 