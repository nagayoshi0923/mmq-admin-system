import { useState, useEffect, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Shield, Lock, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

interface AdminAuthGuardProps {
  children: ReactNode;
}

const ADMIN_PASSWORD = '0909'; // 現在のパスワード
const SESSION_KEY = 'mm_admin_session';
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8時間

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // セッション確認
    const session = localStorage.getItem(SESSION_KEY);
    if (session) {
      try {
        const sessionData = JSON.parse(session);
        const now = Date.now();
        
        if (now - sessionData.timestamp < SESSION_DURATION) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      const sessionData = {
        timestamp: Date.now(),
        authenticated: true
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('パスワードが間違っています');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
    setPassword('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="flex items-center justify-center gap-2">
              <Lock className="w-5 h-5" />
              管理システムログイン
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                このシステムは認可されたスタッフのみアクセス可能です
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="password">管理者パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="パスワードを入力"
              />
            </div>
            
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            <Button onClick={handleLogin} className="w-full">
              ログイン
            </Button>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                🔒 セッション有効期限: 8時間
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* ログアウトボタンをヘッダーに追加 */}
      <div className="fixed top-4 right-4 z-50">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleLogout}
          className="bg-background/80 backdrop-blur-sm"
        >
          <Lock className="w-4 h-4 mr-2" />
          ログアウト
        </Button>
      </div>
      {children}
    </div>
  );
}