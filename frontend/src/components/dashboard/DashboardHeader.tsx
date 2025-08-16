import React from 'react';
import { Bell, Search, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthGuard';

export const DashboardHeader = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth(); 

  const handleLogout = async () => {
    try {
      const res = await fetch("https://api.sewmrsms.co.tz/api/v1/auth/logout", {
        method: "POST",
        credentials: "include", 
      });
      const data = await res.json();

      if (data.success) {
        toast({
          title: "Logged out successfully",
          description: "You have been logged out of your account.",
          variant: "success",
        });
        navigate("/");
      } else {
        throw new Error(data.message || "Logout failed");
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: err.message || "Unable to logout",
        variant: "destructive",
      });
    }
  };


  return (
    <header className="h-16 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-6">
        <SidebarTrigger className="mr-4" />

        <div className="flex items-center space-x-4 flex-1">
          {/* Search */}
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search messages, contacts..."
              className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* SMS Credits Badge */}
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {user?.remaining_sms ?? 0} SMS
          </Badge>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={user?.username || "User"} />
                  <AvatarFallback>
                    {user?.first_name?.[0]}
                    {user?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user ? `${user.first_name} ${user.last_name}` : "Loading..."}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/console/settings/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/console/settings')}>
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
