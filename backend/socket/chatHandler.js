import chatModel from "../models/chatModel.js";
import userModel from "../models/userModel.js";

// 1. API: Lấy lịch sử chat của một User cụ thể (File cũ của bạn)
export const getChatHistory = async (req, res) => {
  try {
    const userId = req.body?.userId;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId not found in token' });
    }

    const chat = await chatModel.findOne({ userId });

    if (!chat) {
      return res.status(404).json({ success: false, message: 'No chat history found' });
    }

    return res.json({ success: true, messages: chat.messages });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// THÊM MỚI API: Lấy danh sách tất cả các phòng chat dành cho ADMIN
// ==========================================
export const getAllChats = async (req, res) => {
  try {
    // Tìm toàn bộ các cuộc hội thoại trong hệ thống
    const chats = await chatModel.find({}).sort({ updatedAt: -1 });
    
    // Tạo cấu trúc dữ liệu thu gọn trả về cho danh sách phòng chat Admin
    const chatList = chats.map(chat => {
      const lastMsg = chat.messages[chat.messages.length - 1];
      return {
        userId: chat.userId,
        name: chat.name || `Khách hàng (${String(chat.userId).substring(0, 5)})`, // Fallback nếu user chưa lưu name
        status: chat.status || 'resolved',
        lastMessage: lastMsg ? lastMsg.text : 'Chưa có tin nhắn',
        time: lastMsg ? lastMsg.timestamp : chat.updatedAt
      };
    });

    return res.json({ success: true, chats: chatList });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const adminRoomName = (userId) => `admin:${userId}`;

const chatHandler = (io, socket) => {

  // Sự kiện khi Admin tham gia vào phòng chat của một khách hàng cụ thể
  socket.on('joinAdminRoom', async ({ userId } = {}, callback) => {
    try {
      if (!socket.isAdmin) {
        return callback?.({ success: false, message: 'Admin authorization required' });
      }

      if (!userId) {
        return callback?.({ success: false, message: 'userId is required' });
      }

      const roomName = adminRoomName(userId);
      socket.join(roomName);

      // Khi Admin đã bấm vào chat, tự động cập nhật status thành 'in_progress' để TẮT ĐÈN ĐỎ
      const chat = await chatModel.findOneAndUpdate(
        { userId },
        { $set: { status: 'in_progress' } },
        { new: true }
      );

      // Phát lệnh cho toàn bộ Admin biết để cập nhật lại trạng thái đèn trên danh sách tổng
      io.emit('chatStatusUpdated', { userId, status: 'in_progress' });

      callback?.({
        success: true,
        room: roomName,
        chat
      });
    } catch (error) {
      console.log(error);
      callback?.({ success: false, message: error.message });
    }
  });

  // ==========================================
  // THÊM MỚI SỰ KIỆN: Khi Admin bấm nút "Kết thúc hỗ trợ" (Resolved)
  // ==========================================
  socket.on('resolveChat', async ({ userId } = {}, callback) => {
    try {
      if (!socket.isAdmin) {
        return callback?.({ success: false, message: 'Admin authorization required' });
      }

      const chat = await chatModel.findOneAndUpdate(
        { userId },
        { $set: { status: 'resolved' } },
        { new: true }
      );

      // Thông báo cho toàn bộ hệ thống Admin cập nhật trạng thái danh sách phòng chat
      io.emit('chatStatusUpdated', { userId, status: 'resolved' });

      callback?.({ success: true, message: 'Chat resolved successfully' });
    } catch (error) {
      console.log('resolveChat error', error);
      callback?.({ success: false, message: error.message });
    }
  });

  // Sự kiện gửi tin nhắn (Đã tối ưu hóa luồng kích hoạt Đèn đỏ thông minh)
  socket.on('sendMessage', async ({ text, userId, sender } = {}, callback) => {
    try {
      const messageText = typeof text === 'string' ? text.trim() : '';
      const isAdminSender = Boolean(socket.isAdmin);
      const targetUserId = isAdminSender ? userId : socket.userId;
      const messageSender = isAdminSender ? (sender || 'admin') : 'user';

      if (!messageText) {
        return callback?.({ success: false, message: 'Message text is required' });
      }

      if (!targetUserId) {
        return callback?.({ success: false, message: 'userId is required' });
      }

      const targetUser = await userModel.findById(targetUserId);
      const userName = targetUser?.name || `Khách hàng (${String(targetUserId).substring(0, 5)})`;

      const message = {
        sender: messageSender,
        text: messageText,
        timestamp: new Date()
      };

      // TỐI ƯU LOGIC: Nếu KHÁCH HÀNG nhắn tin, cập nhật NGAY status thành 'waiting_for_admin' để nháy đèn đỏ
      // Nếu ADMIN nhắn tin, giữ nguyên trạng thái hoặc chuyển sang 'in_progress'
      const currentStatus = isAdminSender ? 'in_progress' : 'waiting_for_admin';

      const chat = await chatModel.findOneAndUpdate(
        { userId: targetUserId },
        {
          $set: { status: currentStatus, name: userName }, // Chuyển đổi trạng thái linh hoạt để báo đèn và lưu tên user
          $push: { messages: message }
        },
        { new: true, upsert: true }
      );

      const payload = {
        chatId: chat._id,
        userId: targetUserId,
        message
      };

      io.to(String(targetUserId)).emit('receiveMessage', payload);
      io.to(adminRoomName(targetUserId)).emit('receiveMessage', payload);

      // ĐỒNG BỘ REALTIME DANH SÁCH ADMIN: Bắn tín hiệu để màn hình Quản lý Chat của Admin tự động đẩy ca này lên đầu và nhấp nháy đỏ ngay lập tức
      io.emit('adminListUpdate', {
        userId: targetUserId,
        name: userName,
        status: currentStatus,
        lastMessage: messageText,
        time: message.timestamp
      });

      callback?.({ success: true, chat, message });
    } catch (error) {
      console.log('sendMessage error', error);
      callback?.({ success: false, message: error.message });
    }
  });
}

export default chatHandler;
