import os
import json
import datetime
from flask import Flask, jsonify, request, render_template, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS

# ---------------- App Setup ----------------
app = Flask(__name__)
CORS(app)

basedir = os.path.abspath(os.path.dirname(__file__))
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + os.path.join(basedir, "shop.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = "super-secret-key"

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# ---------------- Database Models ----------------

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)

    def __init__(self, username, email, password):
        self.username = username
        self.email = email
        self.password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)


class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    price = db.Column(db.Float, nullable=False)
    image_url = db.Column(db.String(200), nullable=False)
    stock = db.Column(db.Integer, nullable=False, default=10)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "price": self.price,
            "image_url": self.image_url,
            "stock": self.stock,
        }


class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    shipping_info_json = db.Column(db.Text, nullable=False)
    products_json = db.Column(db.Text, nullable=False)
    payment_status = db.Column(db.String(50), default="pending")
    order_date = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    user = db.relationship("User", backref=db.backref("orders", lazy=True))

# ---------------- Auth Endpoints ----------------

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data or not all(k in data for k in ("username", "email", "password")):
        return jsonify({"message": "Missing fields"}), 400

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"message": "Email already registered"}), 400
    if User.query.filter_by(username=data["username"]).first():
        return jsonify({"message": "Username already taken"}), 400

    new_user = User(username=data["username"], email=data["email"], password=data["password"])
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User registered successfully"}), 201

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data or not all(k in data for k in ("email", "password")):
        return jsonify({"message": "Missing fields"}), 400

    user = User.query.filter_by(email=data["email"]).first()
    if not user or not user.check_password(data["password"]):
        return jsonify({"message": "Invalid email or password"}), 401

    access_token = create_access_token(identity=user.id)
    return jsonify({"access_token": access_token}), 200

# ---------------- Product Endpoints ----------------

@app.route("/api/products", methods=["GET"])
def get_products():
    products = Product.query.all()
    return jsonify([p.to_dict() for p in products]), 200

@app.route("/api/products/<int:id>", methods=["GET"])
def get_product(id):
    product = Product.query.get(id)
    if not product:
        return jsonify({"message": "Product not found"}), 404
    return jsonify(product.to_dict()), 200

# ---------------- Order Endpoints ----------------

@app.route("/api/orders", methods=["POST"])
@jwt_required()
def create_order():
    user_id = get_jwt_identity()
    data = request.get_json(force=True)

    if not data:
        return jsonify({"message": "Missing JSON body"}), 400

    required_fields = ["total_amount", "shipping_info", "products"]
    for field in required_fields:
        if field not in data:
            return jsonify({"message": f"Missing field: {field}"}), 400

    try:
        total_amount = float(data["total_amount"])
        shipping_info = data["shipping_info"]
        products = data["products"]

        if not isinstance(products, list) or len(products) == 0:
            return jsonify({"message": "Products must be a non-empty list"}), 400

        new_order = Order(
            user_id=user_id,
            total_amount=total_amount,
            shipping_info_json=json.dumps(shipping_info),
            products_json=json.dumps(products),
        )

        db.session.add(new_order)
        db.session.commit()
        return jsonify({"message": "Order created successfully"}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error creating order: {e}"}), 400

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/store")
def store():
    return render_template("store.html")

@app.route('/buy')
def buy():
    return render_template('buy.html')

@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)

if __name__ == "__main__":
    with app.app_context():
        db.create_all() 
    app.run(debug=True, port=5000)
