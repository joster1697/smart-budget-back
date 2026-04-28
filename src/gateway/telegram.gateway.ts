import crypto from 'crypto';
import { Telegraf } from 'telegraf';
import { User } from '../database/models/user';
import { ActionExecutorService } from '../services/action-executor.service';
import { processInput, ResolvedAction } from '../services/channel-processor';
import { AudioTranscriptionService } from '../services/ai/audio-transcription.service';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// Sesiones en memoria por chatId (equivalente a ws.pendingActions)
const sessions = new Map<string, ResolvedAction[]>();

// ── Busca o crea el usuario por chatId ────────────────────────────────────────
async function findOrCreateUser(chatId: string, firstName: string): Promise<User> {
  let user = await User.findOne({ where: { telegram_chat_id: chatId } });
  if (!user) {
    user = await User.create({
      name: firstName,
      email: `tg_${chatId}@smartbudget.internal`,
      password: crypto.randomBytes(16).toString('hex'),
      telegram_chat_id: chatId,
    });
  }
  return user;
}

// ── /start — registro automático ─────────────────────────────────────────────
bot.start(async (ctx) => {
  const chatId = String(ctx.chat.id);
  const firstName = ctx.from?.first_name ?? 'Usuario';

  const existing = await User.findOne({ where: { telegram_chat_id: chatId } });
  if (existing) {
    return ctx.reply(`👋 ¡Bienvenido de vuelta, ${existing.name}! Cuéntame qué quieres registrar.`);
  }

  await findOrCreateUser(chatId, firstName);
  await ctx.reply(
    `👋 ¡Hola, ${firstName}! Tu cuenta fue creada automáticamente.\n\n` +
    `Puedes decirme cosas como:\n` +
    `• "Gasté ₡5000 en almuerzo"\n` +
    `• "Ingresé ₡500000 de salario"\n` +
    `• "Crea una cuenta de ahorros con ₡100000"\n\n` +
    `¡Empieza cuando quieras!`,
  );
});

// ── Mensajes de texto ─────────────────────────────────────────────────────────
bot.on('text', async (ctx) => {
  const chatId = String(ctx.chat.id);
  const text = ctx.message.text;
  const firstName = ctx.from?.first_name ?? 'Usuario';

  const user = await findOrCreateUser(chatId, firstName);

  await ctx.sendChatAction('typing');

  const actions = await processInput(user.id, text.trim(), 'text');

  sessions.set(chatId, actions);

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];

    if (action.status === 'READY') {
      const result = await ActionExecutorService.execute(
        { ...action, resolved_id: (action.candidates as any)?.[0]?.id },
        user.id,
      );
      await ctx.reply(result.message);

    } else if (action.status === 'NEEDS_CONFIRMATION') {
      await ctx.reply(
        action.follow_up_question ?? '¿Confirmas?',
        {
          reply_markup: {
            inline_keyboard: [[
              { text: '✅ Confirmar', callback_data: `confirm:${i}` },
              { text: '❌ Cancelar', callback_data: 'cancel' },
            ]],
          },
        },
      );

    } else if (action.status === 'AMBIGUOUS') {
      const buttons = (action.candidates as any[]).map((c, ci) => ([
        { text: c.description ?? c.name ?? `Opción ${ci + 1}`, callback_data: `select:${i}:${ci}` },
      ]));
      buttons.push([{ text: '❌ Cancelar', callback_data: 'cancel' }]);
      await ctx.reply(action.follow_up_question ?? 'Selecciona cuál:', {
        reply_markup: { inline_keyboard: buttons },
      });

    } else if (action.status === 'NEEDS_CLARIFICATION') {
      await ctx.reply(action.follow_up_question ?? '¿Puedes dar más detalles?');
    }
  }
});

// ── Mensajes de voz ─────────────────────────────────────────────────────────
bot.on('voice', async (ctx) => {
  const chatId = String(ctx.chat.id);
  const firstName = ctx.from?.first_name ?? 'Usuario';
  const user = await findOrCreateUser(chatId, firstName);

  await ctx.sendChatAction('typing');

  // Descargar audio desde Telegram
  const fileLink = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
  const response = await fetch(fileLink.href);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Transcribir con Gemini
  const text = await AudioTranscriptionService.transcribe(buffer, 'audio/ogg');

  await ctx.reply(`🎙️ Entendí: "${text}"`);

  const actions = await processInput(user.id, text.trim(), 'audio');

  sessions.set(chatId, actions);

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];

    if (action.status === 'READY') {
      const result = await ActionExecutorService.execute(
        { ...action, resolved_id: (action.candidates as any)?.[0]?.id },
        user.id,
      );
      await ctx.reply(result.message);

    } else if (action.status === 'NEEDS_CONFIRMATION') {
      await ctx.reply(
        action.follow_up_question ?? '¿Confirmas?',
        {
          reply_markup: {
            inline_keyboard: [[
              { text: '✅ Confirmar', callback_data: `confirm:${i}` },
              { text: '❌ Cancelar', callback_data: 'cancel' },
            ]],
          },
        },
      );

    } else if (action.status === 'AMBIGUOUS') {
      const buttons = (action.candidates as any[]).map((c, ci) => ([
        { text: c.description ?? c.name ?? `Opción ${ci + 1}`, callback_data: `select:${i}:${ci}` },
      ]));
      buttons.push([{ text: '❌ Cancelar', callback_data: 'cancel' }]);
      await ctx.reply(action.follow_up_question ?? 'Selecciona cuál:', {
        reply_markup: { inline_keyboard: buttons },
      });

    } else if (action.status === 'NEEDS_CLARIFICATION') {
      await ctx.reply(action.follow_up_question ?? '¿Puedes dar más detalles?');
    }
  }
});

// ── Botones inline ────────────────────────────────────────────────────────────
bot.on('callback_query', async (ctx) => {
  const chatId = String(ctx.chat!.id);
  const data = (ctx.callbackQuery as any).text ?? (ctx.callbackQuery as any).data ?? '';
  const user = await User.findOne({ where: { telegram_chat_id: chatId } });
  if (!user) return ctx.answerCbQuery('Sesión expirada.');

  const pending = sessions.get(chatId);
  await ctx.answerCbQuery();

  if (data === 'cancel') {
    sessions.delete(chatId);
    return ctx.reply('❌ Cancelado.');
  }

  if (data.startsWith('confirm:') && pending) {
    const i = parseInt(data.split(':')[1]);
    const action = pending[i];
    const id = (action.candidates as any)?.[0]?.id;
    const result = await ActionExecutorService.execute({ ...action, resolved_id: id }, user.id);
    return ctx.reply(result.message);
  }

  if (data.startsWith('select:') && pending) {
    const [, ai, ci] = data.split(':').map(Number);
    const action = pending[ai];
    const candidate = (action.candidates as any)?.[ci];
    const result = await ActionExecutorService.execute({ ...action, resolved_id: candidate?.id }, user.id);
    return ctx.reply(result.message);
  }
});

export function startTelegramBot() {
  bot.launch();
  console.log('🤖 Telegram bot iniciado (long polling)');
}

export { bot }; // exportar para envío proactivo
