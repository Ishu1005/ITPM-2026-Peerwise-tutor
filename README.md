# ITP-Spices-2025
comprehensive web application for managing spice inventory operations

---

## 📦 Installation & Setup


### 1. Clone the Repository

```bash
git clone https://github.com/your-username/spicehub.git
cd spicehub
```

### 2. Setup the Backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend/` folder and add:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
```

To start the backend server:

```bash
node server.js
```

> Ensure MongoDB is running locally or use MongoDB Atlas for cloud connection.

### 3. Setup the Frontend

```bash
cd ../frontend
npm install
```

To start the React frontend:

```bash
npm start
```

The app will run at [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
ITP-Spices-2025/
├── client/                           # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/              # Reusable React components
│   │   │   ├── AdminRoute.jsx
│   │   │   ├── CustomerForm.jsx
│   │   │   ├── InventoryForm.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── navPublic.jsx
│   │   │   ├── OrderForm.jsx
│   │   │   ├── ProductForm.jsx
│   │   │   ├── SupplierForm.jsx
│   │   │   └── UserRoute.jsx
│   │   ├── pages/                   # Main route pages
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminRegister.jsx
│   │   │   ├── CustomerManager.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── InventoryManager.jsx
│   │   │   ├── OrderManager.jsx
│   │   │   ├── ProductManager.jsx
│   │   │   ├── SupplierManager.jsx
│   │   │   ├── UserAuth.jsx
│   │   │   ├── UserLoginRegister.jsx
│   │   │   ├── UserProfile.jsx
│   │   │   └── ViewProducts.jsx
│   │   ├── services/               # API services (Axios logic)
│   │   │   └── authService.js
│   │   ├── styles/                 # CSS and color definitions
│   │   │   ├── Navbar.css
│   │   │   └── colorsmap.txt
│   │   ├── utils/                  # Utility helpers (e.g., validators)
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── App.test.js
│   │   ├── index.css
│   │   ├── index.js
│   │   ├── logo.svg
│   │   ├── reportWebVitals.js
│   │   └── setupTests.js
│   └── package.json

├── server/                          # Node + Express Backend
│   ├── config/                      # DB & env config (e.g., DB connect)
│   ├── controllers/                # Logic for each route
│   │   ├── authController.js
│   │   ├── customerController.js
│   │   ├── inventoryController.js
│   │   ├── orderController.js
│   │   ├── productController.js
│   │   └── tutorController.js
│   ├── middleware/                 # Auth & admin check middleware
│   │   ├── authMiddleware.js       # Login/session middleware
│   │   └── isAdmin.js              # Admin-only protection
│   ├── models/                     # MongoDB Schemas
│   │   ├── Customer.js
│   │   ├── Inventory.js
│   │   ├── Order.js
│   │   ├── Product.js
│   │   ├── Supplier.js
│   │   └── User.js
│   ├── routes/                     # API routes for each module
│   │   ├── adminStats.js
│   │   ├── authRoutes.js
│   │   ├── customerRoutes.js
│   │   ├── inventoryRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── productRoutes.js
│   │   └── tutorRoutes.js
│   ├── uploads/                    # Uploads (e.g., receipt images)
│   ├── utils/                      # Helper functions
│   ├── .env                        # Environment variables
│   └── server.js                   # Main server entry point

└── README.md

```

---


