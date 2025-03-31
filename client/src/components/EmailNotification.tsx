import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Bell } from "lucide-react";

interface EmailNotificationProps {
  onEmailChange: (email: string | null) => void;
}

export default function EmailNotification({ onEmailChange }: EmailNotificationProps) {
  const [enableNotification, setEnableNotification] = useState(false);
  const [email, setEmail] = useState("");
  const [isValidEmail, setIsValidEmail] = useState(true);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return email === "" || emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    const isValid = validateEmail(newEmail);
    setIsValidEmail(isValid);
    
    if (enableNotification && isValid && newEmail) {
      onEmailChange(newEmail);
    } else {
      onEmailChange(null);
    }
  };

  const handleToggleChange = (checked: boolean) => {
    setEnableNotification(checked);
    if (checked && email && isValidEmail) {
      onEmailChange(email);
    } else {
      onEmailChange(null);
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Bell className="h-5 w-5 text-indigo-500" />
          <h3 className="font-medium">Email Notification</h3>
        </div>
        
        <div className="flex items-center space-x-2 mb-3">
          <Switch 
            id="notification" 
            checked={enableNotification}
            onCheckedChange={handleToggleChange}
          />
          <Label htmlFor="notification">
            Notify me when download completes
          </Label>
        </div>
        
        {enableNotification && (
          <div className="mt-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              type="email"
              id="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={handleEmailChange}
              className={isValidEmail ? "" : "border-red-500"}
            />
            
            {!isValidEmail && (
              <p className="text-red-500 text-sm mt-1">
                Please enter a valid email address
              </p>
            )}
            
            <p className="text-gray-500 text-xs mt-2">
              We'll send you a notification when your download is complete.
              Your email is only used for this notification and will not be stored.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}