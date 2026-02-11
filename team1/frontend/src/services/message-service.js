let listeners = new Set()
let messages = []

const notify = () => {
  for (const cb of listeners) cb([...messages])
}

const uid = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`

export const messageService = {
  subscribe(cb) {
    listeners.add(cb)
    cb([...messages])
    return () => listeners.delete(cb)
  },

  push({ type = "info", text = "", timeout = 3500 } = {}) {
    const id = uid()
    const msg = { id, type, text, timeout }
    messages = [msg, ...messages]
    notify()

    if (timeout && timeout > 0) {
      setTimeout(() => {
        messageService.remove(id)
      }, timeout)
    }

    return id
  },

  info(text, timeout) {
    return messageService.push({ type: "info", text, timeout })
  },

  success(text, timeout) {
    return messageService.push({ type: "success", text, timeout })
  },

  error(text, timeout) {
    return messageService.push({ type: "error", text, timeout: timeout ?? 5000 })
  },

  remove(id) {
    const next = messages.filter(m => m.id !== id)
    if (next.length === messages.length) return
    messages = next
    notify()
  },

  clear() {
    messages = []
    notify()
  }
}
