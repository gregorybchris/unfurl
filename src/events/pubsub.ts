export class Publisher<Message> {
  subscribers: Subscriber<Message>[]

  constructor() {
    this.subscribers = []
  }

  publish(message: Message) {
    this.subscribers.forEach((subscriber: Subscriber<Message>) => {
      subscriber.receive(message)
    })
  }

  register(subscriber: Subscriber<Message>) {
    this.subscribers.push(subscriber)
  }

  unregister(subscriber: Subscriber<Message>) {
    this.subscribers = this.subscribers.filter((s) => s !== subscriber)
  }
}

export class Subscriber<Message> {
  callback: (message: Message) => void

  constructor(callback: (message: Message) => void) {
    this.callback = callback
  }

  receive(message: Message) {
    this.callback(message)
  }

  subscribe(publisher: Publisher<Message>) {
    publisher.register(this)
  }

  unsubscribe(publisher: Publisher<Message>) {
    publisher.unregister(this)
  }
}
