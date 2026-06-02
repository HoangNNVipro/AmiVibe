import jwt from 'jsonwebtoken'

const socketAuth = (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    console.log('socketAuth: handshake received from', socket.id, 'token exists:', !!token);

    if (!token) {
      console.log('socketAuth: missing token in handshake');
      return next(new Error('Not Authorized Login Again'));
    }

    const token_decode = jwt.verify(token, process.env.JWT_SECRET);
    console.log('socketAuth: token verified for userId:', token_decode?.id);

    if (token_decode?.id) {
      socket.userId = token_decode.id;
      socket.isAdmin = false;
      socket.join(String(token_decode.id));
      console.log('socketAuth: user socket setup complete for userId:', token_decode.id);
      return next();
    }

    if (token_decode === process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
      socket.isAdmin = true;
      socket.join('admins');
      console.log('socketAuth: admin socket setup complete');
      return next();
    }

    console.log('socketAuth: token decode did not match user or admin pattern');
    return next(new Error('Not Authorized Login Again'));
  } catch (error) {
    console.log('socketAuth error:', error.message);
    next(new Error(error.message));
  }
}

export default socketAuth;
