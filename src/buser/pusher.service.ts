// pusher.service.ts
import { Injectable } from "@nestjs/common";
import * as Pusher from "pusher";

@Injectable()
export class PusherService {
  pusher: Pusher;

  constructor() {
    this.pusher = new Pusher({
      appId: "1800129",
      key: "b8c7db949ba052d945a4",
      secret: "2402d71703c60fe9f7b2",
      cluster: "ap2",
      useTLS: true
    });
  }

  async trigger(channel: string, event: string, data: any) {
    await this.pusher.trigger(channel, event, data);
  }
}
