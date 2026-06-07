import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false })

const chatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  name: { type: String, required: true },
  messages: { type: [messageSchema], default: [] },
  status: { type: String, default: 'waiting_for_admin' }
})

const chatModel = mongoose.models.chat || mongoose.model("chat", chatSchema)

export default chatModel;
