// Синхронизация API событий с eventLogService

import { canvibeApi } from './api';
import { eventLogService } from './eventLog';
import { ThoughtEvent } from '@/types/events';

export class ApiSyncService {
  private syncInterval: number | null = null;
  private isSyncing = false;

  async startAutoSync(intervalMs: number = 3000) {
    if (this.syncInterval) {
      return;
    }

    // Первая синхронизация
    await this.syncApiEventsToLog();

    // Автоматическая синхронизация
    this.syncInterval = window.setInterval(() => {
      if (!this.isSyncing) {
        this.syncApiEventsToLog();
      }
    }, intervalMs);
  }

  stopAutoSync() {
    if (this.syncInterval !== null) {
      window.clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  private async syncApiEventsToLog() {
    try {
      this.isSyncing = true;

      // Получаем события из API
      const apiResponse = await canvibeApi.getEvents();
      const apiEvents = apiResponse.data || [];

      if (!apiEvents.length) {
        return;
      }

      // Получаем события из event log
      const localEvents = await eventLogService.readEvents();
      const localEventIds = new Set(localEvents.map(e => e.id));

      // Находим новые события в API
      const newEvents = apiEvents.filter((e: any) => {
        const eventId = e.id || e.event_id;
        return eventId && !localEventIds.has(eventId);
      });

      // Добавляем новые события в event log
      for (const apiEvent of newEvents) {
        try {
          const thoughtEvent: ThoughtEvent = {
            id: apiEvent.id || `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: apiEvent.type || apiEvent.event_type,
            timestamp: apiEvent.timestamp || new Date().toISOString(),
            actor: apiEvent.actor || 'system',
            context: apiEvent.context || {
              project: '',
              git_branch: null,
              git_commit: null,
            },
            payload: apiEvent.data || apiEvent.payload || {},
          } as ThoughtEvent;

          await eventLogService.appendEvent(thoughtEvent);
        } catch (error) {
          console.warn('Failed to sync event:', error);
        }
      }

      if (newEvents.length > 0) {
        console.log(`Synced ${newEvents.length} new events from API`);
      }
    } catch (error) {
      console.error('Failed to sync API events:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  // Синхронизация событий из event log в API (для обратной совместимости)
  async syncLogEventsToApi() {
    try {
      const localEvents = await eventLogService.readEvents();

      // Получаем события из API
      const apiResponse = await canvibeApi.getEvents();
      const apiEvents = apiResponse.data || [];
      const apiEventIds = new Set(apiEvents.map((e: any) => e.id));

      // Находим события, которых нет в API
      const missingEvents = localEvents.filter(e => !apiEventIds.has(e.id));

      // Добавляем их в API
      for (const event of missingEvents) {
        try {
          await canvibeApi.createEvent(event.type, event.payload);
        } catch (error) {
          console.warn('Failed to sync event to API:', error);
        }
      }

      if (missingEvents.length > 0) {
        console.log(`Synced ${missingEvents.length} events to API`);
      }
    } catch (error) {
      console.error('Failed to sync log events to API:', error);
    }
  }
}

export const apiSyncService = new ApiSyncService();
