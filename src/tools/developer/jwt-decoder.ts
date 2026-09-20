import { ToolDefinition, ProcessContext, ProcessResult } from '../../types/tool';

export const jwtDecoderTool: ToolDefinition = {
  id: 'jwt-decoder',
  name: 'JWT Decoder (JSON Web Token)',
  shortDescription: 'Decode token JWT, periksa isi payload dan waktu kedaluwarsa',
  description: 'Bongkar isi Header & Payload JWT secara aman di browser tanpa pernah mengirim token ke server atau pihak ketiga manapun.',
  category: 'developer',
  inputMode: 'text',
  icon: 'KeyRound',
  popular: false,
  localProcessing: true,
  supportsBatch: false,
  supportsWorkflow: false,
  keywords: ['jwt', 'jwt decoder', 'decode jwt', 'token payload', 'bearer token', 'json web token'],
  process: async (context: ProcessContext): Promise<ProcessResult> => {
    const raw = (context.textInput || '').trim();
    if (!raw) {
      throw new Error('Masukkan string token JWT.');
    }

    if (raw.length > 100000) {
      throw new Error('String token JWT terlalu panjang (maks 100 KB).');
    }

    const token = raw.replace(/^Bearer\s+/i, '').trim();
    const parts = token.split('.');

    if (parts.length < 2) {
      throw new Error('Format JWT tidak valid. Token harus memiliki minimal header dan payload yang dipisahkan titik.');
    }

    try {
      const decodeBase64Url = (str: string) => {
        let output = str.replace(/-/g, '+').replace(/_/g, '/');
        switch (output.length % 4) {
          case 0:
            break;
          case 2:
            output += '==';
            break;
          case 3:
            output += '=';
            break;
          default:
            throw new Error('Base64url string rusak');
        }
        const binary = atob(output);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        return new TextDecoder().decode(bytes);
      };

      const headerJson = JSON.parse(decodeBase64Url(parts[0]));
      const payloadJson = JSON.parse(decodeBase64Url(parts[1]));

      let expInfo = '';
      if (payloadJson.exp && typeof payloadJson.exp === 'number') {
        const expDate = new Date(payloadJson.exp * 1000);
        const isExpired = Date.now() > payloadJson.exp * 1000;
        expInfo = `Expired: ${expDate.toLocaleString('id-ID')} (${isExpired ? 'SUDAH KEDALUWARSA' : 'MASIH AKTIF'})`;
      }

      const formattedOutput = [
        '=== HEADER ===',
        JSON.stringify(headerJson, null, 2),
        '',
        '=== PAYLOAD ===',
        JSON.stringify(payloadJson, null, 2),
        ...(expInfo ? ['', `=== STATUS: ${expInfo} ===`] : [])
      ].join('\n');

      return {
        success: true,
        message: 'Token JWT berhasil di-decode!',
        items: [
          {
            id: 'jwt_result',
            name: 'jwt_decoded.txt',
            size: formattedOutput.length,
            type: 'text/plain',
            textOutput: formattedOutput,
            metadata: {
              header: headerJson,
              payload: payloadJson,
              isExpired: typeof payloadJson.exp === 'number' ? Date.now() > payloadJson.exp * 1000 : null
            }
          }
        ]
      };
    } catch (err: any) {
      throw new Error(`Gagal membaca token JWT: ${err.message}`);
    }
  }
};
