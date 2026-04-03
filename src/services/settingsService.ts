import { supabase } from '@/core/supabaseClient';

export const settingsService = {
  async getSetting(key: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', key)
        .maybeSingle();

      if (error) {
        console.error('[settingsService.getSetting]', error.message);
        return null;
      }

      return data?.value ?? null;
    } catch (error) {
      console.error('[settingsService.getSetting]', error);
      return null;
    }
  },

  async setSetting(key: string, value: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert(
          { key, value, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );

      if (error) {
        console.error('[settingsService.setSetting]', error.message);
        throw error;
      }
    } catch (error) {
      console.error('[settingsService.setSetting]', error);
      throw error;
    }
  },

  async getStoreWhatsApp(): Promise<string | null> {
    return this.getSetting('store_whatsapp_e164');
  },

  async setStoreWhatsApp(phoneNumber: string): Promise<void> {
    return this.setSetting('store_whatsapp_e164', phoneNumber);
  },

  async getWebhookEnabled(): Promise<boolean> {
    const value = await this.getSetting('webhook_enabled');
    const result = value === 'true';
    console.log('[settingsService.getWebhookEnabled]', {
      valueFromDB: value,
      valueType: typeof value,
      result: result,
      resultType: typeof result,
    });
    return result;
  },

  async getWebhookSendAmbienceClick(): Promise<boolean> {
    const value = await this.getSetting('webhook_send_ambience_click');
    const result = value === 'true';
    console.log('[settingsService.getWebhookSendAmbienceClick]', {
      valueFromDB: value,
      valueType: typeof value,
      result: result,
      resultType: typeof result,
    });
    return result;
  },

  async setWebhookSendAmbienceClick(enabled: boolean): Promise<void> {
    return this.setSetting('webhook_send_ambience_click', enabled ? 'true' : 'false');
  },
};