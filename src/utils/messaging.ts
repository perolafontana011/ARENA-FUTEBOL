import { formatBRL } from './pix';

export interface CollectionTemplate {
  id: string;
  title: string;
  description: string;
  tone: 'amigavel' | 'lembrete_rodada' | 'urgente';
  generate: (params: {
    customerName: string;
    amount: number;
    teamOrShirt?: string;
    pixCopiaECola?: string;
    pixKey?: string;
    pixKeyType?: string;
    daysOverdue?: number;
  }) => string;
}

export const COLLECTION_TEMPLATES: CollectionTemplate[] = [
  {
    id: 'amigavel_jogo',
    title: 'Pós-Jogo Amistoso',
    description: 'Tom leve e esportivo, ideal após o término das partidas do dia.',
    tone: 'amigavel',
    generate: ({ customerName, amount, teamOrShirt, pixCopiaECola, pixKey, pixKeyType }) => {
      const primeiroNome = customerName.split(' ')[0];
      const timeInfo = teamOrShirt ? ` (${teamOrShirt})` : '';
      return (
`Fala ${primeiroNome}${timeInfo}! Beleza, craque? ⚽

Passando aqui da Barraca do Campeonato pra te agradecer pela presença e mandar o fechamento da sua comanda de hoje:

💰 Total a acertar: *${formatBRL(amount)}*

Pra facilitar, você pode pagar direto no PIX com a chave ou copia e cola abaixo:
🔑 Chave PIX (${pixKeyType || 'Chave'}): *${pixKey || ''}*

📱 Código PIX Copia e Cola:
\`\`\`${pixCopiaECola || ''}\`\`\`

Assim que fizer, só mandar o comprovante aqui. Valeu e boa sorte no próximo jogo!`
      );
    },
  },
  {
    id: 'lembrete_rodada',
    title: 'Fechamento de Rodada',
    description: 'Lembrete formal para acertar o fiado antes da próxima rodada.',
    tone: 'lembrete_rodada',
    generate: ({ customerName, amount, pixCopiaECola, pixKey, pixKeyType }) => {
      const primeiroNome = customerName.split(' ')[0];
      return (
`Olá, ${primeiroNome}! Tudo bem? 📋

Estamos fechando o caixa da rodada deste final de semana no campeonato. Consta uma comanda pendente na barraca:

💵 Saldo pendente: *${formatBRL(amount)}*

Você pode quitar rapidamente via PIX:
🔑 Chave: *${pixKey || ''}* (${pixKeyType || 'PIX'})

Copia e cola:
\`\`\`${pixCopiaECola || ''}\`\`\`

Manter o saldo em dia garante que seu crédito continue liberado para os próximos jogos! Qualquer dúvida estamos à disposição.`
      );
    },
  },
  {
    id: 'inadimplente_urgente',
    title: 'Cobrança de Débito Vencido',
    description: 'Notificação para clientes em atraso superior ao prazo combinado.',
    tone: 'urgente',
    generate: ({ customerName, amount, daysOverdue, pixCopiaECola, pixKey }) => {
      const diasTexto = daysOverdue ? `há mais de ${daysOverdue} dias` : 'já vencido';
      return (
`Prezado(a) ${customerName},

Entramos em contato referente ao saldo em aberto na Barraca do Campeonato no valor de *${formatBRL(amount)}*, ${diasTexto}.

Solicitamos a regularização do débito para evitar o bloqueio da sua caderneta/comanda nos próximos jogos do torneio.

Quitação via PIX:
🔑 Chave PIX: *${pixKey || ''}*

Copia e cola PIX:
\`\`\`${pixCopiaECola || ''}\`\`\`

Caso já tenha efetuado o pagamento nas últimas horas, por favor desconsidere ou envie o comprovante por aqui. Obrigado!`
      );
    },
  },
];

/**
 * Creates a WhatsApp click-to-chat URL with pre-filled text.
 */
export function createWhatsAppUrl(phone: string, text: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Plays a pleasant synthetic Web Audio chime for push notifications or PIX receipts.
 */
export function playNotificationSound(type: 'success' | 'alert' | 'push' | 'pix' = 'push'): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    if (type === 'success' || type === 'pix') {
      // Pleasant double chord (PIX received)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.18); // D6

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.45);
      osc2.stop(now + 0.45);
    } else if (type === 'alert') {
      // Two-tone warning
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(330, now + 0.12);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      // Clean high push chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(783.99, now); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.08); // C6

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch {
    // Audio might be blocked if user hasn't interacted with document yet
  }
}

/**
 * Triggers browser notification if permission is granted.
 */
export async function triggerBrowserPushNotification(title: string, body: string): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
    });
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
      });
      return true;
    }
  }

  return false;
}
