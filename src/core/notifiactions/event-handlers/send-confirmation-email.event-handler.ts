import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { EmailService } from '../email.service';

export class SendInvitationEvent {
  constructor(public readonly email: string, public confirmationCode: string) {}
}

// https://docs.nestjs.com/recipes/cqrs#events
@EventsHandler(SendInvitationEvent)
export class SendConfirmationEmailWhenUserRegisteredEventHandler
  implements IEventHandler<SendInvitationEvent>
{
  constructor(private emailService: EmailService) {}

  async handle(event: SendInvitationEvent) {
    // Ошибки в EventHandlers не могут быть пойманы фильтрами исключений:
    // необходимо обрабатывать вручную
    try {
      console.log('event:', event);
      await this.emailService.sendConfirmationEmail(
        event.email,
        event.confirmationCode,
      );
    } catch (e) {
      console.error('send email', e);
    }
  }
}
