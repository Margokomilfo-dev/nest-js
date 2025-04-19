import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './email.service';
import { NotificationConfigService } from '../configuration/notification/notification-config.service';
import { SendConfirmationEmailWhenUserRegisteredEventHandler } from './event-handlers/send-confirmation-email.event-handler';
import { NotificationConfigModule } from '../configuration/notification/notification-config.module';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [NotificationConfigModule],
      inject: [NotificationConfigService],
      useFactory: (notificationConfigService: NotificationConfigService) => {
        console.log(notificationConfigService);
        return {
          transport: {
            host: notificationConfigService.MAIL_HOST,
            port: notificationConfigService.MAIL_PORT,
            secure: notificationConfigService.MAIL_SECURE, // true для порта 465, false для 587
            auth: {
              user: notificationConfigService.MAIL_USER,
              pass: notificationConfigService.MAIL_PASS,
            },
          },
          defaults: {
            from: `"No Reply =) " <${notificationConfigService.MAIL_USER}>`,
          },
        };
      },
    }),
  ],
  providers: [
    EmailService,
    SendConfirmationEmailWhenUserRegisteredEventHandler,
  ],
  exports: [],
})
export class NotificationsModule {}
