import React, { useEffect, useState } from "react"
import { messageService } from "../../services/message-service"
import "./MessageCenter.css"

const MessageCenter = () => {
  const [messages, setMessages] = useState([])

  useEffect(() => {
    const unsub = messageService.subscribe(setMessages)
    return unsub
  }, [])

  if (!messages.length) return null

  return (
    <div className="msg-center">
      {messages.map(m => (
        <div key={m.id} className={`msg msg-${m.type}`} role="alert">
          <div className="msg-text">{m.text}</div>
          <button className="msg-x" onClick={() => messageService.remove(m.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  )
}

export default MessageCenter
