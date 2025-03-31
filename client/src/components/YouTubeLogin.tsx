import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FaYoutube } from "react-icons/fa";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface YouTubeLoginProps {
  onLoginSuccess: (cookieData: string) => void;
}

export default function YouTubeLogin({ onLoginSuccess }: YouTubeLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      return apiRequest('/api/youtube/login', 'POST', credentials);
    },
    onSuccess: (data: { cookieData: string }) => {
      if (data && data.cookieData) {
        onLoginSuccess(data.cookieData);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ username, password });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FaYoutube className="h-6 w-6 text-red-600" />
          <CardTitle>YouTube Login</CardTitle>
        </div>
        <CardDescription>
          Log in with your YouTube account to bypass download restrictions.
          Your credentials are sent directly to YouTube and are not stored on our servers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Email or Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your YouTube email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          
          {loginMutation.isPending && (
            <div className="text-center text-sm text-muted-foreground">
              Logging in to YouTube...
            </div>
          )}
          
          {loginMutation.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                {loginMutation.error?.message || "Failed to log in. Please check your credentials and try again."}
              </AlertDescription>
            </Alert>
          )}
          
          <Button 
            type="submit" 
            className="w-full bg-red-600 hover:bg-red-700"
            disabled={loginMutation.isPending}
          >
            Log In to YouTube
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        <p>
          We use cookies only to authenticate your YouTube session.
          Your login information is never stored on our servers.
        </p>
      </CardFooter>
    </Card>
  );
}