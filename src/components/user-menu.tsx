'use client';

import React, { useContext } from 'react';
import { LogOut, User as UserIcon } from 'lucide-react';
import { FirebaseContext } from '@/firebase';
import { signInWithGoogle } from '@/firebase/non-blocking-login';
import { useStorage } from '@/repositories/storage-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from '@/hooks/use-translation';
import { useToast } from '@/hooks/use-toast';

export function UserMenu(): React.JSX.Element {
  const { user, isUserLoading: isLoading, backend } = useStorage();
  const firebaseCtx = useContext(FirebaseContext);
  const { t } = useTranslation();
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!firebaseCtx?.areServicesAvailable || !firebaseCtx.auth) {
      toast({
        variant: 'destructive',
        title: t('signInFailedGeneric'),
      });
      return;
    }
    try {
      await signInWithGoogle(firebaseCtx.auth);
    } catch (error) {
      console.error('Login failed:', error);
      toast({
        variant: 'destructive',
        title: t('auth.loginError') || t('signInFailedGeneric'),
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const handleLogout = async () => {
    try {
      await backend?.signOut();
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        variant: 'destructive',
        title: t('auth.logoutError') || 'Logout failed',
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  if (isLoading) {
    return (
      <div
        className="h-10 w-10 rounded-full bg-muted animate-pulse"
        role="status"
        aria-label="Loading user menu"
      >
        <span className="sr-only">Loading user menu</span>
      </div>
    );
  }

  if (!user) {
    return (
      <Button variant="outline" onClick={handleLogin}>
        {t('login') || t('signInWithGoogle')}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
            <AvatarFallback>{user.displayName?.charAt(0) || <UserIcon />}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t('logout') || 'Log Out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
