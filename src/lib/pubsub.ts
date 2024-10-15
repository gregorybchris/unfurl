export class Publisher<T> {
  subscribers: Subscriber<T>[];

  constructor() {
    this.subscribers = [];
  }

  publish(message: T) {
    this.subscribers.forEach((subscriber: Subscriber<T>) => {
      subscriber.receive(message);
    });
  }

  register(subscriber: Subscriber<T>) {
    this.subscribers.push(subscriber);
  }
}

export class Subscriber<T> {
  callback: (message: T) => void;

  constructor(callback: (message: T) => void) {
    this.callback = callback;
  }

  receive(message: T) {
    this.callback(message);
  }

  subscribe(publisher: Publisher<T>) {
    publisher.register(this);
  }
}
