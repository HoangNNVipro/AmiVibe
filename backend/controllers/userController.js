import userModel from '../models/userModel.js';
import bcrypt from 'bcrypt';
import validator from 'validator';
import jwt from 'jsonwebtoken';


const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
}


// Route for user login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // find user by email
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User does not exist" });
    }

    // === THÊM ĐOẠN CHECK STATUS VÀO ĐÂY ===
    if (user.status === 'Suspended') {
      return res.json({ 
        success: false, 
        message: "This account has been suspended. Please contact the administrator." 
      });
    }

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const token = createToken(user._id);
      res.json({ success: true, message: "Login successful", token });
    }else{
      return res.json({ success: false, message: "Invalid credentials" });
    }

  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: "Error logging in user" });
  }
}

// Route for user register
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // checking user already exists or not
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.json({ success: false, message: "User already exists" });
    }
    
    // validating email format
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Please enter a valid email" });
    }
    
    // validating password length
    if (password.length < 8) {
      return res.json({ success: false, message: "Password must be at least 8 characters" });
    }
    
    // hashing password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // creating new user
    const newUser = new userModel({
      name,
      email,
      password: hashedPassword
    });
    
    const user = await newUser.save();

    const token = createToken(user._id);
    
    res.json({ success: true, message: "User registered successfully", token });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error registering user" });
  }
}

// Route for admin login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign(email + password, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
}

export { loginUser, registerUser, adminLogin, listUsers, createUser, updateUser, deleteUser }

// =========================================================================
// ADMIN FUNCTIONS: Quản lý Người dùng
// =========================================================================

// Lấy danh sách toàn bộ người dùng
const listUsers = async (req, res) => {
  try {
    const users = await userModel.find().select('-password');
    res.json({ success: true, users });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching users" });
  }
}

// Tạo mới người dùng (Admin tạo)
const createUser = async (req, res) => {
  try {
    const { name, email, password, status } = req.body;

    // Kiểm tra email đã tồn tại
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.json({ success: false, message: "Email already exists" });
    }

    // Validate email
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Please enter a valid email" });
    }

    // Validate password
    if (!password || password.length < 8) {
      return res.json({ success: false, message: "Password must be at least 8 characters" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
      status: status || 'Active',
      cartData: {}
    });

    const user = await newUser.save();
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({ success: true, message: "User created successfully", user: userResponse });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error creating user" });
  }
}

// Cập nhật thông tin người dùng
const updateUser = async (req, res) => {
  try {
    const { userId, name, email, status, newPassword } = req.body;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // Kiểm tra email trùng (nếu có người khác dùng)
    if (email && email !== user.email) {
      const emailExists = await userModel.findOne({ email });
      if (emailExists) {
        return res.json({ success: false, message: "Email already in use" });
      }
    }

    // Cập nhật name
    if (name) user.name = name;

    // Cập nhật email
    if (email) {
      if (!validator.isEmail(email)) {
        return res.json({ success: false, message: "Invalid email format" });
      }
      user.email = email;
    }

    // Cập nhật status
    if (status) user.status = status;

    // Cập nhật password (nếu có)
    if (newPassword && newPassword.length > 0) {
      if (newPassword.length < 8) {
        return res.json({ success: false, message: "Password must be at least 8 characters" });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({ success: true, message: "User updated successfully", user: userResponse });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error updating user" });
  }
}

// Xóa người dùng
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.body;

    const result = await userModel.findByIdAndDelete(userId);
    if (!result) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "User deleted successfully" });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error deleting user" });
  }
}

