import React, { useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await adminApi.login(username, password);
      onLoginSuccess();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <Card className="w-full max-w-md border-2 border-primary/20 bg-background/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-primary">
            🔧 Admin Panel
          </CardTitle>
          <p className="text-muted-foreground">
            JSON Data Editor Access
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive text-destructive-foreground rounded-md">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="block text-sm font-medium">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
                className="w-full p-3 border-2 border-border rounded-lg focus:border-primary focus:outline-none transition-colors"
                placeholder="Enter admin username"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="w-full p-3 border-2 border-border rounded-lg focus:border-primary focus:outline-none transition-colors"
                placeholder="Enter admin password"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full py-3 text-lg"
              disabled={isLoading || !username.trim() || !password.trim()}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Logging in...
                </>
              ) : (
                'Login to Admin Panel'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Admin credentials are configured in the backend .env file</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};