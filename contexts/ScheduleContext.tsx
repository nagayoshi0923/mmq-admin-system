import { createContext, useContext, ReactNode, useCallback } from 'react';
import { useSupabaseData } from '../hooks/useSupabaseData';

// スケジュールイベントの型定義
export type EventCategory = 'オープン公演' | '貸切公演' | 'GMテスト' | 'テストプレイ' | '出張公演';

export interface ScheduleEvent {
  id: string;
  date: string;
  venue: string;
  scenario: string;
  scenarioId?: string;
  gms: string[];
  start_time: string;
  end_time: string;
  category: EventCategory;
  reservation_info?: string | null;
  notes?: string | null;
  is_cancelled: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ScheduleContextType {
  events: ScheduleEvent[];
  loading: boolean;
  error: string | null;
  addEvent: (event: Omit<ScheduleEvent, 'id' | 'created_at' | 'updated_at'>) => Promise<{ data: ScheduleEvent | null; error: string | null }>;
  updateEvent: (id: string, updates: Partial<ScheduleEvent>) => Promise<{ data: ScheduleEvent | null; error: string | null }>;
  deleteEvent: (id: string) => Promise<{ error: string | null }>;
  refetch: () => Promise<void>;
  getEventsByMonth: (year: number, month: number) => ScheduleEvent[];
  getEventsByDate: (date: string) => ScheduleEvent[];
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const {
    data: events,
    loading,
    error,
    insert,
    update,
    delete: deleteScheduleEvent,
    refetch
  } = useSupabaseData<ScheduleEvent>({
    table: 'schedule_events',
    realtime: true,
    // fallbackKey: 'murder-mystery-schedule', // ローカルストレージを無効化
    orderBy: { column: 'date', ascending: true }
  });

  const addEvent = useCallback(async (eventData: Omit<ScheduleEvent, 'id' | 'created_at' | 'updated_at'>) => {
    // データベースのカラム名に合わせて変換
    const dbEventData = {
      date: eventData.date,
      venue: eventData.venue,
      scenario: eventData.scenario,
      gms: eventData.gms,
      start_time: eventData.start_time,
      end_time: eventData.end_time,
      category: eventData.category,
      reservation_info: eventData.reservation_info || null,
      notes: eventData.notes || null,
      is_cancelled: eventData.is_cancelled || false
    };

    return await insert(dbEventData);
  }, [insert]);

  const updateEvent = useCallback(async (id: string, updates: Partial<ScheduleEvent>) => {
    // データベースのカラム名に合わせて変換
    const dbUpdates: any = {};
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.venue !== undefined) dbUpdates.venue = updates.venue;
    if (updates.scenario !== undefined) dbUpdates.scenario = updates.scenario;
    if (updates.gms !== undefined) dbUpdates.gms = updates.gms;
    if (updates.start_time !== undefined) dbUpdates.start_time = updates.start_time;
    if (updates.end_time !== undefined) dbUpdates.end_time = updates.end_time;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.reservation_info !== undefined) dbUpdates.reservation_info = updates.reservation_info;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.is_cancelled !== undefined) dbUpdates.is_cancelled = updates.is_cancelled;

    return await update(id, dbUpdates);
  }, [update]);

  const deleteEvent = useCallback(async (id: string) => {
    return await deleteScheduleEvent(id);
  }, [deleteScheduleEvent]);

  const getEventsByMonth = useCallback((year: number, month: number) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= startDate && eventDate <= endDate;
    });
  }, [events]);

  const getEventsByDate = useCallback((date: string) => {
    return events.filter(event => event.date === date);
  }, [events]);

  return (
    <ScheduleContext.Provider value={{
      events,
      loading,
      error,
      addEvent,
      updateEvent,
      deleteEvent,
      refetch,
      getEventsByMonth,
      getEventsByDate
    }}>
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
}
