import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  DollarSign, 
  Plus, 
  Edit, 
  Trash2,
  Calculator,
  TrendingUp,
  Users
} from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { useStaff } from '../contexts/StaffContext';
import { useScenarios } from '../contexts/ScenarioContext';
import { useSchedule } from '../contexts/ScheduleContext';
import dayjs from 'dayjs';
import 'dayjs/locale/ja';

dayjs.locale('ja');

interface ScenarioSalary {
  id: string;
  scenario_title: string;
  role: 'GM' | 'サポート';
  base_salary: number;
  bonus_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface StaffAttendance {
  id: string;
  staff_id: string;
  event_id: string;
  scenario_title: string;
  role: 'GM' | 'サポート';
  date: string;
  venue: string;
  start_time: string;
  end_time: string;
  salary_amount: number;
  status: 'pending' | 'approved' | 'paid';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface SalarySummary {
  staffId: string;
  staffName: string;
  totalSessions: number;
  totalAmount: number;
  pendingAmount: number;
  paidAmount: number;
  byScenario: {
    scenario: string;
    sessions: number;
    amount: number;
  }[];
}

export function SalaryManager() {
  const { staff } = useStaff();
  const { scenarios } = useScenarios();
  const { events } = useSchedule();
  
  // シナリオ給料データ
  const {
    data: scenarioSalaries,
    loading: salariesLoading,
    insert: insertSalary,
    update: updateSalary,
    delete: deleteSalary
  } = useSupabaseData<ScenarioSalary>({
    table: 'scenario_salaries',
    realtime: true,
    orderBy: { column: 'scenario_title', ascending: true }
  });

  // 出勤記録データ
  const {
    data: attendanceRecords,
    loading: attendanceLoading,
    insert: insertAttendance,
    update: updateAttendance
  } = useSupabaseData<StaffAttendance>({
    table: 'staff_attendance',
    realtime: true,
    orderBy: { column: 'date', ascending: false }
  });

  const [isSalaryDialogOpen, setIsSalaryDialogOpen] = useState(false);
  const [editingSalary, setEditingSalary] = useState<ScenarioSalary | null>(null);
  const [newSalary, setNewSalary] = useState({
    scenario_title: '',
    role: 'GM' as 'GM' | 'サポート',
    base_salary: 0,
    bonus_rate: 0,
    is_active: true
  });

  // 給料サマリーを計算
  const salarySummaries = useMemo((): SalarySummary[] => {
    return staff.map(staffMember => {
      const memberAttendance = attendanceRecords.filter(record => record.staff_id === staffMember.id);
      
      const byScenario = memberAttendance.reduce((acc, record) => {
        const existing = acc.find(item => item.scenario === record.scenario_title);
        if (existing) {
          existing.sessions += 1;
          existing.amount += record.salary_amount;
        } else {
          acc.push({
            scenario: record.scenario_title,
            sessions: 1,
            amount: record.salary_amount
          });
        }
        return acc;
      }, [] as { scenario: string; sessions: number; amount: number }[]);

      const totalAmount = memberAttendance.reduce((sum, record) => sum + record.salary_amount, 0);
      const pendingAmount = memberAttendance
        .filter(record => record.status === 'pending')
        .reduce((sum, record) => sum + record.salary_amount, 0);
      const paidAmount = memberAttendance
        .filter(record => record.status === 'paid')
        .reduce((sum, record) => sum + record.salary_amount, 0);

      return {
        staffId: staffMember.id,
        staffName: staffMember.name,
        totalSessions: memberAttendance.length,
        totalAmount,
        pendingAmount,
        paidAmount,
        byScenario
      };
    });
  }, [staff, attendanceRecords]);

  // 出勤記録を自動生成（スケジュールイベントから）
  const generateAttendanceFromEvents = async () => {
    const newAttendanceRecords: Omit<StaffAttendance, 'id'>[] = [];

    for (const event of events) {
      if (event.gms && event.gms.length > 0) {
        for (const gmName of event.gms) {
          const staffMember = staff.find(s => s.name === gmName);
          if (staffMember) {
            const salary = scenarioSalaries.find(s => 
              s.scenario_title === event.scenario && 
              s.role === 'GM' && 
              s.is_active
            );
            
            if (salary) {
              newAttendanceRecords.push({
                staff_id: staffMember.id,
                event_id: event.id,
                scenario_title: event.scenario,
                role: 'GM',
                date: event.date,
                venue: event.venue,
                start_time: event.start_time,
                end_time: event.end_time,
                salary_amount: salary.base_salary,
                status: 'pending',
                notes: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            }
          }
        }
      }
    }

    // 重複チェックして新しいレコードのみ追加
    for (const record of newAttendanceRecords) {
      const exists = attendanceRecords.some(existing => 
        existing.staff_id === record.staff_id && 
        existing.event_id === record.event_id
      );
      
      if (!exists) {
        await insertAttendance(record);
      }
    }
  };

  // 給料設定を保存
  const handleSaveSalary = async () => {
    if (!newSalary.scenario_title || newSalary.base_salary <= 0) return;

    try {
      if (editingSalary) {
        await updateSalary(editingSalary.id, newSalary);
      } else {
        const salaryData = {
          ...newSalary,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        await insertSalary(salaryData);
      }
      
      setNewSalary({
        scenario_title: '',
        role: 'GM',
        base_salary: 0,
        bonus_rate: 0,
        is_active: true
      });
      setEditingSalary(null);
      setIsSalaryDialogOpen(false);
    } catch (error) {
      console.error('給料設定の保存に失敗:', error);
    }
  };

  // 給料設定を編集
  const handleEditSalary = (salary: ScenarioSalary) => {
    setEditingSalary(salary);
    setNewSalary({
      scenario_title: salary.scenario_title,
      role: salary.role,
      base_salary: salary.base_salary,
      bonus_rate: salary.bonus_rate,
      is_active: salary.is_active
    });
    setIsSalaryDialogOpen(true);
  };

  // 給料設定を削除
  const handleDeleteSalary = async (id: string) => {
    if (confirm('この給料設定を削除しますか？')) {
      try {
        await deleteSalary(id);
      } catch (error) {
        console.error('給料設定の削除に失敗:', error);
      }
    }
  };

  if (salariesLoading || attendanceLoading) {
    return (
      <Card className="w-full max-w-6xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            読み込み中...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="w-6 h-6" />
            給与管理
          </h1>
          <p className="text-muted-foreground">
            シナリオごとの給料設定と出勤記録の管理
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={generateAttendanceFromEvents}>
            <Calculator className="w-4 h-4 mr-2" />
            出勤記録を生成
          </Button>
          <Button onClick={() => setIsSalaryDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            給料設定を追加
          </Button>
        </div>
      </div>

      {/* 給料設定一覧 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            シナリオ給料設定
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>シナリオ</TableHead>
                <TableHead>役割</TableHead>
                <TableHead>基本給</TableHead>
                <TableHead>ボーナス率</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scenarioSalaries.map((salary) => (
                <TableRow key={salary.id}>
                  <TableCell className="font-medium">{salary.scenario_title}</TableCell>
                  <TableCell>
                    <Badge variant={salary.role === 'GM' ? 'default' : 'secondary'}>
                      {salary.role}
                    </Badge>
                  </TableCell>
                  <TableCell>¥{salary.base_salary.toLocaleString()}</TableCell>
                  <TableCell>{salary.bonus_rate}%</TableCell>
                  <TableCell>
                    <Badge variant={salary.is_active ? 'default' : 'secondary'}>
                      {salary.is_active ? '有効' : '無効'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditSalary(salary)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSalary(salary.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* スタッフ別給与サマリー */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            スタッフ別給与サマリー
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {salarySummaries.map((summary) => (
              <Card key={summary.staffId}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{summary.staffName}</CardTitle>
                    <div className="flex gap-4 text-sm">
                      <div>総出勤: {summary.totalSessions}回</div>
                      <div>総額: ¥{summary.totalAmount.toLocaleString()}</div>
                      <div className="text-orange-600">未払い: ¥{summary.pendingAmount.toLocaleString()}</div>
                      <div className="text-green-600">支払済み: ¥{summary.paidAmount.toLocaleString()}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>シナリオ</TableHead>
                        <TableHead>出勤回数</TableHead>
                        <TableHead>給与額</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.byScenario.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.scenario}</TableCell>
                          <TableCell>{item.sessions}回</TableCell>
                          <TableCell>¥{item.amount.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 給料設定ダイアログ */}
      <Dialog open={isSalaryDialogOpen} onOpenChange={setIsSalaryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSalary ? '給料設定を編集' : '給料設定を追加'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>シナリオ</Label>
              <Select
                value={newSalary.scenario_title}
                onValueChange={(value) => setNewSalary(prev => ({ ...prev, scenario_title: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="シナリオを選択" />
                </SelectTrigger>
                <SelectContent>
                  {scenarios.map((scenario) => (
                    <SelectItem key={scenario.id} value={scenario.title}>
                      {scenario.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>役割</Label>
              <Select
                value={newSalary.role}
                onValueChange={(value) => setNewSalary(prev => ({ ...prev, role: value as 'GM' | 'サポート' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GM">GM</SelectItem>
                  <SelectItem value="サポート">サポート</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>基本給</Label>
              <Input
                type="number"
                value={newSalary.base_salary}
                onChange={(e) => setNewSalary(prev => ({ ...prev, base_salary: parseInt(e.target.value) || 0 }))}
                placeholder="基本給を入力"
              />
            </div>
            <div>
              <Label>ボーナス率 (%)</Label>
              <Input
                type="number"
                value={newSalary.bonus_rate}
                onChange={(e) => setNewSalary(prev => ({ ...prev, bonus_rate: parseInt(e.target.value) || 0 }))}
                placeholder="ボーナス率を入力"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSalaryDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSaveSalary}>
              {editingSalary ? '更新' : '追加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
