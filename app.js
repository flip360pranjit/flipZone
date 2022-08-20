//jshint esversion:6
require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose =  require("mongoose");
const encrypt = require("mongoose-encryption");
const multer = require("multer");

const day = new Date();
var options = {
  weekday : "long",
  day : "numeric",
  month : "long"
};
const today = day.toLocaleDateString("en-IN", options);

//Define storage for images uploaded
const storage =  multer.diskStorage({
  destination: function(req,file,cb){
    cb(null, "./public/uploads");
  },
  filename: function(req,file,cb){
    const date = Date.now();
    cb(null, date + "" + file.originalname);
  },
});

//Upload Parameters for Multer
const upload = multer({
  storage: storage
});


const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const adminPassword = process.env.PASS;
mongoose.connect("mongodb+srv://admin-pranjit:" + adminPassword + "@cluster0.i51gd.mongodb.net/eCommerceDB", {useNewUrlParser: true});

const variablesSchema = new mongoose.Schema({
  name: String,
  value: String
});
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  contact: Number,
});

const secret = process.env.SECRET;
userSchema.plugin(encrypt, {secret: secret, encryptedFields: ["password"]});
const User = mongoose.model("User", userSchema);

const productSchema = new mongoose.Schema({
  title: String,
  image: String,
  description: String,
  price: Number,
  quantity: {
    type: Number,
    default: 1
  },
  rating: {
    type: Number,
    default: 0
  },
  numberOfRatings: {
    type: Number,
    default: 0
  },
  reviews: Array
});
const orderSchema = new mongoose.Schema({
  user: {
    type: String,
    ref: "User"
  },
  cart: {
    type: Object,
    required: true
  },
  date: String
});
const reviewSchema = new mongoose.Schema({
  product: {
    type: String,
    ref: "Product"
  },
  name: String,
  des: String
});
const Product = mongoose.model("Product", productSchema);
const Item = mongoose.model("Item",productSchema);
const Review =  mongoose.model("Review", reviewSchema);
const Order =  mongoose.model("Order", orderSchema);
const Variable = mongoose.model("Variable", variablesSchema);

//const variable = new Variable({
//  name: "userEmail",
//  value: "none"
//});
//variable.save();

// const product1 = new Product({
//   title: "Casual Shoes",
//   image: "item1.jpg",
//   description: "An amazing range of shoes which signifies today's youth image. These uniquely designed shoes give you the comfort you need with the style you want.",
//   price: 475,
//   quantity: 1,
//   rating: 1,
//   numberOfRatings: 0,
//   reviews: []
// });
// const product2 = new Product({
//   title: "T-Shirt",
//   image: "item2.jpg",
//   description: "Deigned and manufactured by flipZone, this T-shirt is one of the best and finest Master piece that we ever made with the view to give our customers an upper edge in style and comfort. Made with the finest cotton and up to the mark quality, this product is worth every penny.",
//   price: 399,
//   quantity: 1,
//   rating: 1,
//   numberOfRatings: 0,
//   reviews: []
// });
// const product3 = new Product({
//   title: "Trousers Slim",
//   image: "item3.jpg",
//   description: "Step up your formal style game with these top-notch trousers and a tint of informality.",
//   price: 799,
//   quantity: 1,
//   rating: 1,
//   numberOfRatings: 0,
//   reviews: []
// });
// const product4 = new Product({
//   title: "Asus ROG Zephyrus",
//   image: "item4.jpg",
//   description: "Processor: i9-11th Gen, Graphics Card: RTX 3090 8GB, RAM: 16GB, SSD: 1TB, HDD: 1TB, Operating System: Windows 10 Home, Refresh Rate: 175Hz",
//   price: 183000,
//   quantity: 1,
//   rating: 1,
//   numberOfRatings: 0,
//   reviews: []
// });
// Product.insertMany([product1,product2,product3,product4]).catch(function(err){console.log(err)});

//Variables for total Items and Subtotal
var totalItems = 0;
var subtotal = 0;
Item.find({}, function(err, foundItems){
  if(err){
    res.send(err);
  }else{
    for(var i=0;i<foundItems.length;i++)
    {
      totalItems++;
      subtotal = subtotal + foundItems[i].price;
    }
  }
});


var passwordError = 1;
var userEmail;
function updateUser(){
  Variable.findOne({name: "userEmail"}, function(err, foundVariable){
    if(err){
      res.send(err);
    }else{
      userEmail = foundVariable.value;
    }
  });
}

app.get("/", function(req,res){
  if(passwordError===0){
    res.render("register",{error: "Confirmed Password does not match."});
  }else{
    res.render("register",{error: ""});
  }
});
app.get("/login", function(req,res){
  if(passwordError == 2){
    res.render("login",{error: "Wrong Password"});
  }else if(passwordError == 3){
    res.render("login",{error: "User Not Found"});
  }else{
    res.render("login",{error: ""});
  }
});
app.get("/home", function(req,res){
  res.render("home");
});
app.get("/upload", function(req,res){
  res.render("admin/upload");
});
app.get("/products", function(req,res){
  Product.find({}, function(err, foundProducts){
    if(err){
      res.send(err);
    }else{
      res.render("products", {products: foundProducts});
    }
  });
});
app.get("/myaccount", function(req,res){
  User.findOne({email: userEmail}, function(err, foundUser){
    if(err){
      res.send(err);
    }else{
      res.render("admin/account_client", {user: foundUser});
    }
  })
});
app.get("/cart", function(req,res){
  Item.find({}, function(err, foundItems){
    if(err){
      res.send(err);
    }else{
      res.render("cart",{items: foundItems, totalItems: totalItems, subtotal: subtotal});
    }
  });
});
app.get("/delete", function(req,res){
  Product.find({}, function(err, foundProducts){
    if(err){
      res.send(err);
    }else{
      res.render("admin/deleteProduct", {products: foundProducts});
    }
  });
});
app.get("/orderplaced", function(req,res){
  Item.find({}, function(err, foundItems){
    if(err){
      res.send(err);
    }else{
      const order = new Order({
        user: userEmail,
        cart: foundItems,
        date: today
      });
      order.save();
      Item.deleteMany({}, function(err){
        if(err){
          res.send(err);
        }
      });
      totalItems = 0;
      subtotal = 0;
      res.render("orderPlaced");
    }
  });
});
app.get("/orders", function(req,res){
  Order.find({user: userEmail}, function(err, foundOrders){
    if(err){
      res.send(err);
    }else{
      res.render("orders",{items: foundOrders});
    }
  })
})
app.get("/footerLink", function(req,res){
  res.render("footerLinks");
})







app.post("/register", function(req,res){
  if(req.body.password !== req.body.confirmPassword){
    passwordError = 0;
    res.redirect("/")
  }else{
    passwordError = 1;
    const name = req.body.firstName + " " + req.body.lastName;
    const user = new User({
      name: name,
      email: req.body.email,
      password: req.body.password,
      contact: req.body.contact
    });
    user.save();
    Variable.findOneAndUpdate({name: "userEmail",},{value: req.body.email,}, function(error,data){
      if(error){
        res.send(error);
      }else{
        updateUser();    
      }
    });
    updateUser();
    res.render("home");
  }
});
app.post("/login", function(req,res){
  const email = req.body.email;
  const password = req.body.password;

  User.findOne({email: email}, function(err, foundUser){
    if(err){
      res.send(err);
    }else{
      if(foundUser){
        if(foundUser.password === password){
          Variable.findOneAndUpdate({name: "userEmail",},{value: foundUser.email,}, function(error,data){
            if(error){
              res.send(error);
            }
          });
          updateUser();
          res.render("home");
        }else{
          passwordError = 2;
          res.render("/");
        }
      }else{
        passwordError = 3;
        res.render("/");
      }
    }
  })
});
app.post("/upload", upload.single('image'), function(req,res){
  const title = req.body.title;
  const image = req.file.filename;
  const description = req.body.description;
  const price = req.body.price;

  const product = new Product({
    title: title,
    image: image,
    description: description,
    price: price,
    quantity: 1
  });
  product.save();
  Product.find({}, function(err, foundProducts){
    if(err){
      res.send(err);
    }else{
      res.redirect("/products");
    }
  });
});
app.post("/cart", function(req,res){
  const id = req.body.productID;
  Product.findById(id, function(err, foundProduct){
    if(err){
      res.send(err);
    }else{
      const item = new Item({
        title: foundProduct.title,
        image: foundProduct.image,
        description: foundProduct.description,
        price: foundProduct.price
      });
      item.save();
      Item.find({}, function(err, foundItems){
        if(err){
          res.send(err);
        }else{
          totalItems++;
          subtotal = subtotal + foundProduct.price;
          res.redirect("/cart");
        }
      });
    }
  });
});
app.post("/deleteCartItem", function(req,res){
  const id = req.body.productID;
  Item.findByIdAndDelete(id, function(err, foundProduct){
    if(err){
      res.send(err);
    }else{
      totalItems--;
      subtotal = subtotal - foundProduct.price;
      res.redirect("/cart");
    }
  });
});
app.post("/delete", function(req,res){
  const id = req.body.productID;
  Product.findByIdAndDelete(id, function(err, foundProduct){
    if(err){
      res.send(err);
    }else{
      res.redirect("/delete");
    }
  });
});
app.post("/product", function(req, res){
  Product.findOne({image: req.body.productID}, function(err, foundProduct){
    if(err){
      res.send(err);
    }else{
      Review.find({product: req.body.productID}, function(error, foundReviews){
        if(error){
          res.send(error);
        }else{
          res.render("product",{product: foundProduct, reviews: foundReviews});
        }
      })
    }
  });
});
app.post("/write-a-review", function(req,res){
  Product.findOne({image: req.body.productID}, function(err, foundProduct){
    if(err){
      res.send(err);
    }else{
      var rating = foundProduct.rating;
      var number = foundProduct.numberOfRatings;
      rating = (rating * number) + parseInt(req.body.rating);
      number++;
      rating = Math.floor(rating/number);

      const review = new Review({
        product: req.body.productID,
        name:  req.body.name,
        des: req.body.description
      });
      review.save();

      Product.findByIdAndUpdate(foundProduct._id, { rating: rating,numberOfRatings:number },function (err, docs) {
      if (err){
        console.log(err)
      }
      else{
        res.redirect("/products");
      }
      });
    }
  });
});



let server_port = process.env.PORT;
if(server_port == null || server_port == ""){
  server_port = 3000;
}

app.listen(server_port, function(){
  console.log("Server has started successfully.");
})
