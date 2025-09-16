import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Calendar, Clock, MapPin } from 'lucide-react';

interface StaffScheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  staffId: string;
  staffName?: string;
}

interface TimeSlot {
  id: string;
  label: string;
  time: string;
}

interface DaySchedule {
  date: string;
  dayOfWeek: string;
  timeSlots: {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
  };
}

const TIME_SLOTS: TimeSlot[] = [
  { id: 'morning', label: '朝', time: '10:00-14:00' },
  { id: 'afternoon', label: '昼', time: '14:00-18:00' },
  { id: 'evening', label: '夜', time: '18:00-22:00' }
];

const VENUES = ['馬場', '別館①', '別館②', '大久保', '大塚', '埼玉大宮'];

export function StaffScheduleDialog({ isOpen, onClose, staffId, staffName }: StaffScheduleDialogProps) {
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [selectedVenues, setSelectedVenues] = useState<string[]>([]);

  // 今週から4週間分の日付を生成
  useEffect(() => {
    const generateWeeklySchedule = () => {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // 日曜日から開始

      const weeklySchedule: DaySchedule[] = [];
      
      for (let week = 0; week < 4; week++) {
        for (let day = 0; day < 7; day++) {
          const currentDate = new Date(startOfWeek);
          currentDate.setDate(startOfWeek.getDate() + (week * 7) + day);
          
          const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
          
          weeklySchedule.push({
            date: currentDate.toISOString().split('T')[0],
            dayOfWeek: dayNames[currentDate.getDay()],
            timeSlots: {
              morning: false,
              afternoon: false,
              evening: false
            }
          });
        }
      }
      
      setSchedules(weeklySchedule);
    };

    if (isOpen) {
      generateWeeklySchedule();
      // 既存のスケジュールデータがあれば復元
      const savedSchedule = localStorage.getItem(`staff-schedule-${staffId}`);
      if (savedSchedule) {
        try {
          const parsed = JSON.parse(savedSchedule);
          setSchedules(parsed.schedules || []);
          setSelectedVenues(parsed.venues || []);
        } catch (error) {
          console.error('スケジュールデータの読み込みに失敗:', error);
        }
      }
    }
  }, [isOpen, staffId]);

  const handleTimeSlotChange = (dateIndex: number, timeSlot: keyof DaySchedule['timeSlots'], checked: boolean) => {
    setSchedules(prev => prev.map((schedule, index) => 
      index === dateIndex 
        ? { ...schedule, timeSlots: { ...schedule.timeSlots, [timeSlot]: checked } }
        : schedule
    ));
  };

  const handleVenueChange = (venue: string, checked: boolean) => {
    setSelectedVenues(prev => 
      checked 
        ? [...prev, venue]
        : prev.filter(v => v !== venue)
    );
  };

  const handleSave = () => {
    // スケジュールデータを保存
    const scheduleData = {
      staffId,
      staffName,
      schedules,
      venues: selectedVenues,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(`staff-schedule-${staffId}`, JSON.stringify(scheduleData));
    
    // 成功メッセージ（実際の実装では toast などを使用）
    alert(`${staffName || staffId} のスケジュールを保存しました`);
    onClose();
  };

  const getSelectedSlotsCount = () => {
    return schedules.reduce((total, schedule) => {
      return total + Object.values(schedule.timeSlots).filter(Boolean).length;
    }, 0);
  };

  const groupSchedulesByWeek = () => {
    const weeks: DaySchedule[][] = [];
    for (let i = 0; i < schedules.length; i += 7) {
      weeks.push(schedules.slice(i, i + 7));
    }
    return weeks;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            スタッフスケジュール: {staffName || staffId}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 勤務可能店舗選択 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="w-4 h-4" />
                勤務可能店舗
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {VENUES.map(venue => (
                  <div key={venue} className="flex items-center space-x-2">
                    <Checkbox
                      id={`venue-${venue}`}
                      checked={selectedVenues.includes(venue)}
                      onCheckedChange={(checked) => handleVenueChange(venue, checked as boolean)}
                    />
                    <label htmlFor={`venue-${venue}`} className="text-sm font-medium">
                      {venue}
                    </label>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <Badge variant="outline">
                  選択中: {selectedVenues.length}店舗
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* 週別スケジュール */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-4 h-4" />
                出勤可能時間帯（4週間分）
              </CardTitle>
              <div className="flex gap-2">
                <Badge variant="secondary">
                  選択済み: {getSelectedSlotsCount()}枠
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {groupSchedulesByWeek().map((week, weekIndex) => (
                  <div key={weekIndex} className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">
                      第{weekIndex + 1}週 ({week[0]?.date} ～ {week[6]?.date})
                    </h4>
                    <div className="grid grid-cols-7 gap-2">
                      {week.map((schedule, dayIndex) => {
                        const actualIndex = weekIndex * 7 + dayIndex;
                        const isToday = schedule.date === new Date().toISOString().split('T')[0];
                        
                        return (
                          <div 
                            key={schedule.date} 
                            className={`border rounded-lg p-3 space-y-2 ${isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                          >
                            <div className="text-center">
                              <div className="text-xs font-medium text-muted-foreground">
                                {schedule.dayOfWeek}
                              </div>
                              <div className="text-sm font-medium">
                                {schedule.date.split('-')[2]}
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              {TIME_SLOTS.map(timeSlot => (
                                <div key={timeSlot.id} className="flex items-center space-x-1">
                                  <Checkbox
                                    id={`${schedule.date}-${timeSlot.id}`}
                                    checked={schedule.timeSlots[timeSlot.id as keyof typeof schedule.timeSlots]}
                                    onCheckedChange={(checked) => 
                                      handleTimeSlotChange(actualIndex, timeSlot.id as keyof DaySchedule['timeSlots'], checked as boolean)
                                    }
                                  />
                                  <label 
                                    htmlFor={`${schedule.date}-${timeSlot.id}`}
                                    className="text-xs cursor-pointer"
                                  >
                                    {timeSlot.label}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={handleSave}>
            スケジュールを保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}