import { consumeEvent } from "../config/rabbitmq";
import { queuePasswordEmail } from "../services/emailService";

export async function startConsumer() {
  await consumeEvent('user.events', async (event) => {
    switch (event.type) {
      case 'user.created':
        await queuePasswordEmail(event.payload.email, event.payload.senha, 'register');
        break;
      case 'user.password_reset':
        await queuePasswordEmail(event.payload.email, event.payload.senha, 'reset');
        break;
      case 'user.role_changed':
        console.log(`Role alterada: ${event.payload.userId} -> ${event.payload.role}`);
        break;
      default:
        console.log('Evento desconhecido:', event);
    }
  });
}
